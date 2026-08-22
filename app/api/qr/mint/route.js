import { NextResponse } from "next/server";
import { signQrPayload } from "../../../../lib/qr";
import { adminDb, adminConfigured } from "../../../../lib/firebase-admin";

// Mints a signed, long-lived shop/branch QR token.
// Protected by ADMIN_ACTIVATION_SECRET until a real business-owner dashboard
// exists to generate QR codes for authenticated business accounts.
export async function POST(req) {
  const secret = process.env.ADMIN_ACTIVATION_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "ADMIN_ACTIVATION_SECRET is not configured" }, { status: 500 });
  }
  if (req.headers.get("x-admin-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!adminConfigured || !adminDb) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const businessId = String(body.businessId || "").trim();
  const branchId = String(body.branchId || "MAIN").trim();
  const businessName = String(body.businessName || "").trim();
  const requiredStamps = Number(body.requiredStamps) || 9;

  if (!businessId) {
    return NextResponse.json({ ok: false, error: "businessId is required" }, { status: 400 });
  }

  const ref = adminDb.collection("businesses").doc(businessId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      name: businessName || businessId,
      active: true,
      requiredStamps,
      createdAt: Date.now()
    });
  }

  const token = signQrPayload({
    b: businessId,
    br: branchId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 365
  });

  // A plain "BAZAARGO:token" string isn't tappable by a normal phone
  // camera app — it just offers a web search. Encode a real https:// link
  // instead so scanning with any camera app opens /scan directly with the
  // token already in the URL (see scan/page.js's `t` query param handling).
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${req.headers.get("host")}`;
  const qrValue = `${origin}/scan?t=${encodeURIComponent(token)}`;

  return NextResponse.json({ ok: true, businessId, branchId, token, qrValue });
}
