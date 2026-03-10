// ============================================================================
// Analytics Types
// ============================================================================
// Canonical path: @/lib/analytics/types
// ============================================================================

import type { ReviewStatus } from "@/lib/types";

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

export interface AnalyticsFilters {
  dateRange?: { start: string; end: string };
  locationId?: string;
  platform?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}
