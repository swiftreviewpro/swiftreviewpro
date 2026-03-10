// ============================================================================
// Auth Helpers — Server-side authentication & authorization utilities
// ============================================================================
// Canonical path: @/lib/auth/helpers
// These helpers are used in API routes and server components to get the
// current user, their organization, and enforce auth requirements.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Organization, User, MemberRole } from "@/lib/types";

// --------------------------------------------------------------------------
// Get the current authenticated user's profile from public.users
// --------------------------------------------------------------------------
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return data;
}

// --------------------------------------------------------------------------
// Get the current user's organization (first membership)
// --------------------------------------------------------------------------
export async function getUserOrganization(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .single();

  return org;
}

// --------------------------------------------------------------------------
// Require authenticated user — throws if not logged in
// --------------------------------------------------------------------------
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// --------------------------------------------------------------------------
// Require organization membership — throws if no user or no org
// Returns user, organizationId, and role for authorization checks
// --------------------------------------------------------------------------
export async function requireOrganization(): Promise<{
  user: { id: string; email?: string };
  organizationId: string;
  role: MemberRole;
}> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    throw new Error("No organization found");
  }

  return {
    user,
    organizationId: membership.organization_id as string,
    role: membership.role as MemberRole,
  };
}

// --------------------------------------------------------------------------
// Require admin or owner role — throws if user isn't an admin
// --------------------------------------------------------------------------
export async function requireAdmin(): Promise<{
  user: { id: string; email?: string };
  organizationId: string;
  role: MemberRole;
}> {
  const context = await requireOrganization();
  if (context.role !== "owner" && context.role !== "admin") {
    throw new Error("Forbidden — admin access required");
  }
  return context;
}

// --------------------------------------------------------------------------
// Utility: create a URL-safe slug from text
// --------------------------------------------------------------------------
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

// --------------------------------------------------------------------------
// Check if a user has completed onboarding.
// Requires: org membership + brand_settings + at least 1 location.
// Accepts any Supabase client so it works from middleware, server
// actions, API routes, etc.
// --------------------------------------------------------------------------
export async function hasCompletedOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  // 1. Must have an org membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) return false;

  const orgId = membership.organization_id;

  // 2. Must have brand_settings and at least 1 location (parallel)
  const [brandResult, locationResult] = await Promise.all([
    supabase
      .from("brand_settings")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("locations")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle(),
  ]);

  return !!brandResult.data && !!locationResult.data;
}
