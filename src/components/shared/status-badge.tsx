import type { ReviewStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ReviewStatus, { label: string; classes: string }> = {
  new: {
    label: "New",
    classes: "bg-info/10 text-info border-info/20",
  },
  draft_generated: {
    label: "Draft Ready",
    classes: "bg-warning/10 text-warning-foreground border-warning/20",
  },
  approved: {
    label: "Approved",
    classes: "bg-success/10 text-success border-success/20",
  },
  posted: {
    label: "Posted",
    classes: "bg-success/15 text-success border-success/25",
  },
  needs_attention: {
    label: "Needs Attention",
    classes: "bg-destructive/10 text-destructive border-destructive/20",
  },
  archived: {
    label: "Archived",
    classes: "bg-muted text-muted-foreground border-border",
  },
};

interface StatusBadgeProps {
  status: ReviewStatus;
  className?: string;
}

/**
 * Color-coded status badge using design system status tokens.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.classes,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
