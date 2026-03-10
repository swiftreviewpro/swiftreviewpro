// ============================================================================
// POST /api/demo/login — Sign in as the demo user
// ============================================================================
// Protected by NEXT_PUBLIC_DEMO_MODE env var. Returns 404 if demo mode
// is disabled. Creates a Supabase session via signInWithPassword.
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

export async function POST() {
  // V9: Double-guard — never allow demo login in production even if
  // NEXT_PUBLIC_DEMO_MODE is accidentally set.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Demo login is disabled in production" },
      { status: 403 }
    );
  }

  if (!IS_DEMO_MODE) {
    return NextResponse.json(
      { error: "Demo mode is not enabled" },
      { status: 404 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (error) {
    return NextResponse.json(
      { error: "Demo login failed. Has the demo been seeded? Run: npx tsx scripts/seed-demo.ts" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, redirect: "/dashboard" });
}
