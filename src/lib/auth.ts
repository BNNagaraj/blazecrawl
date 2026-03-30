/**
 * Route-level authentication helper.
 *
 * Wraps the existing api-keys module and handles the case where
 * Firebase isn't configured by allowing requests through in dev mode.
 */

import { validateApiKey, incrementUsage, TIERS, type ValidationResult } from "./api-keys";

const isFirebaseConfigured = !!process.env.FIREBASE_PROJECT_ID;
const isDev = process.env.NODE_ENV === "development" || !isFirebaseConfigured;

export interface AuthResult {
  valid: boolean;
  error?: string;
  userId?: string;
  tier?: string;
  apiKey?: string;
  rateLimit: { limit: number; remaining: number };
}

/**
 * Authenticate an incoming request via the Authorization header.
 * Returns rate limit info alongside validation.
 */
export async function authenticateRequest(
  authHeader: string | null,
): Promise<AuthResult> {
  const apiKey = authHeader?.replace(/^Bearer\s+/i, "").trim();

  // Dev mode: skip validation
  if (isDev && !apiKey) {
    return {
      valid: true,
      userId: "dev-user",
      tier: "free",
      apiKey: "dev",
      rateLimit: { limit: 1000, remaining: 999 },
    };
  }

  if (!apiKey) {
    return {
      valid: false,
      error: "Missing Authorization header. Use: Bearer <api-key>",
      rateLimit: { limit: 0, remaining: 0 },
    };
  }

  try {
    const result: ValidationResult = await validateApiKey(apiKey);
    const tierConfig = TIERS[result.tier] ?? TIERS.free;
    return {
      valid: true,
      userId: result.userId,
      tier: result.tier,
      apiKey,
      rateLimit: {
        limit: tierConfig.monthlyCredits,
        remaining: tierConfig.monthlyCredits, // Actual remaining is computed by getUsage
      },
    };
  } catch (err: unknown) {
    // In dev mode, allow through even if Firebase call fails
    if (isDev) {
      return {
        valid: true,
        userId: "dev-user",
        tier: "free",
        apiKey,
        rateLimit: { limit: 1000, remaining: 999 },
      };
    }
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Authentication failed",
      rateLimit: { limit: 0, remaining: 0 },
    };
  }
}

/**
 * Track usage for the given API key. Safe to call in dev mode.
 */
export async function trackUsage(apiKey: string, credits = 1): Promise<void> {
  if (isDev && apiKey === "dev") return;
  try {
    await incrementUsage(apiKey, credits);
  } catch {
    // Silently fail in dev
  }
}
