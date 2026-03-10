// ============================================================================
// DemoBanner — persistent banner shown to demo users in the dashboard
// ============================================================================

import { IS_DEMO_MODE } from "@/lib/demo";
import { Info } from "lucide-react";

/**
 * Renders a small amber banner at the top of the dashboard when the current
 * user is in demo mode. Purely informational — no dismiss.
 *
 * This is a server component that only checks the env var.
 * It is rendered unconditionally in the dashboard layout but self-hides
 * when demo mode is off.
 */
export function DemoBanner() {
  if (!IS_DEMO_MODE) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
    >
      <Info className="h-4 w-4 shrink-0" />
      <span>
        You&apos;re viewing <strong>SwiftReview Pro</strong> in demo mode.
        Data is sample data and resets periodically.
      </span>
    </div>
  );
}
