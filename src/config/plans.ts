// ============================================================================
// Plan & Pricing Configuration — Single Source of Truth
// ============================================================================
// All plan tiers, limits, features, and Stripe price IDs live here.
// Import PlanTier from @/lib/types (DB-aligned); config is derived here.
// ============================================================================

import "server-only";

import type { PlanTier } from "@/lib/types";

export interface PlanConfig {
  name: string;
  tier: PlanTier;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  limits: {
    locations: number;
    reviewsPerMonth: number;
    aiRepliesPerMonth: number;
  };
  stripePriceId?: string;
  popular?: boolean;
}

export const plans: PlanConfig[] = [
  {
    name: "Free Trial",
    tier: "free",
    price: 0,
    priceLabel: "$0",
    description: "Try it free — 5 AI replies, no credit card",
    features: [
      "1 location",
      "25 reviews/month",
      "5 AI replies (total)",
      "Basic analytics",
    ],
    limits: { locations: 1, reviewsPerMonth: 25, aiRepliesPerMonth: 5 },
  },
  {
    name: "Starter",
    tier: "starter",
    price: 39,
    priceLabel: "$39/mo",
    description: "For small businesses",
    features: [
      "1 location",
      "150 reviews/month",
      "75 AI replies/month",
      "CSV import",
      "Google & Yelp integration",
      "Email support",
    ],
    limits: { locations: 1, reviewsPerMonth: 150, aiRepliesPerMonth: 75 },
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  {
    name: "Growth",
    tier: "growth",
    price: 79,
    priceLabel: "$79/mo",
    description: "For growing teams",
    features: [
      "3 locations",
      "500 reviews/month",
      "250 AI replies/month",
      "CSV import",
      "Google & Yelp integration",
      "Auto-import reviews",
      "Priority support",
    ],
    limits: { locations: 3, reviewsPerMonth: 500, aiRepliesPerMonth: 250 },
    stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID,
    popular: true,
  },
  {
    name: "Pro",
    tier: "pro",
    price: 149,
    priceLabel: "$149/mo",
    description: "For multi-location brands",
    features: [
      "10 locations",
      "2,000 reviews/month",
      "1,000 AI replies/month",
      "Google & Yelp integration",
      "Auto-import reviews",
      "Auto-post to Google",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    limits: { locations: 10, reviewsPerMonth: 2000, aiRepliesPerMonth: 1000 },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
];

// ---------------------------------------------------------------------------
// Derived: PLAN_LIMITS indexed by tier
// ---------------------------------------------------------------------------

export const PLAN_LIMITS: Record<
  PlanTier,
  { reviews: number; replies: number; locations: number; price: number }
> = Object.fromEntries(
  plans.map((p) => [
    p.tier,
    {
      reviews: p.limits.reviewsPerMonth,
      replies: p.limits.aiRepliesPerMonth,
      locations: p.limits.locations,
      price: p.price,
    },
  ])
) as Record<
  PlanTier,
  { reviews: number; replies: number; locations: number; price: number }
>;

export function getPlan(tier: PlanTier): PlanConfig {
  return plans.find((p) => p.tier === tier)!;
}

export function isWithinLimit(value: number, limit: number): boolean {
  return limit === -1 || value < limit;
}

/**
 * Resolve a PlanTier from a Stripe Price ID.
 * Used by webhooks to detect plan changes via the Customer Portal.
 * Returns null if price ID doesn't match any known plan.
 */
export function resolvePlanFromPriceId(priceId: string): PlanTier | null {
  const match = plans.find(
    (p) => p.stripePriceId && p.stripePriceId === priceId
  );
  return match?.tier ?? null;
}
