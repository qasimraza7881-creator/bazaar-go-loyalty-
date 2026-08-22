import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp, adminDb, adminConfigured } from "../../../lib/firebase-admin";

// Business owner confirms a customer's reward has been handed over.
// Resets stamps back to 0 (carrying over any stamps earned beyond the
// requirement), bumps rewardsEarned, and logs a "redeem" transaction.
export async function POST(req) {
  if (!adminConfigured || !adminDb || !adminApp) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured on the server" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) {
    return NextResponse.json({ ok: false, error: "Missing auth token" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAuth(adminApp).verifyIdToken(idToken);
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid or expired session" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const customerId = String(body.customerId || "").trim();
  if (!customerId) {
    return NextResponse.json({ ok: false, error: "Missing customerId" }, { status: 400 });
  }

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const userData = userSnap.exists ? userSnap.data() : null;
  const isAdmin = userData?.role === "admin";
  const businessId = userData?.businessId;

  if (!isAdmin && !businessId) {
    return NextResponse.json({ ok: false, error: "Not authorized to redeem rewards" }, { status: 403 });
  }

  const customerRef = adminDb.collection("customers").doc(customerId);
  const businessRefFor = (id) => adminDb.collection("businesses").doc(id);
  const txnRef = adminDb.collection("transactions").doc();

  try {
    const result = await adminDb.runTransaction(async (t) => {
      const custSnap = await t.get(customerRef);
      if (!custSnap.exists) throw new Error("Customer not found");
      const cust = custSnap.data();

      if (!isAdmin && cust.businessId !== businessId) {
        throw new Error("This customer does not belong to your business");
      }

      const bizSnap = await t.get(businessRefFor(cust.businessId));
      const requiredStamps = Number(bizSnap.exists ? bizSnap.data().requiredStamps : 0) || 9;

      if ((cust.stamps || 0) < requiredStamps) {
        throw new Error("This customer has not reached the required stamps yet");
      }

      const remainingStamps = (cust.stamps || 0) - requiredStamps;
      const update = {
        stamps: remainingStamps,
        rewardsEarned: (cust.rewardsEarned || 0) + 1,
        lastRedeemedAt: Date.now()
      };
      t.update(customerRef, update);
      t.set(txnRef, {
        businessId: cust.businessId,
        customerId,
        phone: cust.phone,
        type: "redeem",
        createdAt: Date.now()
      });
      return { ...cust, ...update, requiredStamps };
    });

    return NextResponse.json({ ok: true, customerId, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Could not redeem reward" }, { status: 400 });
  }
}
