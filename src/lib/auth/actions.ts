// ============================================================================
// Auth Actions — Server-side Supabase Auth operations
// ============================================================================
// These are server actions called from login, signup, and logout forms.
// They use the Supabase server client to interact with Supabase Auth,
// then redirect the user appropriately.
// ============================================================================

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema, signInSchema } from "@/lib/validation/schemas";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------
export interface AuthActionState {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
}

// --------------------------------------------------------------------------
// Sign Up
// --------------------------------------------------------------------------
export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate
  const result = signUpSchema.safeParse(raw);
  if (!result.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();

  // V10: Rate-limit sign-up attempts by email (no userId available yet)
  const rl = await checkRateLimit(
    RATE_LIMITS.authAttempt,
    `signup:${result.data.email}`,
    `signup:${result.data.email}`
  );
  if (!rl.success) {
    return { error: rl.error ?? "Too many sign-up attempts. Please wait and try again." };
  }

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.full_name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // After signup, the trigger creates a public.users row automatically.
  // Redirect to onboarding to create their organization.
  redirect("/onboarding");
}

// --------------------------------------------------------------------------
// Sign In
// --------------------------------------------------------------------------
export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate
  const result = signInSchema.safeParse(raw);
  if (!result.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();

  // V10: Rate-limit sign-in attempts by email
  const rl = await checkRateLimit(
    RATE_LIMITS.authAttempt,
    `signin:${result.data.email}`,
    `signin:${result.data.email}`
  );
  if (!rl.success) {
    return { error: rl.error ?? "Too many login attempts. Please wait and try again." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Middleware will handle onboarding redirect if no org exists
  redirect("/dashboard");
}

// --------------------------------------------------------------------------
// Sign In with Google (OAuth)
// --------------------------------------------------------------------------
export async function signInWithGoogle(): Promise<AuthActionState> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to initialize Google sign-in" };
}

// --------------------------------------------------------------------------
// Sign Out
// --------------------------------------------------------------------------
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
