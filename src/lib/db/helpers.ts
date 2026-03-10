// ============================================================================
// Database Helpers — Common DB operations
// ============================================================================

import { createClient } from "@/lib/supabase/server";

/**
 * Log an activity to the activity_logs table.
 * Fails silently — activity logging should never break the main operation.
 */
export async function logActivity(params: {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("activity_logs").insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Activity logging is non-critical — swallow errors
    console.warn("[logActivity] Failed to log:", params.action);
  }
}
