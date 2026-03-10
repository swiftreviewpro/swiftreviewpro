import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // SENTRY_DSN (without NEXT_PUBLIC_ prefix) is server-only.
  // To enable client-side error reporting, set NEXT_PUBLIC_SENTRY_DSN.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust the trace sample rate in production as needed
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Setting this option to true will print useful information to the console while setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

export default Sentry;
