// ============================================================================
// Auth Callback — Handles Supabase Auth code exchange
// ============================================================================
// This route is called after email confirmation (signup, magic link, password
// reset) AND after OAuth sign-in (Google). It exchanges the auth code for a
// session, then redirects based on onboarding status.
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/lib/auth/helpers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has an organization — if not, redirect to onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const onboarded = await hasCompletedOnboarding(supabase, user.id);

        if (!onboarded) {
          // New user (email or Google) — send to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // Returning user — send to dashboard (or the `next` param)
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
