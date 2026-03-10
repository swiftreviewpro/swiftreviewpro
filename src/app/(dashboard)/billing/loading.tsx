import { SkeletonCard } from "@/components/shared/loading";

export default function BillingLoading() {
  return (
    <div className="section-gap">
      <div className="space-y-2 mb-8">
        <div className="skeleton h-7 w-20" />
        <div className="skeleton h-4 w-64" />
      </div>

      {/* Current plan skeleton */}
      <SkeletonCard className="h-44" />

      {/* Plan cards skeleton */}
      <div className="space-y-4">
        <div className="skeleton h-6 w-36" />
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonCard key={i} className="h-80" />
          ))}
        </div>
      </div>
    </div>
  );
}
