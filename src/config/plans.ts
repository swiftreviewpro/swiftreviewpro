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
    name: "Free",
    tier: "free",
    price: 0,
    priceLabel: "$0",
    description: "Perfect for trying it out",
    features: [
      "1 location",
      "50 reviews/month",
      "3 AI replies (total)",
      "Basic analytics",
    ],
    limits: { locations: 1, reviewsPerMonth: 50, aiRepliesPerMonth: 3 },
  },
  {
    name: "Starter",
    tier: "starter",
    price: 39,
    priceLabel: "$39/mo",
    description: "For small businesses",
    features: [
      "1 location",
      "200 reviews/month",
      "100 AI replies/month",
      "CSV import",
      "Google & Yelp integration",
      "Auto-post to Google",
      "Email support",
    ],
    limits: { locations: 1, reviewsPerMonth: 200, aiRepliesPerMonth: 100 },
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
      "Auto-post to Google",
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
  {
    name: "Agency",
    tier: "enterprise",
    price: 299,
    priceLabel: "$299/mo",
    description: "For agencies and chains",
    features: [
      "50 locations",
      "Unlimited reviews",
      "Unlimited AI replies",
      "Google & Yelp integration",
      "Auto-import reviews",
      "Auto-post replies",
      "API access",
      "Dedicated support",
    ],
    limits: { locations: 50, reviewsPerMonth: -1, aiRepliesPerMonth: -1 },
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
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
