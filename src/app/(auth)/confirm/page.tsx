"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inner component that reads searchParams (needs Suspense wrapper).
 */
function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/onboarding";
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(next);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [next, router]);

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Email Confirmed!
      </h1>
      <p className="text-muted-foreground mb-6">
        Your email has been verified successfully. Let&rsquo;s get your account
        set up.
      </p>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}&hellip;
      </div>

      <Button onClick={() => router.push(next)} className="w-full">
        Continue Now
      </Button>
    </div>
  );
}

/**
 * Email confirmation landing page.
 * Users land here after clicking the verification link in their email.
 * Auto-redirects after a short delay.
 */
export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
