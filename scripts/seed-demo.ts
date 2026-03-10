// ============================================================================
// scripts/seed-demo.ts — Create demo auth user & seed all demo data
// ============================================================================
// Usage:
//   npx tsx scripts/seed-demo.ts
//
// Requires environment variables:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// This script:
//   1. Creates (or finds) a demo user in Supabase Auth
//   2. Calls the seed_demo_data() RPC to populate all tables
//   3. Prints the demo credentials
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const DEMO_EMAIL = "demo@swiftreview.pro";
const DEMO_PASSWORD = "demo1234";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🚀 Setting up SwiftReview Pro demo mode...\n");

  // ---- Step 1: Create or find demo auth user ----
  console.log("1. Creating demo auth user...");

  // Check if demo user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingDemo = existingUsers?.users?.find(
    (u) => u.email === DEMO_EMAIL
  );

  let demoUserId: string;

  if (existingDemo) {
    console.log(`   ✓ Demo user already exists (${existingDemo.id})`);
    demoUserId = existingDemo.id;

    // Update password in case it changed
    await supabase.auth.admin.updateUserById(demoUserId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Alex Demo",
      },
    });

    if (error) {
      console.error("   ❌ Failed to create demo user:", error.message);
      process.exit(1);
    }

    demoUserId = newUser.user.id;
    console.log(`   ✓ Created demo user (${demoUserId})`);
  }

  // ---- Step 2: Seed demo data via RPC ----
  console.log("2. Seeding demo data...");

  const { error: seedError } = await supabase.rpc("seed_demo_data", {
    p_demo_user_id: demoUserId,
  });

  if (seedError) {
    console.error("   ❌ Failed to seed demo data:", seedError.message);
    process.exit(1);
  }

  console.log("   ✓ Demo organization, reviews, drafts, and activity seeded");

  // ---- Step 3: Verify ----
  console.log("3. Verifying...");

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", "d3m00000-0000-0000-0000-000000000001");

  const { count: draftCount } = await supabase
    .from("reply_drafts")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", "d3m00000-0000-0000-0000-000000000001");

  const { count: activityCount } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", "d3m00000-0000-0000-0000-000000000001");

  console.log(`   ✓ ${reviewCount} reviews`);
  console.log(`   ✓ ${draftCount} reply drafts`);
  console.log(`   ✓ ${activityCount} activity log entries`);

  // ---- Done ----
  console.log("\n✅ Demo mode is ready!\n");
  console.log("┌─────────────────────────────────────────┐");
  console.log("│  Demo Credentials                       │");
  console.log("│                                         │");
  console.log(`│  Email:    ${DEMO_EMAIL}     │`);
  console.log(`│  Password: ${DEMO_PASSWORD}                  │`);
  console.log("│                                         │");
  console.log("│  Or use the \"Try Demo\" button on the    │");
  console.log("│  login page (NEXT_PUBLIC_DEMO_MODE=true) │");
  console.log("└─────────────────────────────────────────┘");
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
