// ============================================================================
// Auth Callback — Handles Supabase Auth code exchange
// ============================================================================
// This route is called after email confirmation (signup, magic link, password
// reset). It exchanges the auth code for a session, then redirects.
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
        if (!(await hasCompletedOnboarding(supabase, user.id))) {
          return NextResponse.redirect(
            `${origin}/confirm?next=${encodeURIComponent("/onboarding")}`
          );
        }
      }

      // Confirmed + onboarded — send through confirmation page then to dashboard
      return NextResponse.redirect(
        `${origin}/confirm?next=${encodeURIComponent(next)}`
      );
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
