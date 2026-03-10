"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mb-4">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      <Button onClick={reset} variant="outline" size="sm">
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  );
}
