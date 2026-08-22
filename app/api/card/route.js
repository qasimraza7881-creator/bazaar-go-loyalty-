import { NextResponse } from "next/server";
import { adminDb, adminConfigured } from "../../../lib/firebase-admin";

export async function GET(req) {
  if (!adminConfigured || !adminDb) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured on the server" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = String(searchParams.get("businessId") || "").trim();
  const phone = String(searchParams.get("phone") || "").replace(/\D/g, "");

  if (!businessId || phone.length < 10) {
    return NextResponse.json({ ok: false, error: "businessId and phone are required" }, { status: 400 });
  }

  const customerId = `${businessId}_${phone}`;
  const [custSnap, bizSnap] = await Promise.all([
    adminDb.collection("customers").doc(customerId).get(),
    adminDb.collection("businesses").doc(businessId).get()
  ]);

  if (!custSnap.exists) {
    return NextResponse.json({ ok: false, error: "No loyalty card found for this number yet" }, { status: 404 });
  }

  const cust = custSnap.data();
  const biz = bizSnap.exists ? bizSnap.data() : {};
  const requiredStamps = Number(biz.requiredStamps) || 9;

  const scratchedCards = cust.scratchedCards || {};
  const scratchCards = (biz.scratchCards || [])
    .filter((c) => c.active !== false)
    .map((c) => ({
      id: c.id,
      title: c.title,
      alreadyScratched: Boolean(scratchedCards[c.id]),
      result: scratchedCards[c.id] || null
    }));

  return NextResponse.json({
    ok: true,
    businessId,
    customerId,
    businessName: biz.name || businessId,
    googleReview: biz.googleReview || "",
    mapUrl: (biz.lat && biz.lng) ? `https://www.google.com/maps/search/?api=1&query=${biz.lat},${biz.lng}` : "",
    name: cust.name,
    phone: cust.phone,
    stamps: cust.stamps || 0,
    visits: cust.visits || 0,
    rewardsEarned: cust.rewardsEarned || 0,
    requiredStamps,
    rewardReady: (cust.stamps || 0) >= requiredStamps,
    scratchCards
  });
}
