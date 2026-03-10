import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { fetchBrandSettings } from "@/lib/actions/brand-settings-actions";
import { getUserOrganization } from "@/lib/auth/helpers";
import { SettingsClient } from "./_components/settings-client";

export const metadata: Metadata = {
  title: "Settings | SwiftReview Pro",
  description: "Brand voice and preferences",
};

/**
 * Settings page — /settings
 * Server component fetches brand settings + org, client handles forms.
 */
export default async function SettingsPage() {
  const [brandResult, org] = await Promise.all([
    fetchBrandSettings(),
    getUserOrganization(),
  ]);

  return (
    <div className="section-gap">
      <PageHeader
        title="Settings"
        description="Manage your organization and brand voice configuration"
      />

      <SettingsClient
        brandSettings={brandResult.data}
        organization={org}
      />
    </div>
  );
}
