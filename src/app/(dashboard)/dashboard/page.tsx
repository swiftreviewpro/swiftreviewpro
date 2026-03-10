import { Suspense } from "react";
import type { Metadata } from "next";
import {
  MessageSquare,
  Clock,
  AlertTriangle,
  Send,
  FileText,
  Inbox,
  ArrowRight,
  Star,
  Activity,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SkeletonCard, LoadingSpinner } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  fetchPendingReviews,
} from "@/lib/actions/dashboard-actions";

export const metadata: Metadata = {
  title: "Dashboard | SwiftReview Pro",
  description: "Overview of your review management performance",
};

export default function DashboardPage() {
  return (
    <div className="section-gap">
      <PageHeader
        title="Dashboard"
        description="Overview of your review management performance"
        action={
          <Link href="/reviews">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              View All Reviews
            </Button>
          </Link>
        }
      />

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
      >
        <DashboardKPIs />
      </Suspense>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense
            fallback={
              <div className="card-elevated card-padding">
                <div className="skeleton h-4 w-1/4 mb-4" />
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex gap-3 py-3 border-b last:border-0">
                    <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-1/3" />
                      <div className="skeleton h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <PendingReviewsWidget />
          </Suspense>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card-elevated card-padding">
            <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/reviews" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Inbox className="mr-2 h-3.5 w-3.5" />
                  Review Inbox
                </Button>
              </Link>
              <Link href="/reviews?status=new" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Generate AI Replies
                </Button>
              </Link>
              <Link href="/reviews?status=draft_generated" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BadgeCheck className="mr-2 h-3.5 w-3.5" />
                  Approve Drafts
                </Button>
              </Link>
              <Link href="/analytics" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Activity className="mr-2 h-3.5 w-3.5" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="card-elevated card-padding">
                <div className="skeleton h-4 w-1/3 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="skeleton h-3 w-3 rounded-full shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="skeleton h-3 w-full" />
                        <div className="skeleton h-2.5 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <ActivityFeedWidget />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ---- KPI Cards (server component) ----

async function DashboardKPIs() {
  const { data } = await fetchDashboardStats();

  if (!data) {
    return (
      <div className="card-elevated card-padding text-center py-8">
        <p className="text-muted-foreground text-sm">Unable to load dashboard stats.</p>
      </div>
    );
  }

  const responseTimeLabel = data.avgResponseHours !== null
    ? data.avgResponseHours < 1
      ? `${Math.round(data.avgResponseHours * 60)}m`
      : `${Math.round(data.avgResponseHours)}h`
    : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Total Reviews"
        value={data.totalReviews}
        icon={MessageSquare}
      />
      <StatCard
        title="Pending Response"
        value={data.pendingResponse}
        icon={Inbox}
      />
      <StatCard
        title="Drafts Ready"
        value={data.draftsReady}
        icon={FileText}
      />
      <StatCard
        title="Posted"
        value={data.posted}
        icon={Send}
      />
      <StatCard
        title="Negative Attention"
        value={data.negativeAttention}
        icon={AlertTriangle}
      />
      <StatCard
        title="Avg Response"
        value={responseTimeLabel}
        icon={Clock}
      />
    </div>
  );
}

// ---- Pending Reviews Widget ----

async function PendingReviewsWidget() {
  const { data: reviews, error } = await fetchPendingReviews();

  if (error || !reviews) {
    return (
      <div className="card-elevated card-padding text-center py-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 mx-auto mb-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t load pending reviews</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {error ?? "Please try refreshing the page."}
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated card-padding">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Pending Reviews</h3>
        <Link href="/reviews?status=new">
          <Button variant="ghost" size="sm" className="text-xs">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 mb-3">
            <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            No reviews waiting for a response
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {reviews.map((review) => (
            <div key={review.id} className="flex items-start gap-3 py-3 border-b last:border-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                {review.reviewer_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium truncate">{review.reviewer_name}</p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {review.review_text}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {review.platform}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {review.location?.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Activity Feed Widget ----

const ACTION_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  "review.created": { label: "New review added", icon: MessageSquare },
  "review.imported": { label: "Reviews imported", icon: Inbox },
  "review.status_changed": { label: "Status changed", icon: Activity },
  "reply.generated": { label: "AI reply generated", icon: Sparkles },
  "reply.edited": { label: "Draft edited", icon: FileText },
  "reply.approved": { label: "Reply approved", icon: BadgeCheck },
  "reply.posted": { label: "Reply posted", icon: Send },
};

async function ActivityFeedWidget() {
  const { data: activities, error } = await fetchRecentActivity();

  if (error || !activities) {
    return (
      <div className="card-elevated card-padding text-center py-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 mx-auto mb-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium">Couldn&apos;t load activity</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {error ?? "Please try refreshing the page."}
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated card-padding">
      <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Activity will appear here as you manage reviews
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 8).map((activity) => {
            const config = ACTION_LABELS[activity.action] ?? {
              label: activity.action,
              icon: Activity,
            };
            const Icon = config.icon;
            const timeAgo = getRelativeTime(activity.created_at);

            return (
              <div key={activity.id} className="flex items-start gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                  <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug">
                    {config.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {activity.user?.full_name ?? activity.user?.email ?? "System"} · {timeAgo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
