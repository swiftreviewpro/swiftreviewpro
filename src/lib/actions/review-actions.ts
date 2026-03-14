// ============================================================================
// Reviews — Server Actions
// ============================================================================
// Typed server actions for review CRUD, CSV import, and status management.
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createReviewSchema,
  updateReviewSchema,
  csvReviewRowSchema,
} from "@/lib/validation/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { checkReviewEntitlement } from "@/lib/entitlements";
import { isValidStatusTransition } from "@/lib/types";
import type { Review, ReviewStatus } from "@/lib/types";

// ---- Helpers ----

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  return { supabase, userId: user.id, orgId: membership.organization_id };
}

export interface ReviewActionResult {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
  data?: Review | null;
}

export interface ReviewsListResult {
  error: string | null;
  data: Review[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ---- Fetch reviews (paginated, filterable) ----

export interface FetchReviewsParams {
  status?: string;
  locationId?: string;
  search?: string;
  ratingFilter?: string; // "positive" | "negative"
  page?: number;
  perPage?: number;
}

export async function fetchReviews(
  params: FetchReviewsParams = {}
): Promise<ReviewsListResult> {
  const ctx = await getAuthContext();
  if (!ctx)
    return { error: "Unauthorized", data: [], total: 0, page: 1, perPage: 20, totalPages: 0 };

  const {
    status = "all",
    locationId,
    search,
    ratingFilter,
    page = 1,
    perPage = 20,
  } = params;
  const offset = (page - 1) * perPage;

  let query = ctx.supabase
    .from("reviews")
    .select("*, location:locations(id, name), reply_drafts(*)", {
      count: "exact",
    })
    .eq("organization_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (locationId && locationId !== "all") {
    query = query.eq("location_id", locationId);
  }

  if (search) {
    // Sanitize search input to prevent PostgREST filter injection.
    // Strip characters that have special meaning in PostgREST filter syntax.
    const sanitized = search
      .replace(/[%_]/g, "")       // remove SQL wildcards
      .replace(/[,.()|]/g, "")   // remove PostgREST operators
      .trim()
      .slice(0, 100);            // cap length
    if (sanitized) {
      query = query.or(
        `reviewer_name.ilike.%${sanitized}%,review_text.ilike.%${sanitized}%`
      );
    }
  }

  if (ratingFilter === "positive") {
    query = query.gte("rating", 4);
  } else if (ratingFilter === "negative") {
    query = query.lte("rating", 2);
  }

  const { data: reviews, error, count } = await query;

  if (error) {
    return { error: error.message, data: [], total: 0, page, perPage, totalPages: 0 };
  }

  return {
    error: null,
    data: (reviews ?? []) as Review[],
    total: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  };
}

// ---- Fetch locations (for selects) ----

export async function fetchLocations(): Promise<{
  error: string | null;
  data: { id: string; name: string }[];
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: [] };

  const { data, error } = await ctx.supabase
    .from("locations")
    .select("id, name")
    .eq("organization_id", ctx.orgId)
    .eq("is_active", true)
    .order("name");

  if (error) return { error: error.message, data: [] };
  return { error: null, data: data ?? [] };
}

// ---- Create a single review ----

export async function createReview(
  formData: Record<string, unknown>
): Promise<ReviewActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  // Rate-limit burst creation
  const rl = await checkRateLimit(
    RATE_LIMITS.csvImport,
    `create-review:${ctx.userId}`,
    `create-review-org:${ctx.orgId}`
  );
  if (!rl.success) {
    return { error: rl.error ?? "Too many requests. Please slow down." };
  }

  const result = createReviewSchema.safeParse(formData);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors as Record<string, string[]>;
    return { error: Object.values(flat).flat()[0] ?? "Validation failed", fieldErrors: flat };
  }

  // Entitlement check: monthly review quota
  const entitlement = await checkReviewEntitlement(ctx.supabase, ctx.orgId, 1);
  if (!entitlement.allowed) {
    return { error: entitlement.error! };
  }

  const v = result.data;

  const { data: review, error } = await ctx.supabase
    .from("reviews")
    .insert({
      organization_id: ctx.orgId,
      location_id: v.location_id,
      reviewer_name: v.reviewer_name,
      rating: v.rating,
      review_text: v.review_text,
      platform: v.platform,
      review_date: v.review_date || new Date().toISOString(),
      source: v.source || "manual",
      status: "new" as ReviewStatus,
    })
    .select("*, location:locations(id, name), reply_drafts(*)")
    .single();

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "review.created",
    entity_type: "review",
    entity_id: review.id,
    metadata: {
      reviewer_name: v.reviewer_name,
      rating: v.rating,
      source: v.source || "manual",
    },
  });

  revalidatePath("/reviews");
  return { error: null, data: review as Review };
}

// ---- Update a review ----

export async function updateReview(
  reviewId: string,
  updates: Record<string, unknown>
): Promise<ReviewActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  const result = updateReviewSchema.safeParse(updates);
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors as Record<string, string[]>;
    return { error: Object.values(flat).flat()[0] ?? "Validation failed", fieldErrors: flat };
  }

  // V15: Strip status from updateReview — status changes must go through
  // updateReviewStatus() which enforces valid state transitions.
  const { status: _ignoredStatus, ...safeFields } = result.data;
  if (Object.keys(safeFields).length === 0) {
    return { error: "No valid fields to update. Use the status action to change review status." };
  }

  const { data: review, error } = await ctx.supabase
    .from("reviews")
    .update(safeFields)
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId)
    .select("*, location:locations(id, name), reply_drafts(*)")
    .single();

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "review.updated",
    entity_type: "review",
    entity_id: reviewId,
    metadata: { updates: result.data },
  });

  revalidatePath("/reviews");
  return { error: null, data: review as Review };
}

// ---- Update review status ----

export async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus
): Promise<ReviewActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  // Fetch current status to validate the transition
  const { data: current, error: fetchErr } = await ctx.supabase
    .from("reviews")
    .select("status")
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId)
    .single();

  if (fetchErr || !current) return { error: "Review not found." };

  if (!isValidStatusTransition(current.status as ReviewStatus, status)) {
    return {
      error: `Cannot change status from "${current.status}" to "${status}".`,
    };
  }

  const { data: review, error } = await ctx.supabase
    .from("reviews")
    .update({ status })
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId)
    .select("*, location:locations(id, name), reply_drafts(*)")
    .single();

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "review.status_changed",
    entity_type: "review",
    entity_id: reviewId,
    metadata: { from_status: current.status, new_status: status },
  });

  revalidatePath("/reviews");
  return { error: null, data: review as Review };
}

// ---- Delete review ----

export async function deleteReview(
  reviewId: string
): Promise<{ error: string | null }> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  const { error } = await ctx.supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId);

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "review.deleted",
    entity_type: "review",
    entity_id: reviewId,
  });

  revalidatePath("/reviews");
  return { error: null };
}

// ---- CSV Import ----

export interface CsvImportResult {
  error: string | null;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export async function importReviewsCsv(
  rows: Record<string, string>[],
  locationId: string
): Promise<CsvImportResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", imported: 0, skipped: 0, errors: [] };

  // V17: Server-side row limit to prevent oversized CSV uploads
  const CSV_MAX_ROWS = 1000;
  if (rows.length > CSV_MAX_ROWS) {
    return {
      error: `CSV exceeds the maximum of ${CSV_MAX_ROWS} rows. Please split into smaller files.`,
      imported: 0,
      skipped: 0,
      errors: [],
    };
  }

  // Rate limit: prevent import spam
  const rl = await checkRateLimit(RATE_LIMITS.csvImport, ctx.userId, ctx.orgId);
  if (!rl.success) {
    return { error: rl.error ?? "Rate limit exceeded.", imported: 0, skipped: 0, errors: [] };
  }

  // Entitlement check: monthly review quota (pre-check with row count)
  const entitlement = await checkReviewEntitlement(ctx.supabase, ctx.orgId, rows.length);
  if (!entitlement.allowed) {
    return { error: entitlement.error!, imported: 0, skipped: 0, errors: [] };
  }

  if (!locationId) {
    return { error: "Please select a location", imported: 0, skipped: 0, errors: [] };
  }

  const validRows: {
    organization_id: string;
    location_id: string;
    reviewer_name: string;
    rating: number;
    review_text: string;
    platform: string;
    review_date: string;
    source: "csv_import";
    status: "new";
  }[] = [];
  const rowErrors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const parsed = csvReviewRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid row";
      rowErrors.push({ row: i + 1, message: msg });
      continue;
    }

    validRows.push({
      organization_id: ctx.orgId,
      location_id: locationId,
      reviewer_name: parsed.data.reviewer_name,
      rating: Math.min(5, Math.max(1, parseInt(parsed.data.rating))),
      review_text: parsed.data.review_text,
      platform: parsed.data.platform,
      review_date: parsed.data.review_date,
      source: "csv_import",
      status: "new",
    });
  }

  if (validRows.length === 0) {
    return {
      error: "No valid rows to import",
      imported: 0,
      skipped: rowErrors.length,
      errors: rowErrors,
    };
  }

  const { data: imported, error } = await ctx.supabase
    .from("reviews")
    .insert(validRows)
    .select();

  if (error) {
    return { error: error.message, imported: 0, skipped: rowErrors.length, errors: rowErrors };
  }

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "reviews.imported_csv",
    entity_type: "review",
    metadata: { count: imported.length, skipped: rowErrors.length },
  });

  revalidatePath("/reviews");
  return {
    error: null,
    imported: imported.length,
    skipped: rowErrors.length,
    errors: rowErrors,
  };
}
