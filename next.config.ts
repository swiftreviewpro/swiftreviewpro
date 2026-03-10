import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ---- Allowed origins for server actions (CSRF protection) ----
// Prevents external domains from invoking server actions via form POST.
// In production, only the deployment domain is allowed.
// In local dev, localhost:3000 is used as the default.
function getAllowedOrigins(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const origin = new URL(appUrl).origin; // e.g. "https://app.swiftreviewpro.com"
    const origins = [origin];

    // Allow additional origins if configured (comma-separated)
    const extra = process.env.ALLOWED_ORIGINS;
    if (extra) {
      for (const raw of extra.split(",")) {
        const trimmed = raw.trim();
        if (trimmed) origins.push(trimmed);
      }
    }

    return origins;
  } catch {
    return ["http://localhost:3000"];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    // Lock server actions to only accept requests from our own origin(s).
    // This blocks cross-site form POST attacks (CSRF) in production.
    serverActions: {
      allowedOrigins: getAllowedOrigins(),
    },
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
