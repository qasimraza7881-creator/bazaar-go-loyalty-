export async function GET(){
  const check = (v) => Boolean(v && String(v).trim());
  const status = {
    firebaseClient: {
      apiKey: check(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      authDomain: check(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      projectId: check(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      appId: check(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    },
    firebaseAdmin: {
      clientEmail: check(process.env.FIREBASE_CLIENT_EMAIL),
      privateKey: check(process.env.FIREBASE_PRIVATE_KEY),
    },
    qrSigning: check(process.env.QR_SIGNING_SECRET),
    adminActivation: check(process.env.ADMIN_ACTIVATION_SECRET),
    cloudinary: {
      cloudName: check(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
      uploadPreset: check(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET),
    },
  };
  const missing = [];
  if(!status.firebaseClient.apiKey||!status.firebaseClient.authDomain||!status.firebaseClient.projectId||!status.firebaseClient.appId) missing.push("Firebase client env vars (NEXT_PUBLIC_FIREBASE_*) — needed for login/auth in the browser.");
  if(!status.firebaseAdmin.clientEmail||!status.firebaseAdmin.privateKey) missing.push("FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY — needed for the server (scan, card, stamp, QR mint) to talk to Firestore.");
  if(!status.qrSigning) missing.push("QR_SIGNING_SECRET — needed to generate/verify the shop QR code. Without it, the QR page and downloads stay blank/disabled.");
  if(!status.adminActivation) missing.push("ADMIN_ACTIVATION_SECRET — needed for package activation codes.");
  if(!status.cloudinary.cloudName||!status.cloudinary.uploadPreset) missing.push("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET — needed for logo/photo uploads.");

  return Response.json({
    ok: missing.length===0,
    app: "Bazaar Go Loyalty",
    ready: missing.length===0,
    status,
    missing,
  });
}