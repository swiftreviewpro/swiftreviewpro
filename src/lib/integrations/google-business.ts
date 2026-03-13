// ============================================================================
// Google Business Profile — Review Fetching Service
// ============================================================================
// Uses the Google My Business API v4 / Google Business Profile API to
// pull reviews for a specific location (Google Place / Account).
//
// Required env vars:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//
// Credentials stored per-integration:
//   { access_token, refresh_token, account_id, location_id }
// ============================================================================

import "server-only";

export interface GoogleReview {
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  external_id: string;
}

export interface GoogleCredentials {
  access_token: string;
  refresh_token: string;
  account_id: string;
  location_id: string;
}

// ---------- OAuth helpers ----------

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Refresh an expired Google OAuth2 access token using the stored refresh token.
 */
export async function refreshGoogleToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[Google] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return null;
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    console.error("[Google] Token refresh failed:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

// ---------- Review fetching ----------

const GBP_API_BASE = "https://mybusiness.googleapis.com/v4";

/**
 * Fetch reviews from Google Business Profile API.
 * Returns normalized review objects ready for DB insertion.
 *
 * @param creds - Stored Google credentials for this integration
 * @param pageToken - For pagination; pass null for first page
 */
export async function fetchGoogleReviews(
  creds: GoogleCredentials,
  pageToken?: string | null
): Promise<{
  reviews: GoogleReview[];
  nextPageToken: string | null;
  error: string | null;
}> {
  let { access_token } = creds;

  // Try refreshing the token first (they expire after 1 hour)
  const refreshed = await refreshGoogleToken(creds.refresh_token);
  if (refreshed) {
    access_token = refreshed.access_token;
  }

  const url = new URL(
    `${GBP_API_BASE}/accounts/${creds.account_id}/locations/${creds.location_id}/reviews`
  );
  url.searchParams.set("pageSize", "50");
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[Google] Reviews fetch failed:", res.status, body);

    if (res.status === 401 || res.status === 403) {
      return {
        reviews: [],
        nextPageToken: null,
        error: "Google authorization expired. Please reconnect your Google Business account.",
      };
    }

    return {
      reviews: [],
      nextPageToken: null,
      error: `Google API error (${res.status}). Please try again later.`,
    };
  }

  const data = await res.json();
  const rawReviews = data.reviews ?? [];

  const reviews: GoogleReview[] = rawReviews.map(
    (r: Record<string, unknown>) => {
      const comment = (r.comment as string) ?? "";
      const starRating = mapGoogleStarRating(r.starRating as string);
      const reviewer = r.reviewer as Record<string, string> | undefined;

      return {
        reviewer_name: reviewer?.displayName ?? "Google User",
        rating: starRating,
        review_text: comment,
        review_date:
          (r.createTime as string) ?? new Date().toISOString(),
        external_id: (r.reviewId as string) ?? (r.name as string) ?? "",
      };
    }
  );

  return {
    reviews,
    nextPageToken: (data.nextPageToken as string) ?? null,
    error: null,
  };
}

/**
 * Fetch ALL pages of reviews (up to a safety limit).
 */
export async function fetchAllGoogleReviews(
  creds: GoogleCredentials,
  maxPages = 10
): Promise<{ reviews: GoogleReview[]; error: string | null }> {
  const allReviews: GoogleReview[] = [];
  let nextPageToken: string | null = null;
  let pages = 0;

  do {
    const result = await fetchGoogleReviews(creds, nextPageToken);
    if (result.error) return { reviews: allReviews, error: result.error };

    allReviews.push(...result.reviews);
    nextPageToken = result.nextPageToken;
    pages++;
  } while (nextPageToken && pages < maxPages);

  return { reviews: allReviews, error: null };
}

/**
 * Build the Google OAuth2 authorization URL for connecting an account.
 */
export function getGoogleAuthUrl(state: string): string | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://swiftreviewpro.vercel.app"}/api/integrations/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeGoogleCode(
  code: string
): Promise<{
  access_token: string;
  refresh_token: string;
  error: string | null;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://swiftreviewpro.vercel.app"}/api/integrations/google/callback`;

  if (!clientId || !clientSecret) {
    return { access_token: "", refresh_token: "", error: "Google OAuth not configured." };
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[Google] Code exchange failed:", res.status, body);
    return { access_token: "", refresh_token: "", error: "Failed to connect Google account." };
  }

  const data = await res.json();
  return {
    access_token: data.access_token ?? "",
    refresh_token: data.refresh_token ?? "",
    error: null,
  };
}

// ---------- Helpers ----------

/**
 * Maps Google's string star rating enum to a 1–5 integer.
 */
function mapGoogleStarRating(rating: string | undefined): number {
  switch (rating) {
    case "FIVE":
      return 5;
    case "FOUR":
      return 4;
    case "THREE":
      return 3;
    case "TWO":
      return 2;
    case "ONE":
      return 1;
    default:
      return 3;
  }
}
