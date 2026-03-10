import { SkeletonCard } from "@/components/shared/loading";

export default function DashboardLoading() {
  return (
    <div className="section-gap">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-2">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-9 w-36 rounded-md" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-elevated card-padding">
            <div className="skeleton h-5 w-32 mb-4" />
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
        </div>
        <div className="space-y-6">
          <SkeletonCard className="h-52" />
          <SkeletonCard className="h-40" />
        </div>
      </div>
    </div>
  );
}
