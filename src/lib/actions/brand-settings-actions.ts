// ============================================================================
// Brand Settings — Server Actions
// ============================================================================
// Fetch and update brand voice configuration. Org-scoped and logged.
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { brandSettingsSchema } from "@/lib/validation/schemas";
import type { BrandSettings } from "@/lib/types";

// ---- Auth helper ----

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!membership) return null;

  return { supabase, userId: user.id, orgId: membership.organization_id };
}

// ============================================================================
// Fetch brand settings
// ============================================================================

export async function fetchBrandSettings(): Promise<{
  error: string | null;
  data: BrandSettings | null;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: null };

  const { data, error } = await ctx.supabase
    .from("brand_settings")
    .select("*")
    .eq("organization_id", ctx.orgId)
    .single();

  if (error) return { error: error.message, data: null };
  return { error: null, data: data as BrandSettings };
}

// ============================================================================
// Update brand settings (upserts — creates if missing)
// ============================================================================

export async function updateBrandSettings(
  formData: Record<string, unknown>
): Promise<{ error: string | null; data?: BrandSettings | null }> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized" };

  const result = brandSettingsSchema.safeParse(formData);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors;
    return {
      error: Object.values(flat).flat()[0] ?? "Validation failed",
    };
  }

  const bannedArr = result.data.banned_phrases
    ? result.data.banned_phrases
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  const { data: settings, error } = await ctx.supabase
    .from("brand_settings")
    .upsert(
      {
        organization_id: ctx.orgId,
        tone: result.data.tone,
        style_notes: result.data.style_notes || null,
        banned_phrases: bannedArr,
        signature_line: result.data.signature_line || null,
        escalation_wording: result.data.escalation_wording || null,
        additional_instructions: result.data.additional_instructions || null,
      },
      { onConflict: "organization_id" }
    )
    .select()
    .single();

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "brand_settings.updated",
    entity_type: "brand_settings",
    entity_id: settings.id,
    metadata: { tone: result.data.tone },
  });

  revalidatePath("/settings");
  return { error: null, data: settings as BrandSettings };
}
