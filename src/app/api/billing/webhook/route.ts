// ============================================================================
// Stripe Webhook — Idempotent Event Processing
// ============================================================================
// 1. Verify Stripe signature
// 2. Check processed_webhooks table — skip duplicates
// 3. Process new events
// 4. Record event_id to prevent reprocessing on Stripe retries
//
// Admin client (service_role) is scoped exclusively to this route.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/config/plans";
import type { PlanTier } from "@/lib/types";

export async function POST(request: NextRequest) {
  // ---- 1. Signature verification ----
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ---- 2. Idempotency check — skip already-processed events ----
  const { data: existing } = await supabase
    .from("processed_webhooks")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    // Already processed — return 200 so Stripe stops retrying
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ---- 3. Process the event ----
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.organization_id;
        const plan = session.metadata?.plan as PlanTier;

        if (orgId && plan) {
          const limits = PLAN_LIMITS[plan];
          await supabase
            .from("subscriptions")
            .update({
              stripe_subscription_id:
                typeof session.subscription === "string"
                  ? session.subscription
                  : null,
              plan_tier: plan,
              status: "active",
              review_limit: limits.reviews,
              reply_limit: limits.replies,
              location_limit: limits.locations,
            })
            .eq("organization_id", orgId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("organization_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          const subAny = subscription as unknown as Record<string, unknown>;
          const periodStart = subAny.current_period_start as number | null;
          const periodEnd = subAny.current_period_end as number | null;

          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_start: periodStart
                ? new Date(periodStart * 1000).toISOString()
                : null,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            })
            .eq("organization_id", sub.organization_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer;

        const freeLimits = PLAN_LIMITS.free;
        await supabase
          .from("subscriptions")
          .update({
            plan_tier: "free",
            status: "canceled",
            stripe_subscription_id: null,
            review_limit: freeLimits.reviews,
            reply_limit: freeLimits.replies,
            location_limit: freeLimits.locations,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }

    // ---- 4. Record successful processing for idempotency ----
    await supabase.from("processed_webhooks").insert({
      event_id: event.id,
      event_type: event.type,
      metadata: {
        api_version: event.api_version,
        livemode: event.livemode,
        created: event.created,
      },
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    // Return 500 so Stripe retries the event later
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
