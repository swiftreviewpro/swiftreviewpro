"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cancelSubscription } from "@/lib/actions/billing-actions";

interface CancelSubscriptionProps {
  periodEnd: string | null;
}

export function CancelSubscription({ periodEnd }: CancelSubscriptionProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelSubscription();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "Your subscription has been canceled. You'll retain access until the end of your billing period."
      );
      setShowConfirm(false);
      // Reload to reflect updated state
      window.location.reload();
    });
  };

  const formattedDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="border border-border/60 rounded-2xl p-6 mt-8">
      <h3 className="text-sm font-semibold text-muted-foreground mb-1">
        Cancel Subscription
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        If you'd like to unsubscribe, you can cancel your plan below.
        {formattedDate && (
          <> You'll keep access to your current plan until <strong className="text-foreground">{formattedDate}</strong>.</>
        )}
      </p>

      {!showConfirm ? (
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/50"
          onClick={() => setShowConfirm(true)}
        >
          Cancel Subscription
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Are you sure? This will cancel your subscription at the end of the current billing period.
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
            >
              Keep Plan
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Yes, Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
