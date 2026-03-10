import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasCompletedOnboarding } from "@/lib/auth/helpers";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---------- Route classification ----------
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  const isOnboardingRoute = pathname.startsWith("/onboarding");

  const protectedPaths = [
    "/dashboard",
    "/reviews",
    "/analytics",
    "/locations",
    "/settings",
    "/billing",
    "/onboarding",
  ];
  const isProtectedRoute = protectedPaths.some((p) =>
    pathname.startsWith(p)
  );

  const isApiRoute = pathname.startsWith("/api");

  // ---------- Unauthenticated → redirect to login ----------
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ---------- Authenticated → redirect away from auth pages ----------
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ---------- Onboarding guard ----------
  // If user is authenticated and hitting a protected (non-onboarding) route,
  // check if they have an organization. If not, redirect to onboarding.
  if (user && isProtectedRoute && !isOnboardingRoute) {
    if (!(await hasCompletedOnboarding(supabase, user.id))) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  // If user already has an org but visits /onboarding, send to dashboard
  if (user && isOnboardingRoute) {
    if (await hasCompletedOnboarding(supabase, user.id)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Don't touch API routes
  if (isApiRoute) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
