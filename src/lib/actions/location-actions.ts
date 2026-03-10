// ============================================================================
// Locations — Server Actions
// ============================================================================
// CRUD operations for business locations. Org-scoped, validated, and logged.
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createLocationSchema,
  updateLocationSchema,
} from "@/lib/validation/schemas";
import { checkLocationEntitlement } from "@/lib/entitlements";
import type { Location } from "@/lib/types";

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
// Fetch all locations (full objects)
// ============================================================================

export async function fetchAllLocations(): Promise<{
  error: string | null;
  data: Location[];
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: [] };

  const { data, error } = await ctx.supabase
    .from("locations")
    .select("*")
    .eq("organization_id", ctx.orgId)
    .order("name");

  if (error) return { error: error.message, data: [] };
  return { error: null, data: (data ?? []) as Location[] };
}

// ============================================================================
// Create location (with plan limit check)
// ============================================================================

export async function createLocation(
  formData: Record<string, unknown>
): Promise<{ error: string | null; data?: Location | null }> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized" };

  const result = createLocationSchema.safeParse(formData);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors;
    return {
      error: Object.values(flat).flat()[0] ?? "Validation failed",
    };
  }

  // Entitlement check: location quota
  const entitlement = await checkLocationEntitlement(ctx.supabase, ctx.orgId);
  if (!entitlement.allowed) {
    return { error: entitlement.error! };
  }

  const { data: location, error } = await ctx.supabase
    .from("locations")
    .insert({ organization_id: ctx.orgId, ...result.data })
    .select()
    .single();

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "location.created",
    entity_type: "location",
    entity_id: location.id,
    metadata: { name: result.data.name },
  });

  revalidatePath("/locations");
  return { error: null, data: location as Location };
}

// ============================================================================
// Update location
// ============================================================================

export async function updateLocation(
  locationId: string,
  updates: Record<string, unknown>
): Promise<{ error: string | null; data?: Location | null }> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized" };

  const result = updateLocationSchema.safeParse(updates);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors;
    return {
      error: Object.values(flat).flat()[0] ?? "Validation failed",
    };
  }

  const { data: location, error } = await ctx.supabase
    .from("locations")
    .update(result.data)
    .eq("id", locationId)
    .eq("organization_id", ctx.orgId)
    .select()
    .single();

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "location.updated",
    entity_type: "location",
    entity_id: locationId,
  });

  revalidatePath("/locations");
  return { error: null, data: location as Location };
}

// ============================================================================
// Delete location
// ============================================================================

export async function deleteLocation(
  locationId: string
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized" };

  const { error } = await ctx.supabase
    .from("locations")
    .delete()
    .eq("id", locationId)
    .eq("organization_id", ctx.orgId);

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "location.deleted",
    entity_type: "location",
    entity_id: locationId,
  });

  revalidatePath("/locations");
  return { error: null };
}
