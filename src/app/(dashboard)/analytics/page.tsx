import { Suspense } from "react";
import type { Metadata } from "next";
import {
  BarChart3,
  MessageSquare,
  Send,
  FileText,
  Clock,
  AlertTriangle,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonCard } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { fetchAnalyticsData } from "@/lib/actions/dashboard-actions";
import {
  ReviewsOverTimeChart,
  RatingTrendChart,
  StatusBreakdownChart,
} from "./_components/charts";

export const metadata: Metadata = {
  title: "Analytics | SwiftReview Pro",
  description: "Review performance insights and trends",
};

export default function AnalyticsPage() {
  return (
    <div className="section-gap">
      <PageHeader
        title="Analytics"
        description="Review performance insights and trends"
      />

      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <SkeletonCard className="h-80" />
              <SkeletonCard className="h-80" />
            </div>
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}

async function AnalyticsContent() {
  const { data, error } = await fetchAnalyticsData();

  if (error || !data) {
    return (
      <div className="card-elevated card-padding text-center py-12">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 mx-auto mb-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t load analytics</p>
        <p className="text-muted-foreground text-sm mt-0.5">
          {error ?? "Please try refreshing the page."}
        </p>
      </div>
    );
  }

  if (data.totalReviews === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics yet"
        description="Analytics will populate once you import or add your first reviews."
        action={
          <Link href="/reviews">
            <Button size="sm">
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Go to Reviews
            </Button>
          </Link>
        }
      />
    );
  }

  const responseTimeLabel =
    data.avgTimeToPostedHours !== null
      ? data.avgTimeToPostedHours < 1
        ? `${Math.round(data.avgTimeToPostedHours * 60)}m`
        : `${Math.round(data.avgTimeToPostedHours)}h`
      : "—";

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Reviews"
          value={data.totalReviews}
          icon={MessageSquare}
        />
        <StatCard
          title="Responses Drafted"
          value={data.responsesDrafted}
          icon={FileText}
        />
        <StatCard
          title="Responses Posted"
          value={data.responsesPosted}
          icon={Send}
        />
        <StatCard
          title="Response Rate"
          value={`${data.responseRate}%`}
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Time to Post"
          value={responseTimeLabel}
          icon={Clock}
        />
        <StatCard
          title="Negative Reviews"
          value={data.negativeCount}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-elevated card-padding">
          <h3 className="text-sm font-semibold mb-1">Reviews Over Time</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly review volume</p>
          <ReviewsOverTimeChart data={data.reviewsOverTime} />
        </div>
        <div className="card-elevated card-padding">
          <h3 className="text-sm font-semibold mb-1">Rating Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Average rating over time
          </p>
          <RatingTrendChart data={data.ratingsOverTime} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <div className="card-elevated card-padding">
          <h3 className="text-sm font-semibold mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = data.reviewsByRating[rating] ?? 0;
              const pct =
                data.totalReviews > 0
                  ? Math.round((count / data.totalReviews) * 100)
                  : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-10">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
          {data.avgRating !== null && (
            <div className="mt-4 pt-3 border-t text-center">
              <p className="text-xs text-muted-foreground">Average Rating</p>
              <p className="text-xl font-bold">{data.avgRating.toFixed(1)}</p>
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card-elevated card-padding">
          <h3 className="text-sm font-semibold mb-4">Status Breakdown</h3>
          <StatusBreakdownChart data={data.reviewsByStatus} />
        </div>

        {/* Top Locations */}
        <div className="card-elevated card-padding">
          <h3 className="text-sm font-semibold mb-4">Top Locations</h3>
          {data.topLocations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No location data available
            </p>
          ) : (
            <div className="space-y-0">
              {data.topLocations.map((loc, i) => (
                <div
                  key={loc.name}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-4">
                      {i + 1}.
                    </span>
                    <span className="text-sm truncate">{loc.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {loc.count} reviews
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{loc.avgRating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
