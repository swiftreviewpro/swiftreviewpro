import { SkeletonCard } from "@/components/shared/loading";

export default function AnalyticsLoading() {
  return (
    <div className="section-gap">
      <div className="space-y-2 mb-8">
        <div className="skeleton h-7 w-28" />
        <div className="skeleton h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}
