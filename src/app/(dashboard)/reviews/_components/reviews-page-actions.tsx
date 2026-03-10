"use client";

/**
 * Header action buttons for the reviews page.
 * These are rendered in the PageHeader action slot but need client-side
 * interactivity. The actual dialog opening is handled by the ReviewsInbox
 * component via a simple event dispatch pattern.
 */

import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";

export function ReviewsPageActions() {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          window.dispatchEvent(new CustomEvent("reviews:open-csv-import"))
        }
      >
        <Upload className="w-4 h-4 mr-1.5" />
        Import CSV
      </Button>
      <Button
        size="sm"
        onClick={() =>
          window.dispatchEvent(new CustomEvent("reviews:open-add-review"))
        }
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Add Review
      </Button>
    </div>
  );
}
