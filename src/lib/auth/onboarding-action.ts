// ============================================================================
// Onboarding Action — Multi-step organization setup
// ============================================================================

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingCompleteSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/auth/helpers";

export interface OnboardingActionState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Persists all onboarding data via a single Supabase RPC call that runs
 * inside a Postgres transaction. All inserts succeed or fail atomically:
 *   - organizations row (with business profile fields)
 *   - organization_members row (owner)
 *   - brand_settings row (voice + escalation)
 *   - locations row (first location)
 *   - subscriptions row (free tier)
 *   - activity_logs entry
 */
export async function completeOnboarding(
  data: Record<string, unknown>
): Promise<OnboardingActionState> {
  // Server-side validation of the merged form data
  const result = onboardingCompleteSchema.safeParse(data);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors as Record<string, string[]>;
    const firstError = Object.values(flat).flat()[0] ?? "Please fix the errors.";
    return { error: firstError, fieldErrors: flat };
  }

  const v = result.data;
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const slug = slugify(v.business_name);

  // Parse banned_phrases from comma-separated string to array
  const bannedArr = v.banned_phrases
    ? v.banned_phrases
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  // ---- Call the atomic RPC ----
  const { data: orgId, error: rpcError } = await supabase.rpc(
    "complete_onboarding",
    {
      p_user_id: user.id,
      p_business_name: v.business_name,
      p_slug: slug,
      p_category: v.category || null,
      p_website: v.website || null,
      p_phone: v.phone || null,
      p_city: v.city || null,
      p_state: v.state || null,
      p_timezone: v.timezone || "America/New_York",
      // Brand settings
      p_tone: v.tone,
      p_style_notes: v.style_notes || null,
      p_banned_phrases: bannedArr,
      p_signature_line: v.signature_line || null,
      p_closing_style: v.closing_style || null,
      p_escalation_email: v.escalation_email || null,
      p_escalation_phone: v.escalation_phone || null,
      p_escalation_wording: v.escalation_wording || null,
      p_allow_offline: v.allow_offline_resolution ?? false,
      // First location
      p_location_name: v.location_name,
      p_location_address: v.location_address || null,
      p_location_city: v.location_city || null,
      p_location_state: v.location_state || null,
    }
  );

  if (rpcError) {
    // Map known Postgres exceptions to user-friendly messages
    const msg = rpcError.message ?? "";
    if (msg.includes("DUPLICATE_ONBOARDING")) {
      // Already onboarded — just redirect
      redirect("/dashboard");
    }
    if (msg.includes("SLUG_TAKEN")) {
      return {
        error:
          "An organization with a similar name already exists. Please choose a different name.",
      };
    }
    console.error("[onboarding] RPC error:", rpcError);
    return {
      error: "Something went wrong during setup. Please try again.",
    };
  }

  redirect("/dashboard");
}
