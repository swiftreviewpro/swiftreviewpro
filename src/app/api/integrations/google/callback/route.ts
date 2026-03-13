// ============================================================================
// Google Business OAuth Callback
// ============================================================================
// Exchanges the authorization code from Google for access + refresh tokens,
// then stores the integration record and redirects to /integrations.
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeGoogleCode, buildEncryptedGoogleCreds } from "@/lib/integrations/google-business";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state"); // JSON: { locationId, orgId }
  const errorParam = searchParams.get("error");

  const redirectBase = `${origin}/integrations`;

  // Google denied or user cancelled
  if (errorParam) {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent("Google authorization was cancelled.")}`
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent("Missing authorization code.")}`
    );
  }

  // Parse state
  let state: { locationId: string; orgId: string };
  try {
    state = JSON.parse(stateParam);
  } catch {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent("Invalid state parameter.")}`
    );
  }

  // Verify user is authenticated and belongs to the org
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", state.orgId)
    .single();

  if (!membership) {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent("You don't have access to this organization.")}`
    );
  }

  // Exchange code for tokens
  const tokenResult = await exchangeGoogleCode(code);
  if (tokenResult.error || !tokenResult.access_token) {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent(tokenResult.error ?? "Failed to exchange authorization code.")}`
    );
  }

  // Temporarily hold raw tokens in memory for the account/location lookup.
  // They will be encrypted before reaching the database.
  const rawAccessToken = tokenResult.access_token;
  const rawRefreshToken = tokenResult.refresh_token;

  // Fetch the account and location from the Google Business Profile API
  // We'll get the list of accounts first, then the locations
  let accountId = "";
  let googleLocationId = "";
  let locationName = "Google Business Profile";

  try {
    // Fetch accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${rawAccessToken}` },
      }
    );
    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts ?? [];

    if (accounts.length > 0) {
      accountId = accounts[0].name; // e.g. "accounts/12345"

      // Fetch locations for first account
      const locationsRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title`,
        {
          headers: { Authorization: `Bearer ${rawAccessToken}` },
        }
      );
      const locationsData = await locationsRes.json();
      const locations = locationsData.locations ?? [];

      if (locations.length > 0) {
        googleLocationId = locations[0].name; // e.g. "accounts/12345/locations/67890"
        locationName = locations[0].title ?? locationName;
      }
    }
  } catch (err) {
    console.error("[google-callback] Failed to fetch account/locations:", err);
    // Continue with empty values — user can reconfigure later
  }

  if (!accountId) {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent("No Google Business accounts found. Please ensure your Google account has a Business Profile.")}`
    );
  }

  // Encrypt credentials before storing — raw tokens never reach the database
  const encryptedCreds = buildEncryptedGoogleCreds({
    access_token: rawAccessToken,
    refresh_token: rawRefreshToken,
    account_id: accountId,
    location_id: googleLocationId,
  });

  // Check for existing integration
  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("organization_id", state.orgId)
    .eq("provider", "google_business")
    .eq("location_id", state.locationId)
    .maybeSingle();

  if (existing) {
    // Update existing integration with re-encrypted tokens
    await supabase
      .from("integrations")
      .update({
        credentials: encryptedCreds,
        status: "active",
        label: locationName,
      })
      .eq("id", existing.id);

    return NextResponse.redirect(
      `${redirectBase}?success=${encodeURIComponent("Google Business reconnected successfully!")}`
    );
  }

  // Create new integration
  const { error: insertErr } = await supabase
    .from("integrations")
    .insert({
      organization_id: state.orgId,
      provider: "google_business",
      label: locationName,
      credentials: encryptedCreds,
      location_id: state.locationId,
      status: "active",
      auto_import: false,
    });

  if (insertErr) {
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent("Failed to save integration: " + insertErr.message)}`
    );
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    organization_id: state.orgId,
    user_id: user.id,
    action: "integration.connected",
    entity_type: "integration",
    metadata: { provider: "google_business", account_id: accountId },
  });

  return NextResponse.redirect(
    `${redirectBase}?success=${encodeURIComponent("Google Business connected successfully! You can now sync reviews.")}`
  );
}
