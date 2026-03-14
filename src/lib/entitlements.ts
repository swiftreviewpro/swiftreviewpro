// ============================================================================
// Entitlements — Centralized Plan & Usage Enforcement
// ============================================================================
// Single source of truth for quota checks. Every write-path server action
// calls one of the functions below before mutating data. Limits are derived
// from the `subscriptions` table (which mirrors PLAN_LIMITS at provision time)
// and fall back to PLAN_LIMITS[plan] if the subscription row is missing.
//
// Convention:
//   -1 = unlimited (enterprise tier)
//   Returns `{ allowed, current, limit, plan, error? }`
//   `error` is a user-friendly string when `allowed === false`
// ============================================================================

import "server-only";

import { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_LIMITS } from "@/config/plans";
import type { PlanTier } from "@/lib/types";

// ---- Shared result type ----

export interface EntitlementResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanTier;
  /** User-friendly error message when `allowed === false` */
  error?: string;
}

// ---- Internal: fetch subscription once ----

async function getSubscription(
  supabase: SupabaseClient,
  orgId: string
): Promise<{
  plan: PlanTier;
  reviewLimit: number;
  replyLimit: number;
  locationLimit: number;
}> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_tier, review_limit, reply_limit, location_limit")
    .eq("organization_id", orgId)
    .single();

  const plan = (sub?.plan_tier ?? "free") as PlanTier;
  const fallback = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  return {
    plan,
    reviewLimit: sub?.review_limit ?? fallback.reviews,
    replyLimit: sub?.reply_limit ?? fallback.replies,
    locationLimit: sub?.location_limit ?? fallback.locations,
  };
}

// ---- Start-of-month ISO string (reusable) ----

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// ============================================================================
// Check: can create / import reviews?
// ============================================================================

/**
 * Checks whether the org can add `count` more reviews this month.
 * Pass `count = 1` for single creates or `count = rows.length` for CSV imports.
 */
export async function checkReviewEntitlement(
  supabase: SupabaseClient,
  orgId: string,
  count: number = 1
): Promise<EntitlementResult> {
  const sub = await getSubscription(supabase, orgId);

  // Unlimited
  if (sub.reviewLimit === -1) {
    return { allowed: true, current: 0, limit: -1, plan: sub.plan };
  }

  const { count: existing } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", startOfMonth());

  const current = existing ?? 0;
  const allowed = current + count <= sub.reviewLimit;

  return {
    allowed,
    current,
    limit: sub.reviewLimit,
    plan: sub.plan,
    ...(!allowed && {
      error: `Monthly review limit reached (${sub.reviewLimit}). Upgrade your plan to add more reviews.`,
    }),
  };
}

// ============================================================================
// Check: can generate an AI reply?
// ============================================================================

export async function checkReplyEntitlement(
  supabase: SupabaseClient,
  orgId: string
): Promise<EntitlementResult> {
  const sub = await getSubscription(supabase, orgId);

  // Unlimited
  if (sub.replyLimit === -1) {
    return { allowed: true, current: 0, limit: -1, plan: sub.plan };
  }

  const { count: existing } = await supabase
    .from("reply_drafts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", startOfMonth());

  const current = existing ?? 0;
  const allowed = current < sub.replyLimit;

  return {
    allowed,
    current,
    limit: sub.replyLimit,
    plan: sub.plan,
    ...(!allowed && {
      error: `Monthly AI reply limit reached (${sub.replyLimit}). Upgrade your plan for more replies.`,
    }),
  };
}

// ============================================================================
// Check: can create a location?
// ============================================================================

export async function checkLocationEntitlement(
  supabase: SupabaseClient,
  orgId: string
): Promise<EntitlementResult> {
  const sub = await getSubscription(supabase, orgId);

  // Unlimited
  if (sub.locationLimit === -1) {
    return { allowed: true, current: 0, limit: -1, plan: sub.plan };
  }

  const { count: existing } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const current = existing ?? 0;
  const allowed = current < sub.locationLimit;

  return {
    allowed,
    current,
    limit: sub.locationLimit,
    plan: sub.plan,
    ...(!allowed && {
      error: `Location limit reached (${sub.locationLimit}). Upgrade your plan for more locations.`,
    }),
  };
}
