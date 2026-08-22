import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp, adminDb, adminConfigured } from "../../../../lib/firebase-admin";
import { signQrPayload } from "../../../../lib/qr";

export async function POST(req) {
  if (!adminConfigured || !adminDb || !adminApp) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured" }, { status: 500 });
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
  const branchId = String(body.branchId || "MAIN").trim();
  const requestedBusinessId = String(body.businessId || "").trim();

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const userData = userSnap.exists ? userSnap.data() : null;

  let businessId = userData && userData.role === "business" ? userData.businessId : null;

  // Fallback: the users/{uid} doc is written by the client right when a
  // business first signs in, and can very briefly lag behind here. If the
  // caller told us which businessId they just set up, trust it as long as
  // that business doc really is owned by this uid.
  if (!businessId && requestedBusinessId) {
    const bizSnap = await adminDb.collection("businesses").doc(requestedBusinessId).get();
    if (bizSnap.exists && bizSnap.data().ownerUid === decoded.uid) {
      businessId = requestedBusinessId;
      // Heal the users/{uid} doc so future requests (and any other route
      // that trusts it) hit the fast path instead of falling back here
      // every time.
      await adminDb.collection("users").doc(decoded.uid).set(
        { role: "business", businessId },
        { merge: true }
      );
    }
  }

  if (!businessId) {
    return NextResponse.json({ ok: false, error: "No business account found for this login" }, { status: 403 });
  }

  const token = signQrPayload({
    b: businessId,
    br: branchId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 365
  });

  // Real https:// link, not a bare "BAZAARGO:token" string — a normal
  // phone camera app can't do anything useful with plain text. This lets
  // any camera app open /scan directly with the token already filled in.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${req.headers.get("host")}`;
  const qrValue = `${origin}/scan?t=${encodeURIComponent(token)}`;

  return NextResponse.json({ ok: true, businessId, branchId, token, qrValue });
}
