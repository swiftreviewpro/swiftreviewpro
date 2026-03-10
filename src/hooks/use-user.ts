"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

/**
 * Client-side hook to get the current authenticated user.
 * Fetches the profile from public.users and listens for auth state changes.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setUser(data as User);
      }
    },
    [supabase]
  );

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        fetchProfile(data.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (login/logout/token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  return { user, loading };
}
