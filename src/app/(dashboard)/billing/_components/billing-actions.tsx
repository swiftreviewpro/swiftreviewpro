"use client";

import { useTransition } from "react";
import { Loader2, Zap, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createCheckoutSession,
  createPortalSession,
} from "@/lib/actions/billing-actions";
import type { PlanTier } from "@/lib/types";

interface BillingActionsProps {
  currentPlan: PlanTier;
  targetPlan?: PlanTier;
  hasStripeCustomer: boolean;
  variant?: "header" | "card";
}

export function BillingActions({
  currentPlan,
  targetPlan,
  hasStripeCustomer,
  variant = "header",
}: BillingActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpgrade = (plan: "starter" | "growth" | "pro") => {
    startTransition(async () => {
      const result = await createCheckoutSession(plan);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    });
  };

  const handlePortal = () => {
    startTransition(async () => {
      const result = await createPortalSession();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    });
  };

  // Card variant — buttons inside plan cards
  if (variant === "card" && targetPlan) {
    if (targetPlan === currentPlan) {
      return (
        <Button variant="secondary" className="w-full" disabled>
          Current Plan
        </Button>
      );
    }

    if (targetPlan === "free") {
      if (currentPlan !== "free" && hasStripeCustomer) {
        return (
          <Button
            variant="outline"
            className="w-full"
            onClick={handlePortal}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            )}
            Manage Subscription
          </Button>
        );
      }
      return (
        <Button variant="secondary" className="w-full" disabled>
          Free Tier
        </Button>
      );
    }

    return (
      <Button
        className="w-full"
        onClick={() =>
          handleUpgrade(targetPlan as "starter" | "growth" | "pro")
        }
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Zap className="mr-1.5 h-3.5 w-3.5" />
        )}
        {currentPlan === "free" ? "Upgrade" : "Switch Plan"}
      </Button>
    );
  }

  // Header variant — manage subscription button
  if (variant === "header") {
    if (currentPlan !== "free" && hasStripeCustomer) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePortal}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
          )}
          Manage Subscription
        </Button>
      );
    }
    return null;
  }

  return null;
}
