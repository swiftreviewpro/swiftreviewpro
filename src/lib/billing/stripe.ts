// ============================================================================
// Stripe Configuration — Lazy Initialization
// ============================================================================
// Canonical path: @/lib/billing/stripe
// Lazy-init prevents build-time crash when STRIPE_SECRET_KEY is absent
// (Vercel collects page data by importing routes during `next build`).
// ============================================================================

import "server-only";

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to your environment variables."
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}
