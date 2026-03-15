"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Zap, Lock } from "lucide-react";
import { getReplyUsage } from "@/lib/actions/reply-actions";
import type { PlanTier } from "@/lib/types";

/**
 * Upgrade wall banner that appears above the reply editor when a free user
 * is approaching or has hit their reply limit.
 *
 * Shows:
 * - "X of 3 free replies used" when approaching limit
 * - Full upgrade CTA when limit reached
 */
export function UpgradeWall({
  onUpgradeClick,
}: {
  onUpgradeClick?: () => void;
}) {
  const [usage, setUsage] = useState<{
    current: number;
    limit: number;
    plan: PlanTier;
    allowed: boolean;
  } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getReplyUsage();
      setUsage(result);
    });
  }, []);

  // Only show for free plan users
  if (!usage || usage.plan !== "free") return null;

  const remaining = Math.max(0, usage.limit - usage.current);
  const isAtLimit = !usage.allowed;

  // Full upgrade wall when limit is hit
  if (isAtLimit) {
    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 text-center">
        <div className="absolute top-2 right-3">
          <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
            <Lock className="w-2.5 h-2.5 mr-1" />
            Limit Reached
          </Badge>
        </div>
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
        <h4 className="font-bold text-base mb-1">
          You&apos;ve used all {usage.limit} free AI replies
        </h4>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Upgrade to a paid plan for unlimited AI replies, auto-posting to Google,
          platform integrations, and more.
        </p>
        <Link href="/billing" onClick={onUpgradeClick}>
          <Button className="btn-gradient border-0 h-10 px-6">
            <Zap className="mr-1.5 h-4 w-4" />
            Upgrade Now — From $39/mo
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-[11px] text-muted-foreground mt-3">
          Cancel anytime · All plans include a free trial
        </p>
      </div>
    );
  }

  // Subtle remaining counter when approaching limit (1 or 2 left)
  if (remaining <= 2) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300 flex-1">
          <span className="font-semibold">{remaining}</span> of {usage.limit} free AI replies remaining.{" "}
          <Link href="/billing" className="font-semibold underline underline-offset-2 hover:no-underline">
            Upgrade for unlimited
          </Link>
        </p>
      </div>
    );
  }

  return null;
}
