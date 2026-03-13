// ============================================================================
// Yelp Fusion API — Review Fetching Service
// ============================================================================
// Uses the Yelp Fusion (v3) API to pull reviews for a business.
// Yelp's API returns up to 3 reviews per call (public excerpt only);
// for full review access, Yelp requires a partner agreement.
//
// Required env var:  YELP_API_KEY
//
// Credentials stored per-integration:
//   { business_id, business_name }
// ============================================================================

import "server-only";

import { encryptCredentials, decryptCredentials } from "./encryption";

export interface YelpReview {
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  external_id: string;
}

export interface YelpCredentials {
  business_id: string;
  business_name: string;
}

const YELP_API_BASE = "https://api.yelp.com/v3";

// ---------- Business search (for connecting) ----------

export interface YelpBusinessResult {
  id: string;
  name: string;
  location: { city: string; state: string };
  rating: number;
  review_count: number;
  url: string;
}

/**
 * Search Yelp for businesses matching a name + location query.
 * Used during integration setup so users can pick their business.
 */
export async function searchYelpBusinesses(
  term: string,
  location: string
): Promise<{ businesses: YelpBusinessResult[]; error: string | null }> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    return { businesses: [], error: "Yelp integration not configured (missing YELP_API_KEY)." };
  }

  const params = new URLSearchParams({
    term,
    location,
    limit: "5",
  });

  const res = await fetch(`${YELP_API_BASE}/businesses/search?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[Yelp] Business search failed:", res.status, body);
    return { businesses: [], error: `Yelp API error (${res.status}).` };
  }

  const data = await res.json();
  const businesses: YelpBusinessResult[] = (data.businesses ?? []).map(
    (b: Record<string, unknown>) => ({
      id: b.id as string,
      name: b.name as string,
      location: b.location as { city: string; state: string },
      rating: b.rating as number,
      review_count: b.review_count as number,
      url: b.url as string,
    })
  );

  return { businesses, error: null };
}

// ---------- Review fetching ----------

/**
 * Fetch reviews from Yelp Fusion API.
 *
 * Accepts encrypted credentials, decrypts internally.
 *
 * NOTE: The public Yelp Fusion API only returns up to 3 review excerpts.
 * Full review content requires a Yelp Knowledge / Content partner API key.
 * This service works with either — when full reviews are available, they
 * will come through the same endpoint with complete text.
 */
export async function fetchYelpReviews(
  encryptedCreds: string,
  locale = "en_US",
  sortBy = "newest"
): Promise<{ reviews: YelpReview[]; error: string | null }> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    return { reviews: [], error: "Yelp integration not configured." };
  }

  const creds = decryptCredentials<YelpCredentials>(encryptedCreds);
  if (!creds) {
    return { reviews: [], error: "Failed to decrypt Yelp credentials. Please reconnect." };
  }

  const params = new URLSearchParams({ locale, sort_by: sortBy });

  const res = await fetch(
    `${YELP_API_BASE}/businesses/${encodeURIComponent(creds.business_id)}/reviews?${params}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("[Yelp] Reviews fetch failed:", res.status, body);

    if (res.status === 401) {
      return {
        reviews: [],
        error: "Yelp API key is invalid. Please check YELP_API_KEY.",
      };
    }
    if (res.status === 404) {
      return {
        reviews: [],
        error: "Yelp business not found. It may have been removed.",
      };
    }

    return {
      reviews: [],
      error: `Yelp API error (${res.status}). Please try again later.`,
    };
  }

  const data = await res.json();
  const rawReviews = data.reviews ?? [];

  const reviews: YelpReview[] = rawReviews.map(
    (r: Record<string, unknown>) => {
      const user = r.user as Record<string, string> | undefined;
      return {
        reviewer_name: user?.name ?? "Yelp User",
        rating: (r.rating as number) ?? 3,
        review_text: (r.text as string) ?? "",
        review_date:
          (r.time_created as string) ?? new Date().toISOString(),
        external_id: (r.id as string) ?? "",
      };
    }
  );

  return { reviews, error: null };
}

// ---------- Business details (for label / validation) ----------

/**
 * Fetch basic info about a Yelp business (used to validate the connection).
 */
export async function getYelpBusiness(
  businessId: string
): Promise<{ name: string; error: string | null }> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) return { name: "", error: "Yelp integration not configured." };

  const res = await fetch(
    `${YELP_API_BASE}/businesses/${encodeURIComponent(businessId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!res.ok) {
    return { name: "", error: `Yelp business not found (${res.status}).` };
  }

  const data = await res.json();
  return { name: (data.name as string) ?? businessId, error: null };
}

/**
 * Encrypt Yelp business credentials for DB storage.
 */
export function encryptYelpCredentials(creds: YelpCredentials): string {
  return encryptCredentials(creds);
}
