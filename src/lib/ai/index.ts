// ============================================================================
// AI Module — Barrel export
// ============================================================================

export { default as openai } from "./openai";
export { buildSystemPrompt, buildUserPrompt, type PromptContext, type PromptType } from "./prompts";
export { generateReply, type GenerationResult } from "./generate";
