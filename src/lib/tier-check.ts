/**
 * Feature gating middleware helper for API routes.
 */

import type { AuthResult } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/enterprise";
import { withCors } from "@/lib/cors";

/**
 * Check whether the authenticated user's tier includes access to a feature.
 * Returns a 403 Response if the feature is not available, or null if access
 * is allowed.
 */
export function checkTierAccess(
  auth: AuthResult,
  feature: string,
): Response | null {
  const tier = auth.tier ?? "free";

  if (!checkFeatureAccess(tier, feature)) {
    return withCors(
      {
        success: false,
        error: `Your plan (${tier}) does not include the "${feature}" feature. Please upgrade at https://blazecrawl.dev/pricing`,
      },
      403,
    );
  }

  return null;
}
