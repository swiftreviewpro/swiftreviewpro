import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = {
  title: "Get Started | SwiftReview Pro",
  description: "Set up your business profile, brand voice, and first location.",
};

/**
 * Server-side guard: if the user already has an organization, redirect
 * straight to the dashboard so they can't re-run onboarding.
 */
export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard");
  }

  return <OnboardingWizard />;
}
