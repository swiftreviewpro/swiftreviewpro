// ============================================================================
// Auth Module — Barrel export
// ============================================================================

export { createClient as createBrowserClient } from "@/lib/supabase/client";
export { createClient as createServerClient } from "@/lib/supabase/server";
export { createAdminClient } from "@/lib/supabase/admin";
export {
  getUser,
  getUserOrganization,
  requireAuth,
  requireOrganization,
  requireAdmin,
  slugify,
  hasCompletedOnboarding,
} from "./helpers";
export { signUp, signIn, signOut } from "./actions";
export type { AuthActionState } from "./actions";
export { completeOnboarding } from "./onboarding-action";
export type { OnboardingActionState } from "./onboarding-action";
