// ============================================================================
// SwiftReview Pro — Core Type Definitions
// ============================================================================
// Aligned with the Supabase/PostgreSQL schema in supabase/migrations/.
// ============================================================================

// ---------- Enums (mirror PostgreSQL enum types) ----------

export const REVIEW_STATUSES = [
  "new",
  "draft_generated",
  "approved",
  "posted",
  "needs_attention",
  "archived",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// ---------- Valid status transitions ----------
// Defines which statuses a review can move TO from each status.
// "needs_attention" and "archived" are reachable from any status.
// The happy path is: new → draft_generated → approved → posted.

export const VALID_STATUS_TRANSITIONS: Record<ReviewStatus, readonly ReviewStatus[]> = {
  new:              ["draft_generated", "needs_attention", "archived"],
  draft_generated:  ["approved", "new", "needs_attention", "archived"],
  approved:         ["posted", "draft_generated", "needs_attention", "archived"],
  posted:           ["archived"],
  needs_attention:  ["new", "draft_generated", "approved", "archived"],
  archived:         ["new"],
} as const;

/**
 * Returns true if transitioning from `from` to `to` is a valid status change.
 */
export function isValidStatusTransition(
  from: ReviewStatus,
  to: ReviewStatus
): boolean {
  if (from === to) return true; // no-op is always valid
  return VALID_STATUS_TRANSITIONS[from].includes(to);
}

export const REVIEW_SOURCES = ["manual", "csv_import", "api", "google_business", "yelp"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const INTEGRATION_PROVIDERS = ["google_business", "yelp"] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const MEMBER_ROLES = ["owner", "admin", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export type PlanTier = "free" | "starter" | "growth" | "pro";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

// ---------- Database Row Types ----------
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  category: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  google_place_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandSettings {
  id: string;
  organization_id: string;
  tone: string;
  style_notes: string | null;
  banned_phrases: string[];
  signature_line: string | null;
  escalation_wording: string | null;
  additional_instructions: string | null;
  escalation_email: string | null;
  escalation_phone: string | null;
  closing_style: string | null;
  allow_offline_resolution: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  organization_id: string;
  location_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  platform: string;
  status: ReviewStatus;
  source: ReviewSource;
  external_id: string | null;
  review_date: string;
  created_at: string;
  updated_at: string;
  // Joined fields (optional when fetching with relations)
  location?: Location;
  reply_drafts?: ReplyDraft[];
}

export interface ReplyDraft {
  id: string;
  review_id: string;
  organization_id: string;
  content: string;
  version: number;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined
  user?: Pick<User, "full_name" | "email">;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  review_limit: number;
  reply_limit: number;
  location_limit: number;
  created_at: string;
  updated_at: string;
}

// ---------- API Response Wrappers ----------
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ---------- Form / Request Types ----------
export interface CreateOrganizationInput {
  name: string;
  slug?: string;
}

export interface UpdateBrandSettingsInput {
  tone: string;
  style_notes?: string;
  banned_phrases?: string[];
  signature_line?: string;
  escalation_wording?: string;
  additional_instructions?: string;
}

export interface CreateLocationInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  google_place_id?: string;
}

export interface CreateReviewInput {
  location_id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  platform: string;
  review_date?: string;
  source?: ReviewSource;
}

export interface GenerateReplyInput {
  review_id: string;
}

export interface CsvReviewRow {
  reviewer_name: string;
  rating: string;
  review_text: string;
  platform: string;
  review_date: string;
  location_name?: string;
}

// ---------- Analytics ----------
export interface AnalyticsSummary {
  total_reviews: number;
  average_rating: number;
  response_rate: number;
  reviews_this_month: number;
  reviews_by_status: Record<ReviewStatus, number>;
  reviews_by_rating: Record<number, number>;
  reviews_over_time: { date: string; count: number }[];
  avg_rating_over_time: { date: string; avg: number }[];
  top_locations: { name: string; count: number; avg_rating: number }[];
}

// ---------- Integrations ----------

export type IntegrationStatus = "active" | "paused" | "error" | "disconnected";

export interface Integration {
  id: string;
  organization_id: string;
  provider: IntegrationProvider;
  /** Display label for the connection (e.g. GBP account name, Yelp biz name) */
  label: string;
  /** Provider-specific credentials / identifiers (encrypted at rest, opaque string) */
  credentials: string;
  /** Which location this integration feeds reviews into */
  location_id: string;
  status: IntegrationStatus;
  /** When reviews were last synced */
  last_synced_at: string | null;
  /** Number of reviews imported via this integration */
  review_count: number;
  auto_import: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  location?: Location;
}
