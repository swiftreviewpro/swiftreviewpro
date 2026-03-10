import { SkeletonCard } from "@/components/shared/loading";

export default function LocationsLoading() {
  return (
    <div className="section-gap">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-2">
          <div className="skeleton h-7 w-28" />
          <div className="skeleton h-4 w-44" />
        </div>
        <div className="skeleton h-9 w-32 rounded-md" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonCard key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
