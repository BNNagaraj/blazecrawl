/**
 * Enterprise features: feature gating, data retention, SLA config, and SSO.
 */

import { doc, getDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { getAppDb } from "./firebase";
import { TIERS } from "./api-keys";

/**
 * Check whether a given tier includes access to the specified feature.
 */
export function checkFeatureAccess(tier: string, feature: string): boolean {
  const config = TIERS[tier];
  if (!config) return false;
  return config.features.includes(feature);
}

/**
 * For zero-data-retention enterprise users, delete all stored scrape results
 * associated with the user after they have been returned.
 */
export async function enforceDataRetention(userId: string): Promise<void> {
  const db = getAppDb();

  // Check if user is on enterprise tier with zero-retention
  const keysRef = collection(db, "apiKeys");
  const keysQuery = query(keysRef, where("userId", "==", userId));
  const keysSnap = await getDocs(keysQuery);

  let tier = "free";
  keysSnap.forEach((snap) => {
    tier = snap.data().tier;
  });

  if (!checkFeatureAccess(tier, "zero-retention")) return;

  // Delete all scrape results for this user
  const resultsRef = collection(db, "scrapeResults");
  const resultsQuery = query(resultsRef, where("userId", "==", userId));
  const resultsSnap = await getDocs(resultsQuery);

  const deletes: Promise<void>[] = [];
  resultsSnap.forEach((snap) => {
    deletes.push(deleteDoc(doc(db, "scrapeResults", snap.id)));
  });
  await Promise.all(deletes);
}

/**
 * Return SLA parameters for a given tier.
 */
export function getSlaConfig(tier: string): {
  uptimeGuarantee: number;
  responseTimeMs: number;
  supportLevel: string;
} {
  switch (tier) {
    case "enterprise":
      return { uptimeGuarantee: 99.99, responseTimeMs: 200, supportLevel: "dedicated" };
    case "scale":
      return { uptimeGuarantee: 99.9, responseTimeMs: 500, supportLevel: "priority" };
    case "growth":
      return { uptimeGuarantee: 99.5, responseTimeMs: 1000, supportLevel: "priority" };
    case "standard":
      return { uptimeGuarantee: 99.0, responseTimeMs: 2000, supportLevel: "email" };
    case "hobby":
      return { uptimeGuarantee: 95.0, responseTimeMs: 5000, supportLevel: "community" };
    default:
      return { uptimeGuarantee: 95.0, responseTimeMs: 5000, supportLevel: "community" };
  }
}

/**
 * SSO configuration placeholder. Reads SAML/OIDC config from the
 * `enterpriseConfig` Firestore collection for the given user.
 * Returns null if SSO is not configured.
 */
export async function getSsoConfig(
  userId: string,
): Promise<{
  provider: "saml" | "oidc";
  entityId?: string;
  ssoUrl?: string;
  issuer?: string;
  clientId?: string;
  discoveryUrl?: string;
} | null> {
  const db = getAppDb();
  const docRef = doc(db, "enterpriseConfig", userId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  const data = snap.data();
  if (!data.sso) return null;

  return data.sso;
}
