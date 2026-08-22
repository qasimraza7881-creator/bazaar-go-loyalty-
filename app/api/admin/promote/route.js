import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp, adminDb, adminConfigured } from "../../../../lib/firebase-admin";

export async function POST(req) {
  if (!adminConfigured || !adminDb || !adminApp) {
    return NextResponse.json({ ok: false, error: "Firebase Admin is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: "email is required" }, { status: 400 });
  }

  const secret = process.env.ADMIN_ACTIVATION_SECRET;
  const providedSecret = req.headers.get("x-admin-secret");
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  let authorized = false;
  if (secret && providedSecret === secret) authorized = true;

  if (!authorized && idToken) {
    try {
      const decoded = await getAuth(adminApp).verifyIdToken(idToken);
      const callerSnap = await adminDb.collection("users").doc(decoded.uid).get();
      if (callerSnap.exists && callerSnap.data().role === "admin") authorized = true;
    } catch (e) {
      // falls through to unauthorized below
    }
  }

  if (!authorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let userRecord;
  try {
    userRecord = await getAuth(adminApp).getUserByEmail(email);
  } catch (e) {
    return NextResponse.json({ ok: false, error: "No signed-up user found with that email. Ask them to log in once first." }, { status: 404 });
  }

  await adminDb.collection("users").doc(userRecord.uid).set(
    { role: "admin", email, promotedAt: Date.now() },
    { merge: true }
  );

  return NextResponse.json({ ok: true, uid: userRecord.uid, email });
}
