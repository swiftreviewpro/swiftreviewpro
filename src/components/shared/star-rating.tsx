import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

/**
 * Star rating display — renders filled/empty stars with optional numeric value.
 */
export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
