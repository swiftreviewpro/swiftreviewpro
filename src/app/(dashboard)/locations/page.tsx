import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { LocationsClient } from "./_components/locations-client";

export const metadata: Metadata = {
  title: "Locations | SwiftReview Pro",
  description: "Manage business locations",
};

/**
 * Locations page — /locations
 * Server component fetches locations, client component handles CRUD.
 */
export default async function LocationsPage() {
  const { data: locations, error } = await fetchAllLocations();

  return (
    <div className="section-gap">
      <PageHeader
        title="Locations"
        description="Manage your business locations"
      />

      {error ? (
        <div className="card-elevated card-padding text-center py-8">
          <p className="text-muted-foreground text-sm">
            {error}
          </p>
        </div>
      ) : (
        <LocationsClient initialLocations={locations} />
      )}
    </div>
  );
}
