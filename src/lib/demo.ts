// ============================================================================
// Demo Mode Constants
// ============================================================================

/** Demo mode is enabled when NEXT_PUBLIC_DEMO_MODE is "true" */
export const IS_DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Demo account credentials */
export const DEMO_EMAIL = "demo@swiftreview.pro";
export const DEMO_PASSWORD = "demo1234";

/** Demo organization ID (stable UUID used in seed migration) */
export const DEMO_ORG_ID = "d3m00000-0000-0000-0000-000000000001";

/**
 * Returns true if the given email belongs to the demo account.
 */
export function isDemoUser(email: string | null | undefined): boolean {
  return email === DEMO_EMAIL;
}
