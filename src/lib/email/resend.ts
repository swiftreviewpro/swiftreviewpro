import "server-only";

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set — email sending will be disabled.");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send a transactional email via Resend.
 * Returns `{ success: true, id }` on success, or `{ success: false, error }`.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = "SwiftReview Pro <noreply@swiftreviewpro.com>",
  replyTo,
}: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Skipping email — RESEND_API_KEY is not configured.");
    return { success: false as const, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await getResend().emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false as const, error: error.message };
    }

    return { success: true as const, id: data?.id };
  } catch (err) {
    console.error("Failed to send email:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
