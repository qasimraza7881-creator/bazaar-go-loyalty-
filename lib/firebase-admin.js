import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function normalizeKey(k) {
  return k ? k.replace(/\\n/g, "\n") : k;
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = normalizeKey(process.env.FIREBASE_PRIVATE_KEY);

export const adminConfigured = Boolean(projectId && clientEmail && privateKey);

export const adminApp = adminConfigured
  ? (getApps().length ? getApps()[0] : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    }))
  : null;

export const adminDb = adminApp ? getFirestore(adminApp) : null;
