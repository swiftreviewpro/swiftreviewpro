"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mb-4">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Setup hit a snag</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Something went wrong during onboarding. Your progress has been saved —
        click below to try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try Again
      </button>
    </div>
  );
}
