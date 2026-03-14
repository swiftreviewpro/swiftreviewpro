import { Suspense } from "react";
import type { Metadata } from "next";
import { Check, Zap, CreditCard, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SkeletonCard } from "@/components/shared/loading";
import { fetchBillingData } from "@/lib/actions/billing-actions";
import { PLAN_LIMITS, getPlan } from "@/config/plans";
import type { PlanTier } from "@/lib/types";
import { BillingActions } from "./_components/billing-actions";

export const metadata: Metadata = {
  title: "Billing | SwiftReview Pro",
  description: "Manage your subscription plan and view usage",
};

const PLAN_FEATURES: Record<
  PlanTier,
  { tagline: string; features: string[]; popular?: boolean }
> = {
  free: {
    tagline: "Get started",
    features: [
      "1 location",
      "50 reviews/mo",
      "20 AI replies/mo",
      "Basic analytics",
    ],
  },
  starter: {
    tagline: "For small businesses",
    features: [
      "1 location",
      "200 reviews/mo",
      "100 AI replies/mo",
      "CSV import",
      "Email support",
    ],
  },
  growth: {
    tagline: "For growing teams",
    features: [
      "3 locations",
      "500 reviews/mo",
      "250 AI replies/mo",
      "CSV import",
      "Priority support",
    ],
    popular: true,
  },
  pro: {
    tagline: "For multi-location brands",
    features: [
      "10 locations",
      "2,000 reviews/mo",
      "1,000 AI replies/mo",
      "CSV import",
      "Priority support",
      "API access",
    ],
  },
  enterprise: {
    tagline: "For agencies and chains",
    features: [
      "50 locations",
      "Unlimited reviews",
      "Unlimited AI replies",
      "API access",
      "Dedicated support",
      "White-label options",
    ],
  },
};

export default function BillingPage() {
  return (
    <div className="section-gap">
      <PageHeader
        title="Billing"
        description="Manage your subscription plan and view usage"
      />

      <Suspense
        fallback={
          <div className="space-y-6">
            <SkeletonCard className="h-40" />
            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }, (_, i) => (
                <SkeletonCard key={i} className="h-80" />
              ))}
            </div>
          </div>
        }
      >
        <BillingContent />
      </Suspense>
    </div>
  );
}

async function BillingContent() {
  const { data, error } = await fetchBillingData();

  if (error || !data) {
    return (
      <div className="card-elevated card-padding text-center py-12">
        <p className="text-muted-foreground text-sm">
          {error ?? "Unable to load billing data."}
        </p>
      </div>
    );
  }

  const { subscription, locationCount, reviewCountThisMonth, replyCountThisMonth } = data;
  const currentPlan = (subscription?.plan_tier ?? "free") as PlanTier;
  const limits = PLAN_LIMITS[currentPlan];
  const planLabel = getPlan(currentPlan).name;

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <div className="card-elevated card-padding">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Current Plan</h3>
              <Badge variant="secondary">{planLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentPlan === "free"
                ? "You're on the free tier. Upgrade for more features."
                : `You're on the ${planLabel} plan at $${limits.price}/month.`}
            </p>
          </div>
          <BillingActions currentPlan={currentPlan} hasStripeCustomer={!!subscription?.stripe_customer_id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UsageMeter
            label="Locations"
            used={locationCount}
            limit={limits.locations}
          />
          <UsageMeter
            label="Reviews this month"
            used={reviewCountThisMonth}
            limit={limits.reviews}
          />
          <UsageMeter
            label="AI Replies this month"
            used={replyCountThisMonth}
            limit={limits.replies}
          />
        </div>

        {subscription?.current_period_end && (
          <p className="text-xs text-muted-foreground mt-4">
            Current period ends{" "}
            {new Date(subscription.current_period_end).toLocaleDateString(
              "en-US",
              { month: "long", day: "numeric", year: "numeric" }
            )}
          </p>
        )}
      </div>

      {/* Plan Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Available Plans</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the plan that fits your business
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          {(
            ["free", "starter", "growth", "pro", "enterprise"] as PlanTier[]
          ).map((tier) => {
            const planInfo = PLAN_FEATURES[tier];
            const planLimits = PLAN_LIMITS[tier];
            const isCurrent = tier === currentPlan;

            return (
              <div
                key={tier}
                className={`card-elevated card-padding relative flex flex-col ${
                  isCurrent ? "ring-2 ring-primary" : ""
                } ${planInfo.popular ? "border-primary/50" : ""}`}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge>Current</Badge>
                  </div>
                )}
                {planInfo.popular && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">Popular</Badge>
                  </div>
                )}

                <div className="text-center mb-4 pt-2">
                  <h4 className="font-semibold">{getPlan(tier).name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {planInfo.tagline}
                  </p>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">
                      ${planLimits.price}
                    </span>
                    {planLimits.price > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                </div>

                <Separator className="mb-4" />

                <ul className="space-y-2.5 flex-1">
                  {planInfo.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <BillingActions
                    currentPlan={currentPlan}
                    targetPlan={tier}
                    hasStripeCustomer={!!subscription?.stripe_customer_id}
                    variant="card"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isWarning = !isUnlimited && pct >= 80;
  const isOver = !isUnlimited && pct >= 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used}{" "}
          <span className="text-muted-foreground">
            / {isUnlimited ? "∞" : limit}
          </span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOver
              ? "bg-destructive"
              : isWarning
              ? "bg-amber-500"
              : "bg-primary"
          }`}
          style={{ width: `${isUnlimited ? 0 : pct}%` }}
        />
      </div>
      {isOver && (
        <p className="text-[11px] text-destructive">Limit reached — upgrade to continue</p>
      )}
    </div>
  );
}
