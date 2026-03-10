"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, MemberRole } from "@/lib/types";

interface UseOrganizationReturn {
  organization: Organization | null;
  role: MemberRole | null;
  loading: boolean;
}

/**
 * Client-side hook to get the current user's organization and their role.
 * Fetches directly from Supabase via RLS-protected queries.
 */
export function useOrganization(): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<MemberRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get the user's membership (RLS ensures they can only see their own)
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id, role")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (!membership) return;

        setRole(membership.role as MemberRole);

        // Fetch the organization (RLS: member can read)
        const { data: org } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", membership.organization_id)
          .single();

        if (org) {
          setOrganization(org as Organization);
        }
      } catch {
        // Silently fail — organization may not exist yet (onboarding)
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, []);

  return { organization, role, loading };
}
