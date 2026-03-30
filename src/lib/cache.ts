// ─── Scrape response cache (Firestore-backed) ──────────────────────────────

import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAppDb } from "@/lib/firebase";
import type { ScrapeResult } from "@/lib/scraper";

const COLLECTION = "scrapeCache";
const DEFAULT_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Build a deterministic Firestore-safe document ID from a URL.
 * Firestore doc IDs cannot contain `/`, so we base64url-encode.
 */
function docId(url: string): string {
  return Buffer.from(url).toString("base64url");
}

/**
 * Return a cached scrape result if one exists and is fresh enough.
 */
export async function getCached(
  url: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): Promise<ScrapeResult | null> {
  try {
    const db = getAppDb();
    const ref = doc(collection(db, COLLECTION), docId(url));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    const cachedAt = data.cachedAt?.toMillis?.() ?? data.cachedAtMs ?? 0;
    if (Date.now() - cachedAt > maxAgeMs) return null;

    return data.result as ScrapeResult;
  } catch {
    // Cache miss on any error — caller proceeds with a fresh scrape.
    return null;
  }
}

/**
 * Store a scrape result in the cache.
 */
export async function setCache(
  url: string,
  result: ScrapeResult,
): Promise<void> {
  try {
    const db = getAppDb();
    const ref = doc(collection(db, COLLECTION), docId(url));
    await setDoc(ref, {
      url,
      result,
      cachedAt: serverTimestamp(),
      cachedAtMs: Date.now(), // fallback for reads before serverTimestamp resolves
    });
  } catch {
    // Silently ignore cache write failures — scraping still works.
  }
}
