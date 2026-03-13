// ============================================================================
// AI Generation Service — Server-only reply generation
// ============================================================================
// Wraps OpenAI calls behind a clean interface with error handling and
// fallback behaviour. All API keys stay server-side.
// ============================================================================

import getOpenAI from "./openai";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import type { PromptContext } from "./prompts";

export interface GenerationResult {
  content: string | null;
  error: string | null;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
  /** Warnings about potential issues in the generated content */
  warnings?: string[];
}

const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 500;
/** Base temperature — bumped higher on regeneration attempts for more variety */
const BASE_TEMPERATURE = 0.85;
const REGEN_TEMPERATURE = 0.95;

// ---------- V14: Output validation ----------

/** Patterns that should never appear in a review reply */
const SUSPICIOUS_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(refund|reimburse|compensat(e|ion)|settlement)\b/i, label: "financial-commitment" },
  { pattern: /\b(lawsuit|attorney|legal action|sue|court)\b/i, label: "legal-language" },
  { pattern: /\b(admit fault|our mistake|we are liable|accept liability)\b/i, label: "liability-admission" },
  { pattern: /https?:\/\/\S+/i, label: "url-in-output" },
  { pattern: /<script|<iframe|javascript:/i, label: "xss-attempt" },
  { pattern: /\b(as an ai|i am a language model|openai|gpt)\b/i, label: "ai-self-reference" },
];

/**
 * Validates generated reply content and returns a list of warnings.
 * Also checks against brand-specific banned phrases.
 */
function validateGeneratedReply(
  content: string,
  bannedPhrases?: string[] | null
): string[] {
  const warnings: string[] = [];

  for (const { pattern, label } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(label);
    }
  }

  if (bannedPhrases && bannedPhrases.length > 0) {
    const lower = content.toLowerCase();
    for (const phrase of bannedPhrases) {
      if (lower.includes(phrase.toLowerCase())) {
        warnings.push(`banned-phrase: ${phrase}`);
      }
    }
  }

  return warnings;
}

/**
 * Generate a review reply using the OpenAI Chat Completions API.
 * Returns a clean result object — never throws.
 */
export async function generateReply(
  ctx: PromptContext
): Promise<GenerationResult> {
  const systemPrompt = buildSystemPrompt(ctx);
  const userPrompt = buildUserPrompt(ctx);

  try {
    // Use higher temperature + random seed on regeneration attempts
    const isRegen = (ctx.attemptNumber ?? 1) > 1;
    const temperature = isRegen ? REGEN_TEMPERATURE : BASE_TEMPERATURE;

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: MAX_TOKENS,
      temperature,
      // Random seed ensures the model takes a different sampling path each time
      seed: Math.floor(Math.random() * 2_147_483_647),
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? null;

    if (!content) {
      return {
        content: null,
        error: "The AI returned an empty response. Please try again.",
        model: MODEL,
      };
    }

    // V14: Validate output before returning
    const warnings = validateGeneratedReply(
      content,
      ctx.brand?.banned_phrases
    );

    return {
      content,
      error: null,
      model: MODEL,
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
          }
        : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (err: unknown) {
    console.error("[AI] Reply generation failed:", err);

    // Use OpenAI SDK structured fields when available, fall back to message
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status?: number }).status
        : undefined;
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : undefined;
    const msg = err instanceof Error ? err.message : String(err);

    // 1. Quota / billing errors — check FIRST because OpenAI returns
    //    HTTP 429 for both rate-limit AND quota-exceeded, so a naive
    //    "429" string check would mis-classify quota errors.
    const isQuota =
      status === 402 ||
      code === "insufficient_quota" ||
      msg.includes("insufficient_quota") ||
      msg.includes("billing") ||
      msg.includes("exceeded your current quota");
    if (isQuota) {
      return {
        content: null,
        error:
          "OpenAI quota exceeded. Please check that your OpenAI account has billing enabled and available credits.",
        model: MODEL,
      };
    }

    // 2. Authentication errors
    const isAuth = status === 401 || code === "invalid_api_key";
    if (isAuth) {
      return {
        content: null,
        error:
          "OpenAI API key is invalid or expired. Please update OPENAI_API_KEY in your environment variables.",
        model: MODEL,
      };
    }

    // 3. True rate-limit (RPM / TPM)
    const isRateLimit =
      status === 429 ||
      code === "rate_limit_exceeded" ||
      msg.includes("rate_limit");
    if (isRateLimit) {
      return {
        content: null,
        error: "Rate limit reached. Please wait a moment and try again.",
        model: MODEL,
      };
    }

    return {
      content: null,
      error: "Failed to generate reply. Please try again later.",
      model: MODEL,
    };
  }
}
