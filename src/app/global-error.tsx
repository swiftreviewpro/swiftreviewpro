"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#fafafa",
            color: "#111",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(239, 68, 68)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#666",
              margin: "0 0 24px",
              maxWidth: 360,
            }}
          >
            An unexpected error occurred. Please try again, or contact support
            if the problem persists.
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: 12,
                color: "#999",
                margin: "0 0 16px",
                fontFamily: "monospace",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
              border: "1px solid #e5e5e5",
              backgroundColor: "#fff",
              color: "#111",
              cursor: "pointer",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f5f5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#fff")
            }
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
