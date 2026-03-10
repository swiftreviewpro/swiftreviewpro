// ============================================================================
// OpenAI Client
// ============================================================================
// Canonical path: @/lib/ai/openai
// ============================================================================

import "server-only";

import OpenAI from "openai";

let _openai: OpenAI | null = null;

export default function getOpenAI(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to your environment variables."
      );
    }
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}
