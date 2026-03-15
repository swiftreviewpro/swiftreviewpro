import Link from "next/link";
import { type LucideIcon, TrendingUp, TrendingDown, Minus, ArrowUpRight } from "lucide-react";
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
  /** Optional link — makes the entire card clickable */
  href?: string;
  className?: string;
}

/**
 * Analytics stat card with optional icon, trend indicator, and deep-link.
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
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

  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-center gap-1.5">
          {Icon && (
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          {href && (
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
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
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "card-interactive card-padding group block",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("card-elevated card-padding", className)}>
      {content}
    </div>
  );
}
