import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust the trace sample rate in production as needed
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Setting this option to true will print useful information to the console while setting up Sentry.
  debug: false,
});
