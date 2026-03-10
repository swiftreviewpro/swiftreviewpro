// ============================================================================
// Dashboard & Analytics — Server Actions
// ============================================================================
// Fetch KPI stats, activity feed, and analytics data from Supabase.
// ============================================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import type { Review, ReviewStatus, ActivityLog } from "@/lib/types";

// ---- Auth helper ----

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

// ============================================================================
// Dashboard KPIs
// ============================================================================

export interface DashboardStats {
  totalReviews: number;
  pendingResponse: number;
  draftsReady: number;
  posted: number;
  negativeAttention: number;
  avgResponseHours: number | null;
  avgRating: number | null;
  reviewsByStatus: Record<string, number>;
}

export async function fetchDashboardStats(): Promise<{
  error: string | null;
  data: DashboardStats | null;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: null };

  // All reviews
  const { count: totalReviews } = await ctx.supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", ctx.orgId);

  // By status counts
  const statusCounts: Record<string, number> = {};
  for (const status of [
    "new",
    "draft_generated",
    "approved",
    "posted",
    "needs_attention",
    "archived",
  ] as ReviewStatus[]) {
    const { count } = await ctx.supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.orgId)
      .eq("status", status);
    statusCounts[status] = count ?? 0;
  }

  // Negative reviews needing attention (rating <= 2 AND status != posted/archived)
  const { count: negativeAttention } = await ctx.supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", ctx.orgId)
    .lte("rating", 2)
    .not("status", "in", '("posted","archived")');

  // Average rating
  const { data: ratingData } = await ctx.supabase
    .from("reviews")
    .select("rating")
    .eq("organization_id", ctx.orgId);

  const avgRating =
    ratingData && ratingData.length > 0
      ? ratingData.reduce((s, r) => s + r.rating, 0) / ratingData.length
      : null;

  // Average response turnaround: time from review created_at to first draft created_at
  const { data: respondedReviews } = await ctx.supabase
    .from("reviews")
    .select("created_at, reply_drafts(created_at)")
    .eq("organization_id", ctx.orgId)
    .not("status", "eq", "new");

  let avgResponseHours: number | null = null;
  if (respondedReviews && respondedReviews.length > 0) {
    const durations: number[] = [];
    for (const r of respondedReviews) {
      const drafts = r.reply_drafts as { created_at: string }[] | null;
      if (drafts && drafts.length > 0) {
        const firstDraft = drafts.reduce((min, d) =>
          d.created_at < min.created_at ? d : min
        );
        const diff =
          new Date(firstDraft.created_at).getTime() -
          new Date(r.created_at).getTime();
        if (diff >= 0) durations.push(diff / (1000 * 60 * 60));
      }
    }
    if (durations.length > 0) {
      avgResponseHours =
        durations.reduce((s, d) => s + d, 0) / durations.length;
    }
  }

  return {
    error: null,
    data: {
      totalReviews: totalReviews ?? 0,
      pendingResponse: statusCounts["new"] ?? 0,
      draftsReady: statusCounts["draft_generated"] ?? 0,
      posted: statusCounts["posted"] ?? 0,
      negativeAttention: negativeAttention ?? 0,
      avgResponseHours,
      avgRating,
      reviewsByStatus: statusCounts,
    },
  };
}

// ============================================================================
// Recent Activity Feed
// ============================================================================

export async function fetchRecentActivity(): Promise<{
  error: string | null;
  data: ActivityLog[];
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: [] };

  const { data, error } = await ctx.supabase
    .from("activity_logs")
    .select("*, user:users(full_name, email)")
    .eq("organization_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) return { error: error.message, data: [] };
  return { error: null, data: (data as ActivityLog[]) ?? [] };
}

// ============================================================================
// Pending Reviews (latest new reviews for quick action widget)
// ============================================================================

export async function fetchPendingReviews(): Promise<{
  error: string | null;
  data: Review[];
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: [] };

  const { data, error } = await ctx.supabase
    .from("reviews")
    .select("*, location:locations(id, name)")
    .eq("organization_id", ctx.orgId)
    .eq("status", "new")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return { error: error.message, data: [] };
  return { error: null, data: (data as Review[]) ?? [] };
}

// ============================================================================
// Analytics Data
// ============================================================================

export interface AnalyticsData {
  totalReviews: number;
  responsesDrafted: number;
  responsesPosted: number;
  responseRate: number;
  avgTimeToPostedHours: number | null;
  negativeCount: number;
  avgRating: number | null;
  reviewsByStatus: Record<string, number>;
  reviewsByRating: Record<number, number>;
  reviewsOverTime: { month: string; count: number }[];
  ratingsOverTime: { month: string; avg: number }[];
  topLocations: { name: string; count: number; avgRating: number }[];
}

export async function fetchAnalyticsData(): Promise<{
  error: string | null;
  data: AnalyticsData | null;
}> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Unauthorized", data: null };

  // All reviews with location + drafts
  const { data: reviews } = await ctx.supabase
    .from("reviews")
    .select("*, location:locations(id, name), reply_drafts(*)")
    .eq("organization_id", ctx.orgId)
    .order("review_date", { ascending: true });

  if (!reviews) return { error: "Failed to load reviews", data: null };

  const total = reviews.length;

  // Status counts
  const statusCounts: Record<string, number> = {};
  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let negativeCount = 0;
  let responsesDrafted = 0;
  let responsesPosted = 0;

  // Time-to-posted durations
  const postedDurations: number[] = [];

  // Monthly aggregation
  const monthlyReviews: Record<string, number> = {};
  const monthlyRatings: Record<string, { sum: number; count: number }> = {};

  // Location aggregation
  const locationMap: Record<
    string,
    { name: string; count: number; ratingSum: number }
  > = {};

  for (const r of reviews as Review[]) {
    // Status
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;

    // Rating
    ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    ratingSum += r.rating;
    if (r.rating <= 2) negativeCount++;

    // Drafts
    const drafts = r.reply_drafts ?? [];
    if (drafts.length > 0) responsesDrafted++;
    if (r.status === "posted") {
      responsesPosted++;
      // Time to posted
      const postedDraft = drafts.find((d) => d.posted_at);
      if (postedDraft) {
        const diff =
          new Date(postedDraft.posted_at!).getTime() -
          new Date(r.created_at).getTime();
        if (diff >= 0) postedDurations.push(diff / (1000 * 60 * 60));
      }
    }

    // Monthly
    const month = r.review_date.slice(0, 7); // YYYY-MM
    monthlyReviews[month] = (monthlyReviews[month] || 0) + 1;
    if (!monthlyRatings[month])
      monthlyRatings[month] = { sum: 0, count: 0 };
    monthlyRatings[month].sum += r.rating;
    monthlyRatings[month].count++;

    // Location
    const locName = r.location?.name ?? "Unknown";
    if (!locationMap[locName])
      locationMap[locName] = { name: locName, count: 0, ratingSum: 0 };
    locationMap[locName].count++;
    locationMap[locName].ratingSum += r.rating;
  }

  const responseRate = total > 0 ? (responsesPosted / total) * 100 : 0;
  const avgRating = total > 0 ? ratingSum / total : null;
  const avgTimeToPostedHours =
    postedDurations.length > 0
      ? postedDurations.reduce((s, d) => s + d, 0) / postedDurations.length
      : null;

  // Sort months
  const sortedMonths = Object.keys(monthlyReviews).sort();
  const reviewsOverTime = sortedMonths.map((m) => ({
    month: m,
    count: monthlyReviews[m],
  }));
  const ratingsOverTime = sortedMonths.map((m) => ({
    month: m,
    avg: Math.round((monthlyRatings[m].sum / monthlyRatings[m].count) * 10) / 10,
  }));

  // Top locations
  const topLocations = Object.values(locationMap)
    .map((l) => ({
      name: l.name,
      count: l.count,
      avgRating: Math.round((l.ratingSum / l.count) * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    error: null,
    data: {
      totalReviews: total,
      responsesDrafted,
      responsesPosted,
      responseRate: Math.round(responseRate * 10) / 10,
      avgTimeToPostedHours,
      negativeCount,
      avgRating,
      reviewsByStatus: statusCounts,
      reviewsByRating: ratingCounts,
      reviewsOverTime,
      ratingsOverTime,
      topLocations,
    },
  };
}
