import { Suspense } from "react";
import type { Metadata } from "next";
import { Plug } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonCard } from "@/components/shared/loading";
import { createClient } from "@/lib/supabase/server";
import { fetchLocations } from "@/lib/actions/review-actions";
import { listIntegrations } from "@/lib/actions/integration-actions";
import type { PlanTier } from "@/lib/types";
import { IntegrationsClient } from "./_components/integrations-client";

export const metadata: Metadata = {
  title: "Integrations | SwiftReview Pro",
  description: "Connect Google Business and Yelp to import reviews",
};

export default function IntegrationsPage() {
  return (
    <div className="section-gap">
      <PageHeader
        title="Integrations"
        description="Connect review platforms to import reviews automatically"
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <SkeletonCard key={i} className="h-48" />
            ))}
          </div>
        }
      >
        <IntegrationsContent />
      </Suspense>
    </div>
  );
}

async function IntegrationsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="card-elevated card-padding text-center py-12">
        <p className="text-muted-foreground text-sm">
          Please sign in to manage integrations.
        </p>
      </div>
    );
  }

  // Get org membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return (
      <div className="card-elevated card-padding text-center py-12">
        <p className="text-muted-foreground text-sm">
          No organization found. Please complete onboarding first.
        </p>
      </div>
    );
  }

  const orgId = membership.organization_id;

  // Check plan
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_tier")
    .eq("organization_id", orgId)
    .single();

  const plan = (sub?.plan_tier ?? "free") as PlanTier;
  const isPaid = plan !== "free";

  // Fetch data in parallel
  const [integrationsResult, locationsResult] = await Promise.all([
    isPaid ? listIntegrations() : Promise.resolve({ error: null, data: [] }),
    fetchLocations(),
  ]);

  return (
    <IntegrationsClient
      initialIntegrations={integrationsResult.data ?? []}
      locations={locationsResult.data ?? []}
      orgId={orgId}
      isPaid={isPaid}
    />
  );
}
