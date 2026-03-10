// ============================================================================
// Database Types — Row-level types matching Supabase schema
// ============================================================================
// Canonical path: @/lib/db/types
// ============================================================================

// Re-export database row types from the main types module.
// When Supabase codegen is configured, this file will be replaced with
// auto-generated types from `supabase gen types typescript`.

export type {
  User,
  Organization,
  OrganizationMember,
  Location,
  BrandSettings,
  Review,
  ReplyDraft,
  ActivityLog,
  Subscription,
} from "@/lib/types";
