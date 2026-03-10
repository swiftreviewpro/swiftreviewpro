import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

/**
 * Inline loading spinner.
 */
export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size], className)} />
  );
}

/**
 * Full-page loading state with centered spinner.
 */
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for cards/content during loading.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-elevated card-padding space-y-3", className)}>
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  );
}
