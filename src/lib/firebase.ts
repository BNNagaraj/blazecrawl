import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

export function getAppAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getApp());
  }
  return _auth;
}

export function getAppDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp());
  }
  return _db;
}

function isClientWithConfig(): boolean {
  return typeof window !== "undefined" && !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

// Legacy exports — safe to import; they return null when Firebase isn't configured.
// Consumers should null-check before use (e.g., `if (!auth) return`).
// The casts preserve backward compatibility with existing consumer code.
export const auth = isClientWithConfig() ? getAppAuth() : (null as unknown as Auth);
export const db = isClientWithConfig() ? getAppDb() : (null as unknown as Firestore);
export default isClientWithConfig() ? getApp() : (null as unknown as FirebaseApp);
