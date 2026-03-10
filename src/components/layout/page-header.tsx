import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page header used on every dashboard page.
 * Displays a title, optional description, and optional action slot (e.g. button).
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8",
        className
      )}
    >
      <div className="space-y-1">
        <h1>{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-3 sm:mt-0 shrink-0">{action}</div>}
    </div>
  );
}
