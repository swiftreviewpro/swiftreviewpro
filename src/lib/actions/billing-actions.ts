// ============================================================================
// Billing — Server Actions
// ============================================================================
// Fetch subscription data, create checkout sessions, and manage portal.
// ============================================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { getPlan } from "@/config/plans";
import { checkLocationEntitlement } from "@/lib/entitlements";
import type { Subscription, PlanTier } from "@/lib/types";

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

  return { supabase, userId: user.id, orgId: membership.organization_id, email: user.email };
}

// ============================================================================
// Fetch subscription
// ============================================================================

export interface BillingData {
  subscription: Subscription | null;
  locationCount: number;
  reviewCountThisMonth: number;
  replyCountThisMonth: number;
}

export async function fetchBillingData(): Promise<{
  error: string | null;
  data: BillingData | null;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: null };

  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", ctx.orgId)
    .single();

  // Current month usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: locationCount } = await ctx.supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", ctx.orgId)
    .eq("is_active", true);

  const { count: reviewCount } = await ctx.supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", ctx.orgId)
    .gte("created_at", startOfMonth);

  const { count: replyCount } = await ctx.supabase
    .from("reply_drafts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", ctx.orgId)
    .gte("created_at", startOfMonth);

  return {
    error: null,
    data: {
      subscription: (sub as Subscription) ?? null,
      locationCount: locationCount ?? 0,
      reviewCountThisMonth: reviewCount ?? 0,
      replyCountThisMonth: replyCount ?? 0,
    },
  };
}

// ============================================================================
// Create Checkout Session
// ============================================================================

export async function createCheckoutSession(
  plan: "starter" | "growth" | "pro" | "enterprise"
): Promise<{ error: string | null; url: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", url: null };

const planConfig = getPlan(plan);
    if (!planConfig?.stripePriceId) return { error: "Invalid plan", url: null };

  try {
    // Get or create Stripe customer
    const { data: sub } = await ctx.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("organization_id", ctx.orgId)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: ctx.email || undefined,
        metadata: { organization_id: ctx.orgId, user_id: ctx.userId },
      });
      customerId = customer.id;
      await ctx.supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("organization_id", ctx.orgId);
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: { organization_id: ctx.orgId, plan },
    });

    return { error: null, url: session.url };
  } catch (err) {
    console.error("Checkout error:", err);
    return { error: "Failed to create checkout session", url: null };
  }
}

// ============================================================================
// Customer Portal
// ============================================================================

export async function createPortalSession(): Promise<{
  error: string | null;
  url: string | null;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", url: null };

  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", ctx.orgId)
    .single();

  if (!sub?.stripe_customer_id) {
    return { error: "No billing account found", url: null };
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return { error: null, url: session.url };
  } catch (err) {
    console.error("Portal error:", err);
    return { error: "Failed to open billing portal", url: null };
  }
}

// ============================================================================
// Cancel Subscription (sets cancel_at_period_end)
// ============================================================================

export async function cancelSubscription(): Promise<{
  error: string | null;
  success: boolean;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", success: false };

  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("stripe_subscription_id, plan_tier")
    .eq("organization_id", ctx.orgId)
    .single();

  if (!sub?.stripe_subscription_id) {
    return { error: "No active subscription found", success: false };
  }

  if (sub.plan_tier === "free") {
    return { error: "You are already on the free plan", success: false };
  }

  try {
    await getStripe().subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return { error: null, success: true };
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return { error: "Failed to cancel subscription. Please try again.", success: false };
  }
}

// ============================================================================
// Check location limit (delegates to centralized entitlement helper)
// ============================================================================

export async function checkLocationLimit(): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: PlanTier;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { allowed: false, current: 0, limit: 0, plan: "free" };

  const result = await checkLocationEntitlement(ctx.supabase, ctx.orgId);
  return {
    allowed: result.allowed,
    current: result.current,
    limit: result.limit,
    plan: result.plan,
  };
}
