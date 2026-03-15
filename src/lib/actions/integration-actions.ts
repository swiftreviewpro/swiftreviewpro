// ============================================================================
// Integration Server Actions — CRUD + Sync for Google / Yelp
// ============================================================================
// All actions are org-scoped and gated behind paid plan checks.
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkReviewEntitlement } from "@/lib/entitlements";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type {
  Integration,
  IntegrationProvider,
  PlanTier,
} from "@/lib/types";

// ---- Auth helper (same pattern as other action files) ----

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

// ---- Paid plan gate ----

const PAID_TIERS: PlanTier[] = ["starter", "growth", "pro"];

async function requirePaidPlan(): Promise<{
  ctx: Awaited<ReturnType<typeof getAuthContext>>;
  error: string | null;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { ctx: null, error: "You must be logged in." };

  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("plan_tier")
    .eq("organization_id", ctx.orgId)
    .single();

  const tier = (sub?.plan_tier ?? "free") as PlanTier;

  if (!PAID_TIERS.includes(tier)) {
    return {
      ctx: null,
      error: "Platform integrations are available on paid plans. Please upgrade to connect Google or Yelp.",
    };
  }

  return { ctx, error: null };
}

// ---- Result types ----

export interface IntegrationActionResult {
  error: string | null;
  data?: Integration | null;
}

export interface SyncResult {
  error: string | null;
  imported: number;
  skipped: number;
}

// ============================================================================
// List integrations
// ============================================================================

export async function listIntegrations(): Promise<{
  error: string | null;
  data: Integration[];
}> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized", data: [] };

  const { data, error: dbErr } = await ctx.supabase
    .from("integrations")
    .select("*, location:locations(id, name)")
    .eq("organization_id", ctx.orgId)
    .order("created_at", { ascending: false });

  if (dbErr) return { error: dbErr.message, data: [] };
  return { error: null, data: (data ?? []) as Integration[] };
}

// ============================================================================
// Connect Yelp (API key based — no OAuth flow needed)
// ============================================================================

export async function connectYelp(
  businessId: string,
  locationId: string
): Promise<IntegrationActionResult> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  if (!businessId || !locationId) {
    return { error: "Business ID and location are required." };
  }

  // Import dynamically to keep server-only boundary clean
  const { getYelpBusiness, encryptYelpCredentials } = await import("@/lib/integrations/yelp");

  // Validate the business exists
  const biz = await getYelpBusiness(businessId);
  if (biz.error) return { error: biz.error };

  // Check for duplicate
  const { data: existing } = await ctx.supabase
    .from("integrations")
    .select("id")
    .eq("organization_id", ctx.orgId)
    .eq("provider", "yelp")
    .eq("location_id", locationId)
    .maybeSingle();

  if (existing) {
    return { error: "A Yelp integration already exists for this location." };
  }

  // Encrypt credentials before storing
  const encryptedCreds = encryptYelpCredentials({
    business_id: businessId,
    business_name: biz.name || businessId,
  });

  const { data: integration, error: insertErr } = await ctx.supabase
    .from("integrations")
    .insert({
      organization_id: ctx.orgId,
      provider: "yelp" as IntegrationProvider,
      label: biz.name || businessId,
      credentials: encryptedCreds,
      location_id: locationId,
      status: "active",
      auto_import: false,
    })
    .select()
    .single();

  if (insertErr) return { error: insertErr.message };

  // Log activity
  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "integration.connected",
    entity_type: "integration",
    entity_id: integration.id,
    metadata: { provider: "yelp", business_id: businessId },
  });

  revalidatePath("/integrations");
  return { error: null, data: integration as Integration };
}

// ============================================================================
// Connect Google Business (stores OAuth tokens from callback)
// ============================================================================

export async function connectGoogle(
  accessToken: string,
  refreshToken: string,
  accountId: string,
  googleLocationId: string,
  locationId: string,
  label: string
): Promise<IntegrationActionResult> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  if (!accessToken || !refreshToken || !accountId || !googleLocationId || !locationId) {
    return { error: "All Google credentials are required." };
  }

  // Check for duplicate
  const { data: existing } = await ctx.supabase
    .from("integrations")
    .select("id")
    .eq("organization_id", ctx.orgId)
    .eq("provider", "google_business")
    .eq("location_id", locationId)
    .maybeSingle();

  if (existing) {
    return { error: "A Google Business integration already exists for this location." };
  }

  // Encrypt credentials before storing — raw tokens never hit the DB
  const { buildEncryptedGoogleCreds } = await import("@/lib/integrations/google-business");
  const encryptedCreds = buildEncryptedGoogleCreds({
    access_token: accessToken,
    refresh_token: refreshToken,
    account_id: accountId,
    location_id: googleLocationId,
  });

  const { data: integration, error: insertErr } = await ctx.supabase
    .from("integrations")
    .insert({
      organization_id: ctx.orgId,
      provider: "google_business" as IntegrationProvider,
      label,
      credentials: encryptedCreds,
      location_id: locationId,
      status: "active",
      auto_import: false,
    })
    .select()
    .single();

  if (insertErr) return { error: insertErr.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "integration.connected",
    entity_type: "integration",
    entity_id: integration.id,
    metadata: { provider: "google_business", account_id: accountId },
  });

  revalidatePath("/integrations");
  return { error: null, data: integration as Integration };
}

// ============================================================================
// Sync reviews (manual trigger)
// ============================================================================

export async function syncIntegration(
  integrationId: string
): Promise<SyncResult> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized", imported: 0, skipped: 0 };

  // Rate limit
  const rl = await checkRateLimit(RATE_LIMITS.csvImport, ctx.userId, ctx.orgId);
  if (!rl.success) {
    return { error: rl.error ?? "Rate limit exceeded.", imported: 0, skipped: 0 };
  }

  // Fetch integration
  const { data: integration, error: fetchErr } = await ctx.supabase
    .from("integrations")
    .select("*")
    .eq("id", integrationId)
    .eq("organization_id", ctx.orgId)
    .single();

  if (fetchErr || !integration) {
    return { error: "Integration not found.", imported: 0, skipped: 0 };
  }

  if (integration.status === "disconnected") {
    return { error: "This integration is disconnected. Please reconnect.", imported: 0, skipped: 0 };
  }

  const provider = integration.provider as IntegrationProvider;
  const encryptedCreds = integration.credentials as string;

  // Fetch reviews from provider
  let providerReviews: {
    reviewer_name: string;
    rating: number;
    review_text: string;
    review_date: string;
    external_id: string;
  }[] = [];
  let fetchError: string | null = null;
  let updatedEncryptedCreds: string | null = null;

  if (provider === "google_business") {
    const { fetchAllGoogleReviews } = await import(
      "@/lib/integrations/google-business"
    );
    const result = await fetchAllGoogleReviews(encryptedCreds);
    providerReviews = result.reviews;
    fetchError = result.error;
    updatedEncryptedCreds = result.updatedEncryptedCreds;
  } else if (provider === "yelp") {
    const { fetchYelpReviews } = await import("@/lib/integrations/yelp");
    const result = await fetchYelpReviews(encryptedCreds);
    providerReviews = result.reviews;
    fetchError = result.error;
  } else {
    return { error: `Unknown provider: ${provider}`, imported: 0, skipped: 0 };
  }

  // If Google token was refreshed, persist the re-encrypted credentials
  if (updatedEncryptedCreds) {
    await ctx.supabase
      .from("integrations")
      .update({ credentials: updatedEncryptedCreds })
      .eq("id", integrationId);
  }

  if (fetchError) {
    // Mark integration as errored
    await ctx.supabase
      .from("integrations")
      .update({ status: "error" })
      .eq("id", integrationId);

    return { error: fetchError, imported: 0, skipped: 0 };
  }

  if (providerReviews.length === 0) {
    // Update last_synced even if no new reviews
    await ctx.supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integrationId);

    return { error: null, imported: 0, skipped: 0 };
  }

  // Entitlement check
  const entitlement = await checkReviewEntitlement(
    ctx.supabase,
    ctx.orgId,
    providerReviews.length
  );
  if (!entitlement.allowed) {
    return { error: entitlement.error!, imported: 0, skipped: 0 };
  }

  // Filter out reviews that already exist (by external_id)
  const externalIds = providerReviews
    .map((r) => r.external_id)
    .filter(Boolean);

  const { data: existingReviews } = await ctx.supabase
    .from("reviews")
    .select("external_id")
    .eq("organization_id", ctx.orgId)
    .in("external_id", externalIds);

  const existingSet = new Set(
    (existingReviews ?? []).map((r) => r.external_id)
  );

  const newReviews = providerReviews.filter(
    (r) => r.external_id && !existingSet.has(r.external_id)
  );

  if (newReviews.length === 0) {
    await ctx.supabase
      .from("integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integrationId);

    return {
      error: null,
      imported: 0,
      skipped: providerReviews.length,
    };
  }

  // Insert new reviews
  const rows = newReviews.map((r) => ({
    organization_id: ctx.orgId,
    location_id: integration.location_id,
    reviewer_name: r.reviewer_name,
    rating: Math.min(5, Math.max(1, r.rating)),
    review_text: r.review_text,
    platform: provider === "google_business" ? "Google" : "Yelp",
    review_date: r.review_date,
    source: provider as string,
    status: "new" as const,
    external_id: r.external_id,
  }));

  const { data: inserted, error: insertErr } = await ctx.supabase
    .from("reviews")
    .insert(rows)
    .select();

  if (insertErr) {
    return { error: insertErr.message, imported: 0, skipped: 0 };
  }

  const importedCount = inserted?.length ?? 0;

  // Update integration state
  await ctx.supabase
    .from("integrations")
    .update({
      last_synced_at: new Date().toISOString(),
      status: "active",
      review_count: (integration.review_count ?? 0) + importedCount,
    })
    .eq("id", integrationId);

  // Log activity
  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "integration.synced",
    entity_type: "integration",
    entity_id: integrationId,
    metadata: {
      provider,
      imported: importedCount,
      skipped: providerReviews.length - newReviews.length,
    },
  });

  revalidatePath("/reviews");
  revalidatePath("/integrations");
  return {
    error: null,
    imported: importedCount,
    skipped: providerReviews.length - newReviews.length,
  };
}

// ============================================================================
// Toggle auto-import
// ============================================================================

export async function toggleAutoImport(
  integrationId: string,
  enabled: boolean
): Promise<IntegrationActionResult> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const { data, error: updateErr } = await ctx.supabase
    .from("integrations")
    .update({ auto_import: enabled })
    .eq("id", integrationId)
    .eq("organization_id", ctx.orgId)
    .select()
    .single();

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/integrations");
  return { error: null, data: data as Integration };
}

// ============================================================================
// Disconnect (soft delete — sets status to 'disconnected')
// ============================================================================

export async function disconnectIntegration(
  integrationId: string
): Promise<IntegrationActionResult> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const { data, error: updateErr } = await ctx.supabase
    .from("integrations")
    .update({ status: "disconnected", auto_import: false, credentials: "" })
    .eq("id", integrationId)
    .eq("organization_id", ctx.orgId)
    .select()
    .single();

  if (updateErr) return { error: updateErr.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "integration.disconnected",
    entity_type: "integration",
    entity_id: integrationId,
  });

  revalidatePath("/integrations");
  return { error: null, data: data as Integration };
}

// ============================================================================
// Delete integration permanently
// ============================================================================

export async function deleteIntegration(
  integrationId: string
): Promise<{ error: string | null }> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized" };

  const { error: deleteErr } = await ctx.supabase
    .from("integrations")
    .delete()
    .eq("id", integrationId)
    .eq("organization_id", ctx.orgId);

  if (deleteErr) return { error: deleteErr.message };

  revalidatePath("/integrations");
  return { error: null };
}

// ============================================================================
// Get Google OAuth URL (server action so client doesn't import server-only)
// ============================================================================

export async function getGoogleOAuthUrl(
  state: string
): Promise<{ error: string | null; url: string | null }> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx) return { error: error ?? "Unauthorized", url: null };

  const { getGoogleAuthUrl } = await import("@/lib/integrations/google-business");
  const url = getGoogleAuthUrl(state);
  return { error: null, url };
}

// ============================================================================
// Search Yelp businesses (for setup flow)
// ============================================================================

export async function searchYelpForSetup(
  term: string,
  location: string
): Promise<{
  error: string | null;
  businesses: { id: string; name: string; city: string; state: string; rating: number; review_count: number }[];
}> {
  const { ctx, error } = await requirePaidPlan();
  if (error || !ctx)
    return { error: error ?? "Unauthorized", businesses: [] };

  const { searchYelpBusinesses } = await import("@/lib/integrations/yelp");
  const result = await searchYelpBusinesses(term, location);

  if (result.error) return { error: result.error, businesses: [] };

  return {
    error: null,
    businesses: result.businesses.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.location.city,
      state: b.location.state,
      rating: b.rating,
      review_count: b.review_count,
    })),
  };
}
