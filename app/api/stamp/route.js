import { NextResponse } from "next/server";
import { verifyQrPayload } from "../../../lib/qr";
import { adminDb, adminConfigured } from "../../../lib/firebase-admin";

// One customer can only earn one stamp per shop within this window,
// to stop repeated scans of the same QR from farming stamps.
const COOLDOWN_MS = (Number(process.env.STAMP_COOLDOWN_MINUTES) || 60) * 60 * 1000;

function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "");
}

export async function POST(req) {
  if (!adminConfigured || !adminDb) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured on the server" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const rawToken = String(body.token || "");
  const name = String(body.name || "").trim();
  const phone = normalizePhone(body.phone);

  if (!rawToken) {
    return NextResponse.json({ ok: false, error: "Missing QR token" }, { status: 400 });
  }
  if (!name || phone.length < 10) {
    return NextResponse.json({ ok: false, error: "Valid name and phone number are required" }, { status: 400 });
  }

  const verified = verifyQrPayload(rawToken);
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: verified.reason }, { status: 400 });
  }

  // Supports both the new short keys (b/br) and the older long keys
  // (businessId/branchId) so QR codes printed before this change still work.
  const businessId = verified.data?.b || verified.data?.businessId;
  const branchId = verified.data?.br || verified.data?.branchId;
  if (!businessId) {
    return NextResponse.json({ ok: false, error: "Invalid shop QR" }, { status: 400 });
  }

  const businessRef = adminDb.collection("businesses").doc(businessId);
  const customerId = `${businessId}_${phone}`;
  const customerRef = adminDb.collection("customers").doc(customerId);
  const txnRef = adminDb.collection("transactions").doc();

  try {
    const result = await adminDb.runTransaction(async (t) => {
      const bizSnap = await t.get(businessRef);
      if (!bizSnap.exists) throw new Error("Shop not found. Ask the business to regenerate their QR code.");
      const biz = bizSnap.data();
      if (biz.active === false) throw new Error("This shop is not currently active");

      const requiredStamps = Number(biz.requiredStamps) || 9;
      const custSnap = await t.get(customerRef);
      const now = Date.now();

      if (!custSnap.exists) {
        const data = {
          businessId,
          branchId: branchId || "MAIN",
          name,
          phone,
          stamps: 1,
          visits: 1,
          rewardsEarned: 0,
          createdAt: now,
          lastVisit: now
        };
        t.set(customerRef, data);
        t.set(txnRef, { businessId, customerId, phone, type: "stamp", createdAt: now });
        return { ...data, requiredStamps, rewardReady: data.stamps >= requiredStamps, cooldown: false };
      }

      const cust = custSnap.data();

      if (cust.lastVisit && now - cust.lastVisit < COOLDOWN_MS) {
        return {
          ...cust,
          requiredStamps,
          rewardReady: (cust.stamps || 0) >= requiredStamps,
          cooldown: true,
          cooldownRemainingMinutes: Math.ceil((COOLDOWN_MS - (now - cust.lastVisit)) / 60000)
        };
      }

      let stamps = (cust.stamps || 0) + 1;
      let rewardsEarned = cust.rewardsEarned || 0;
      let rewardReady = false;

      if (stamps >= requiredStamps) {
        rewardReady = true;
      }

      const update = {
        name: name || cust.name,
        phone,
        stamps,
        visits: (cust.visits || 0) + 1,
        lastVisit: now,
        rewardsEarned
      };
      t.update(customerRef, update);
      t.set(txnRef, { businessId, customerId, phone, type: "stamp", createdAt: now });
      return { ...cust, ...update, requiredStamps, rewardReady, cooldown: false };
    });

    return NextResponse.json({ ok: true, businessId, customerId, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Could not process this scan" }, { status: 400 });
  }
}
