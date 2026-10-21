import {
  applicationDefault,
  cert,
  getApps,
  initializeApp
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initializeFirebaseAdmin() {
  if (getApps().length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (raw) {
    const account = JSON.parse(raw);
    initializeApp({
      credential: cert(account),
      projectId: "vanessaschoolbd"
    });
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId: "vanessaschoolbd"
    });
  }
}

initializeFirebaseAdmin();

export const adminAuth = getAuth();
export const adminDb = getFirestore();