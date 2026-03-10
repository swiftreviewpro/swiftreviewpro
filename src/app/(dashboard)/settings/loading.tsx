import { SkeletonCard } from "@/components/shared/loading";

export default function SettingsLoading() {
  return (
    <div className="section-gap">
      <div className="space-y-2 mb-8">
        <div className="skeleton h-7 w-24" />
        <div className="skeleton h-4 w-52" />
      </div>

      <SkeletonCard className="h-96" />
    </div>
  );
}
