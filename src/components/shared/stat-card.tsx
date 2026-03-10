import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

/**
 * Analytics stat card with optional icon and trend indicator.
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const TrendIcon =
    trend && trend.value > 0
      ? TrendingUp
      : trend && trend.value < 0
      ? TrendingDown
      : Minus;

  const trendColor =
    trend && trend.value > 0
      ? "text-success"
      : trend && trend.value < 0
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className={cn("card-elevated card-padding", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
              <TrendIcon className="w-3 h-3" />
              {Math.abs(trend.value)}%
            </span>
          )}
          {(description || trend?.label) && (
            <span className="text-xs text-muted-foreground">
              {trend?.label || description}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
