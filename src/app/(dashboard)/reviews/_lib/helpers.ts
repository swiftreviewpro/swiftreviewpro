// ============================================================================
// Review Helpers — shared utilities for review components
// ============================================================================

import type { ReviewStatus } from "@/lib/types";

export const STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; color: string; dotColor: string }
> = {
  new: {
    label: "New",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  draft_generated: {
    label: "Draft Ready",
    color:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  posted: {
    label: "Posted",
    color: "bg-muted text-muted-foreground",
    dotColor: "bg-muted-foreground",
  },
  needs_attention: {
    label: "Needs Attention",
    color: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    dotColor: "bg-red-500",
  },
  archived: {
    label: "Archived",
    color: "bg-muted text-muted-foreground",
    dotColor: "bg-muted-foreground/50",
  },
};

export const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "Unanswered" },
  { value: "negative", label: "Negative" },
  { value: "positive", label: "Positive" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "draft_generated", label: "Drafts Ready" },
  { value: "posted", label: "Posted" },
  { value: "archived", label: "Archived" },
] as const;

export const PLATFORMS = [
  "Google",
  "Yelp",
  "Facebook",
  "TripAdvisor",
  "Trustpilot",
  "BBB",
  "Healthgrades",
  "Zocdoc",
  "Other",
] as const;

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Format an ISO date string to a relative or short date.
 */
export function formatReviewDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Parse a CSV string into an array of row objects.
 * Assumes the first row is headers.
 */
export function parseCsv(
  text: string
): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() ?? "";
    });
    return row;
  });

  return { headers, rows };
}

/**
 * Parse a single CSV line, respecting quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
