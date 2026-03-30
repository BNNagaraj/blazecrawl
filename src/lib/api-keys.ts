import crypto from "crypto";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  increment,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { getAppDb } from "./firebase";

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

export interface TierConfig {
  monthlyCredits: number;
  maxConcurrent: number;
  rollover: boolean;
}

export const TIERS: Record<string, TierConfig> = {
  free: { monthlyCredits: 1_000, maxConcurrent: 10, rollover: true },
  pro: { monthlyCredits: 50_000, maxConcurrent: 100, rollover: true },
  scale: { monthlyCredits: Infinity, maxConcurrent: 500, rollover: true },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiKeyDoc {
  key: string;
  userId: string;
  tier: string;
  active: boolean;
  createdAt: Timestamp;
  monthlyUsage: number;
  lifetimeUsage: number;
  currentMonth: string; // "YYYY-MM"
}

export interface ValidationResult {
  valid: boolean;
  userId: string;
  tier: string;
}

export interface UsageInfo {
  monthlyUsage: number;
  lifetimeUsage: number;
  remainingCredits: number;
  tier: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function generateRandomKey(): string {
  return crypto.randomBytes(16).toString("hex"); // 32 hex chars
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a new API key for the given user and persist it in Firestore.
 * Returns the plain-text key (prefixed with "bc_live_").
 */
export async function generateApiKey(
  userId: string,
  tier: string = "free"
): Promise<string> {
  const key = `bc_live_${generateRandomKey()}`;
  const docRef = doc(collection(getAppDb(), "apiKeys"), key);

  const data: ApiKeyDoc = {
    key,
    userId,
    tier,
    active: true,
    createdAt: Timestamp.now(),
    monthlyUsage: 0,
    lifetimeUsage: 0,
    currentMonth: currentMonthKey(),
  };

  await setDoc(docRef, data);
  return key;
}

/**
 * Validate an API key and return the associated user/tier information.
 * Throws if the key is missing or inactive.
 */
export async function validateApiKey(key: string): Promise<ValidationResult> {
  const docRef = doc(getAppDb(), "apiKeys", key);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error("Invalid API key");
  }

  const data = snap.data() as ApiKeyDoc;

  if (!data.active) {
    throw new Error("API key has been deactivated");
  }

  return {
    valid: true,
    userId: data.userId,
    tier: data.tier,
  };
}

/**
 * Return usage stats for a given user (across all their keys).
 */
export async function getUsage(userId: string): Promise<UsageInfo> {
  const keysRef = collection(getAppDb(), "apiKeys");
  const q = query(keysRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  let monthlyUsage = 0;
  let lifetimeUsage = 0;
  let tier = "free";
  const month = currentMonthKey();

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as ApiKeyDoc;
    tier = data.tier; // use the latest tier found
    lifetimeUsage += data.lifetimeUsage;

    // Only count usage from the current month
    if (data.currentMonth === month) {
      monthlyUsage += data.monthlyUsage;
    }
  });

  const tierConfig = TIERS[tier] ?? TIERS.free;
  const remainingCredits = Math.max(
    0,
    tierConfig.monthlyCredits - monthlyUsage
  );

  return { monthlyUsage, lifetimeUsage, remainingCredits, tier };
}

/**
 * Atomically increment the usage counter for a given API key.
 * Resets the monthly counter if the stored month differs from the current one.
 */
export async function incrementUsage(
  apiKey: string,
  credits: number = 1
): Promise<void> {
  const docRef = doc(getAppDb(), "apiKeys", apiKey);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error("Invalid API key");
  }

  const data = snap.data() as ApiKeyDoc;
  const month = currentMonthKey();

  if (data.currentMonth !== month) {
    // New month — reset monthly counter
    await updateDoc(docRef, {
      monthlyUsage: credits,
      lifetimeUsage: increment(credits),
      currentMonth: month,
    });
  } else {
    await updateDoc(docRef, {
      monthlyUsage: increment(credits),
      lifetimeUsage: increment(credits),
    });
  }
}
