// ============================================================================
// Site Configuration
// ============================================================================

export const siteConfig = {
  name: "SwiftReview Pro",
  shortName: "SwiftReview",
  description:
    "AI-powered review response management for local businesses. Respond to customer reviews quickly, professionally, and on-brand.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  creator: "SwiftReview Pro",
  keywords: [
    "reviews",
    "AI",
    "local business",
    "SaaS",
    "customer feedback",
    "review management",
    "reputation management",
  ],
  links: {
    docs: "/docs",
    support: "mailto:support@swiftreviewpro.com",
  },
} as const;

export type SiteConfig = typeof siteConfig;
