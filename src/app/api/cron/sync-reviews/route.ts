// ============================================================================
// Cron: Auto-Sync Reviews — Vercel Cron Compatible
// ============================================================================
// Runs on a schedule (e.g. every 6 hours via vercel.json cron config).
// Queries all integrations with auto_import = true AND status = 'active',
// fetches new reviews from each provider, dedupes by external_id, and
// inserts new reviews. Updates last_synced_at and review_count.
//
// Endpoint: GET /api/cron/sync-reviews
// Auth: CRON_SECRET header check (prevents unauthorized invocations)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IntegrationProvider } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for cron

export async function GET(request: NextRequest) {
  // ---- Auth: verify cron secret ----
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: {
    integrationId: string;
    provider: string;
    imported: number;
    skipped: number;
    error: string | null;
  }[] = [];

  // ---- Fetch all active auto-import integrations ----
  const { data: integrations, error: fetchErr } = await supabase
    .from("integrations")
    .select("*")
    .eq("auto_import", true)
    .eq("status", "active");

  if (fetchErr) {
    console.error("[cron/sync-reviews] Failed to fetch integrations:", fetchErr);
    return NextResponse.json(
      { error: fetchErr.message, results: [] },
      { status: 500 }
    );
  }

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({
      message: "No active auto-import integrations.",
      results: [],
    });
  }

  console.log(
    `[cron/sync-reviews] Processing ${integrations.length} integration(s)…`
  );

  // ---- Process each integration sequentially to avoid API rate limits ----
  for (const integration of integrations) {
    const provider = integration.provider as IntegrationProvider;
    const encryptedCreds = integration.credentials as string;

    let providerReviews: {
      reviewer_name: string;
      rating: number;
      review_text: string;
      review_date: string;
      external_id: string;
    }[] = [];
    let fetchError: string | null = null;
    let updatedEncryptedCreds: string | null = null;

    try {
      if (provider === "google_business") {
        const { fetchAllGoogleReviews } = await import(
          "@/lib/integrations/google-business"
        );
        const result = await fetchAllGoogleReviews(encryptedCreds);
        providerReviews = result.reviews;
        fetchError = result.error;
        updatedEncryptedCreds = result.updatedEncryptedCreds;
      } else if (provider === "yelp") {
        const { fetchYelpReviews } = await import(
          "@/lib/integrations/yelp"
        );
        const result = await fetchYelpReviews(encryptedCreds);
        providerReviews = result.reviews;
        fetchError = result.error;
      } else {
        fetchError = `Unknown provider: ${provider}`;
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }

    // If Google token was refreshed, persist re-encrypted credentials
    if (updatedEncryptedCreds) {
      await supabase
        .from("integrations")
        .update({ credentials: updatedEncryptedCreds })
        .eq("id", integration.id);
    }

    if (fetchError) {
      console.error(
        `[cron/sync-reviews] Error fetching from ${provider} (integration ${integration.id}):`,
        fetchError
      );

      // Mark integration as errored
      await supabase
        .from("integrations")
        .update({ status: "error" })
        .eq("id", integration.id);

      results.push({
        integrationId: integration.id,
        provider,
        imported: 0,
        skipped: 0,
        error: fetchError,
      });
      continue;
    }

    if (providerReviews.length === 0) {
      await supabase
        .from("integrations")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", integration.id);

      results.push({
        integrationId: integration.id,
        provider,
        imported: 0,
        skipped: 0,
        error: null,
      });
      continue;
    }

    // ---- Dedupe by external_id ----
    const externalIds = providerReviews
      .map((r) => r.external_id)
      .filter(Boolean);

    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("external_id")
      .eq("organization_id", integration.organization_id)
      .in("external_id", externalIds);

    const existingSet = new Set(
      (existingReviews ?? []).map((r) => r.external_id)
    );

    const newReviews = providerReviews.filter(
      (r) => r.external_id && !existingSet.has(r.external_id)
    );

    if (newReviews.length === 0) {
      await supabase
        .from("integrations")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", integration.id);

      results.push({
        integrationId: integration.id,
        provider,
        imported: 0,
        skipped: providerReviews.length,
        error: null,
      });
      continue;
    }

    // ---- Check entitlement (review limit) ----
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_tier, review_limit")
      .eq("organization_id", integration.organization_id)
      .single();

    if (sub && sub.review_limit !== -1) {
      const now = new Date();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();

      const { count: existingCount } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", integration.organization_id)
        .gte("created_at", monthStart);

      const remaining = sub.review_limit - (existingCount ?? 0);
      if (remaining <= 0) {
        results.push({
          integrationId: integration.id,
          provider,
          imported: 0,
          skipped: newReviews.length,
          error: "Monthly review limit reached.",
        });
        continue;
      }

      // Only import up to remaining quota
      if (newReviews.length > remaining) {
        newReviews.splice(remaining);
      }
    }

    // ---- Insert reviews ----
    const rows = newReviews.map((r) => ({
      organization_id: integration.organization_id,
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

    const { data: inserted, error: insertErr } = await supabase
      .from("reviews")
      .insert(rows)
      .select();

    if (insertErr) {
      console.error(
        `[cron/sync-reviews] Insert error (integration ${integration.id}):`,
        insertErr
      );
      results.push({
        integrationId: integration.id,
        provider,
        imported: 0,
        skipped: 0,
        error: insertErr.message,
      });
      continue;
    }

    const importedCount = inserted?.length ?? 0;

    // Update integration metadata
    await supabase
      .from("integrations")
      .update({
        last_synced_at: new Date().toISOString(),
        status: "active",
        review_count: (integration.review_count ?? 0) + importedCount,
      })
      .eq("id", integration.id);

    results.push({
      integrationId: integration.id,
      provider,
      imported: importedCount,
      skipped: providerReviews.length - newReviews.length,
      error: null,
    });

    console.log(
      `[cron/sync-reviews] ${provider} (integration ${integration.id}): imported ${importedCount}, skipped ${providerReviews.length - newReviews.length}`
    );
  }

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  const totalErrors = results.filter((r) => r.error).length;

  console.log(
    `[cron/sync-reviews] Done. Total imported: ${totalImported}, errors: ${totalErrors}`
  );

  return NextResponse.json({
    message: `Processed ${results.length} integration(s). Imported ${totalImported} review(s).`,
    results,
  });
}
