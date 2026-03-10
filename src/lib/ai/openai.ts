// ============================================================================
// OpenAI Client
// ============================================================================
// Canonical path: @/lib/ai/openai
// ============================================================================

import "server-only";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
