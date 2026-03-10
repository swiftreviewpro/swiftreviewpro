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
const TEMPERATURE = 0.7;

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
    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
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

    // Surface rate-limit and quota errors clearly
    if (err instanceof Error) {
      if (err.message.includes("rate_limit") || err.message.includes("429")) {
        return {
          content: null,
          error: "Rate limit reached. Please wait a moment and try again.",
          model: MODEL,
        };
      }
      if (
        err.message.includes("insufficient_quota") ||
        err.message.includes("billing")
      ) {
        return {
          content: null,
          error:
            "AI quota exceeded. Please check your OpenAI billing configuration.",
          model: MODEL,
        };
      }
    }

    return {
      content: null,
      error: "Failed to generate reply. Please try again later.",
      model: MODEL,
    };
  }
}
