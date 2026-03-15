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
      "3 AI replies (total)",
      "Basic analytics",
    ],
  },
  starter: {
    tagline: "For small businesses",
    features: [
      "1 location",
      "200 reviews/mo",
      "100 AI replies/mo",
      "Auto-post to Google",
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
      "Auto-post to Google",
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
      "Auto-post to Google",
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
      "Auto-post replies",
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
      <div className="card-elevated card-padding relative overflow-hidden">
        {/* Subtle mesh gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold">Current Plan</h3>
              <Badge variant="secondary" className="font-semibold">{planLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              {currentPlan === "free"
                ? "You're on the free plan with 3 AI replies. Upgrade to unlock unlimited replies and auto-posting."
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
          <p className="text-xs text-muted-foreground mt-5 pt-4 border-t">
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
        <h3 className="text-lg font-bold mb-1">Available Plans</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose the plan that fits your business
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
          {(
            ["free", "starter", "growth", "pro", "enterprise"] as PlanTier[]
          ).map((tier) => {
            const planInfo = PLAN_FEATURES[tier];
            const planLimits = PLAN_LIMITS[tier];
            const isCurrent = tier === currentPlan;

            return (
              <div
                key={tier}
                className={`relative flex flex-col card-padding rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? "card-glow bg-card shadow-xl"
                    : planInfo.popular
                    ? "card-elevated border-primary/30 shadow-md hover:shadow-lg"
                    : "card-elevated hover:shadow-md"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="btn-gradient border-0 text-white shadow-sm">Current</Badge>
                  </div>
                )}
                {planInfo.popular && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary" className="font-semibold shadow-sm">Popular</Badge>
                  </div>
                )}

                <div className="text-center mb-4 pt-3">
                  <h4 className="font-bold">{getPlan(tier).name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {planInfo.tagline}
                  </p>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold tracking-tight">
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
                      <Check className="w-4 h-4 mt-0.5 text-success shrink-0" />
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
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-semibold tabular-nums">
          {used}{" "}
          <span className="text-muted-foreground font-normal">
            / {isUnlimited ? "∞" : limit}
          </span>
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver
              ? "bg-destructive"
              : isWarning
              ? "bg-amber-500"
              : ""
          }`}
          style={{
            width: `${isUnlimited ? 0 : pct}%`,
            ...(!isOver && !isWarning
              ? { background: "linear-gradient(90deg, oklch(0.45 0.19 265), oklch(0.55 0.22 290))" }
              : {}),
          }}
        />
      </div>
      {isOver && (
        <p className="text-[11px] text-destructive font-medium">Limit reached — upgrade to continue</p>
      )}
    </div>
  );
}
