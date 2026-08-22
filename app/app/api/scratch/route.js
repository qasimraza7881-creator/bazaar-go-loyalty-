import { NextResponse } from "next/server";
import { adminDb, adminConfigured } from "../../../lib/firebase-admin";

function normalizePhone(p) {
  return String(p || "").replace(/\D/g, "");
}

export async function POST(req) {
  if (!adminConfigured || !adminDb) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured on the server" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const businessId = String(body.businessId || "").trim();
  const phone = normalizePhone(body.phone);
  const cardId = String(body.cardId || "").trim();

  if (!businessId || phone.length < 10 || !cardId) {
    return NextResponse.json({ ok: false, error: "businessId, phone and cardId are required" }, { status: 400 });
  }

  const businessRef = adminDb.collection("businesses").doc(businessId);
  const customerId = `${businessId}_${phone}`;
  const customerRef = adminDb.collection("customers").doc(customerId);
  const txnRef = adminDb.collection("transactions").doc();

  try {
    const result = await adminDb.runTransaction(async (t) => {
      const [bizSnap, custSnap] = await Promise.all([t.get(businessRef), t.get(customerRef)]);

      if (!bizSnap.exists) throw new Error("Shop not found");
      const biz = bizSnap.data();
      if (biz.active === false) throw new Error("This shop is not currently active");

      if (!custSnap.exists) throw new Error("No loyalty card found for this number yet. Scan the shop QR first.");
      const cust = custSnap.data();

      const card = (biz.scratchCards || []).find((c) => c.id === cardId);
      if (!card) throw new Error("This scratch card is no longer available");
      if (card.active === false) throw new Error("This scratch card is currently paused");

      const scratched = cust.scratchedCards || {};
      if (scratched[cardId]) {
        throw new Error("You've already scratched this card");
      }

      const winChance = Math.min(100, Math.max(0, Number(card.winChance) || 0));
      const won = Math.random() * 100 < winChance;

      const outcome = {
        won,
        prize: won ? card.reward : null,
        scratchedAt: Date.now()
      };

      t.update(customerRef, {
        [`scratchedCards.${cardId}`]: outcome
      });
      t.set(txnRef, {
        businessId,
        customerId,
        phone,
        type: "scratch",
        cardId,
        won,
        createdAt: Date.now()
      });

      return { cardTitle: card.title, ...outcome };
    });

    return NextResponse.json({ ok: true, businessId, customerId, cardId, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Could not process scratch card" }, { status: 400 });
  }
}
