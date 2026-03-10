import { SkeletonCard } from "@/components/shared/loading";

export default function ReviewsLoading() {
  return (
    <div className="section-gap">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-2">
          <div className="skeleton h-7 w-24" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-9 w-28 rounded-md" />
          <div className="skeleton h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-md" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card-elevated">
        <div className="p-4 border-b">
          <div className="skeleton h-9 w-64 rounded-md" />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <div className="skeleton h-4 w-4 rounded" />
            <div className="skeleton h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-3 w-48" />
            </div>
            <div className="skeleton h-5 w-16 rounded-full" />
            <div className="skeleton h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
