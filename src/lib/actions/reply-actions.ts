// ============================================================================
// Reply Draft — Server Actions
// ============================================================================
// Generate, save, approve, and mark-posted workflows for AI reply drafts.
// All actions are org-scoped, logged, and update review status.
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateReply } from "@/lib/ai/generate";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { checkReplyEntitlement } from "@/lib/entitlements";
import type { PromptContext } from "@/lib/ai/prompts";
import type { ReplyDraft, BrandSettings, Organization, ReviewStatus, PlanTier } from "@/lib/types";
import { isValidStatusTransition } from "@/lib/types";

// ---- Auth helper (shared with review-actions) ----

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  return { supabase, userId: user.id, orgId: membership.organization_id };
}

// ---- Result types ----

export interface DraftActionResult {
  error: string | null;
  data?: ReplyDraft | null;
}

export interface ReplyUsageResult {
  current: number;
  limit: number;
  plan: PlanTier;
  allowed: boolean;
}

// ============================================================================
// Get Reply Usage (for UI upgrade prompts)
// ============================================================================

export async function getReplyUsage(): Promise<ReplyUsageResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { current: 0, limit: 3, plan: "free", allowed: false };

  const result = await checkReplyEntitlement(ctx.supabase, ctx.orgId);
  return {
    current: result.current,
    limit: result.limit,
    plan: result.plan,
    allowed: result.allowed,
  };
}

// ============================================================================
// Generate Reply
// ============================================================================

export async function generateReplyDraft(
  reviewId: string
): Promise<DraftActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  // Rate limit: per-user burst + per-org daily cap
  const rl = await checkRateLimit(RATE_LIMITS.aiGeneration, ctx.userId, ctx.orgId);
  if (!rl.success) {
    return { error: rl.error ?? "Rate limit exceeded. Please try again later." };
  }

  // 1. Fetch review with location
  const { data: review, error: reviewErr } = await ctx.supabase
    .from("reviews")
    .select("*, location:locations(id, name)")
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId)
    .single();

  if (reviewErr || !review) {
    return { error: "Review not found." };
  }

  // 1b. Validate status transition → draft_generated
  if (!isValidStatusTransition(review.status as ReviewStatus, "draft_generated")) {
    return { error: `Cannot generate a draft for a review in "${review.status}" status.` };
  }

  // 2. Fetch brand settings
  const { data: brand } = await ctx.supabase
    .from("brand_settings")
    .select("*")
    .eq("organization_id", ctx.orgId)
    .single();

  // 3. Fetch organization
  const { data: org } = await ctx.supabase
    .from("organizations")
    .select("name, category")
    .eq("id", ctx.orgId)
    .single();

  // 4. Check reply entitlement (centralized limit)
  const entitlement = await checkReplyEntitlement(ctx.supabase, ctx.orgId);
  if (!entitlement.allowed) {
    return { error: entitlement.error! };
  }

  // 5. Fetch previous drafts so the AI can avoid repeating itself
  const { data: existingDrafts } = await ctx.supabase
    .from("reply_drafts")
    .select("content")
    .eq("review_id", reviewId)
    .eq("organization_id", ctx.orgId)
    .order("version", { ascending: false })
    .limit(3);

  const previousDrafts = (existingDrafts ?? [])
    .map((d) => d.content)
    .filter(Boolean) as string[];
  const attemptNumber = previousDrafts.length + 1;

  // 6. Build prompt context
  const promptCtx: PromptContext = {
    review: {
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      review_text: review.review_text,
      platform: review.platform,
      location_name: review.location?.name ?? null,
    },
    brand: brand as BrandSettings | null,
    org: org as Pick<Organization, "name" | "category"> | null,
    previousDrafts: previousDrafts.length > 0 ? previousDrafts : undefined,
    attemptNumber,
  };

  // 7. Generate via AI
  const result = await generateReply(promptCtx);

  if (result.error || !result.content) {
    return { error: result.error ?? "Generation failed." };
  }

  // 8. Determine version number
  const { count: draftCount } = await ctx.supabase
    .from("reply_drafts")
    .select("id", { count: "exact", head: true })
    .eq("review_id", reviewId);

  const version = (draftCount ?? 0) + 1;

  // 9. Insert draft
  const { data: draft, error: draftErr } = await ctx.supabase
    .from("reply_drafts")
    .insert({
      review_id: reviewId,
      organization_id: ctx.orgId,
      content: result.content,
      version,
    })
    .select()
    .single();

  if (draftErr) {
    return { error: draftErr.message };
  }

  // 10. Update review status → draft_generated
  await ctx.supabase
    .from("reviews")
    .update({ status: "draft_generated" })
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId);

  // 11. Log activity
  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "reply.generated",
    entity_type: "reply_draft",
    entity_id: draft.id,
    metadata: {
      review_id: reviewId,
      version,
      model: result.model,
      usage: result.usage ?? null,
    },
  });

  revalidatePath("/reviews");
  return { error: null, data: draft as ReplyDraft };
}

// ============================================================================
// Save Draft (edit content)
// ============================================================================

export async function saveDraft(
  draftId: string,
  content: string
): Promise<DraftActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  if (!content.trim()) {
    return { error: "Reply content cannot be empty." };
  }

  const { data: draft, error } = await ctx.supabase
    .from("reply_drafts")
    .update({ content: content.trim() })
    .eq("id", draftId)
    .eq("organization_id", ctx.orgId)
    .select()
    .single();

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "reply.edited",
    entity_type: "reply_draft",
    entity_id: draftId,
  });

  revalidatePath("/reviews");
  return { error: null, data: draft as ReplyDraft };
}

// ============================================================================
// Approve Draft
// ============================================================================

export async function approveDraft(
  draftId: string
): Promise<DraftActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  // Fetch draft to get review_id, then check review status
  const { data: existingDraft } = await ctx.supabase
    .from("reply_drafts")
    .select("review_id")
    .eq("id", draftId)
    .eq("organization_id", ctx.orgId)
    .single();

  if (!existingDraft) return { error: "Draft not found." };

  const { data: review } = await ctx.supabase
    .from("reviews")
    .select("status")
    .eq("id", existingDraft.review_id)
    .eq("organization_id", ctx.orgId)
    .single();

  if (review && !isValidStatusTransition(review.status as ReviewStatus, "approved")) {
    return { error: `Cannot approve a draft for a review in "${review.status}" status.` };
  }

  const { data: draft, error } = await ctx.supabase
    .from("reply_drafts")
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: ctx.userId,
    })
    .eq("id", draftId)
    .eq("organization_id", ctx.orgId)
    .select()
    .single();

  if (error) return { error: error.message };

  // Update review status → approved
  await ctx.supabase
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", draft.review_id)
    .eq("organization_id", ctx.orgId);

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "reply.approved",
    entity_type: "reply_draft",
    entity_id: draftId,
    metadata: { review_id: draft.review_id },
  });

  revalidatePath("/reviews");
  return { error: null, data: draft as ReplyDraft };
}

// ============================================================================
// Mark as Posted
// ============================================================================

export async function markDraftPosted(
  reviewId: string
): Promise<DraftActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in." };

  // Validate transition → posted
  const { data: currentReview } = await ctx.supabase
    .from("reviews")
    .select("status")
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId)
    .single();

  if (!currentReview) return { error: "Review not found." };

  if (!isValidStatusTransition(currentReview.status as ReviewStatus, "posted")) {
    return { error: `Cannot mark as posted — review is in "${currentReview.status}" status.` };
  }

  // Find latest approved draft
  const { data: draft } = await ctx.supabase
    .from("reply_drafts")
    .select("*")
    .eq("review_id", reviewId)
    .eq("organization_id", ctx.orgId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (draft) {
    await ctx.supabase
      .from("reply_drafts")
      .update({ posted_at: new Date().toISOString() })
      .eq("id", draft.id)
      .eq("organization_id", ctx.orgId);
  }

  // Update review status → posted
  const { error } = await ctx.supabase
    .from("reviews")
    .update({ status: "posted" })
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId);

  if (error) return { error: error.message };

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "reply.posted",
    entity_type: "review",
    entity_id: reviewId,
    metadata: { draft_id: draft?.id ?? null },
  });

  revalidatePath("/reviews");
  return { error: null, data: draft ? (draft as ReplyDraft) : null };
}

// ============================================================================
// Auto-Post Reply to Google Business (paid-only)
// ============================================================================
// Yelp does not support posting replies via API — only Google Business.
// This is called when users click "Post to Google" on an approved draft.
// ============================================================================

export interface AutoPostResult {
  error: string | null;
  posted: boolean;
  platform: string | null;
}

export async function autoPostReply(reviewId: string): Promise<AutoPostResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "You must be logged in.", posted: false, platform: null };

  // 1. Check paid plan
  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("plan_tier")
    .eq("organization_id", ctx.orgId)
    .single();

  const tier = (sub?.plan_tier ?? "free") as PlanTier;
  if (tier !== "pro") {
    return { error: "Auto-posting to Google is available on the Pro plan. Please upgrade.", posted: false, platform: null };
  }

  // 2. Fetch the review with its approved draft
  const { data: review } = await ctx.supabase
    .from("reviews")
    .select("*, reply_drafts(*)")
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId)
    .single();

  if (!review) return { error: "Review not found.", posted: false, platform: null };

  // Must be approved or draft_generated
  if (!isValidStatusTransition(review.status as ReviewStatus, "posted")) {
    return { error: `Cannot post — review is in "${review.status}" status.`, posted: false, platform: null };
  }

  // Get the latest approved draft
  const approvedDraft = (review.reply_drafts ?? [])
    .filter((d: ReplyDraft) => d.is_approved)
    .sort((a: ReplyDraft, b: ReplyDraft) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!approvedDraft) {
    return { error: "No approved draft found. Please approve a draft first.", posted: false, platform: null };
  }

  // 3. Check if this review came from Google and has an external_id
  const source = review.source as string;
  if (source !== "google_business" || !review.external_id) {
    return { error: "Auto-post is only available for Google Business reviews with a linked integration.", posted: false, platform: null };
  }

  // 4. Find the active Google integration for this location
  const { data: integration } = await ctx.supabase
    .from("integrations")
    .select("id, credentials, status")
    .eq("organization_id", ctx.orgId)
    .eq("provider", "google_business")
    .eq("location_id", review.location_id)
    .eq("status", "active")
    .single();

  if (!integration) {
    return { error: "No active Google Business integration found for this location.", posted: false, platform: null };
  }

  // 5. Post the reply via Google API
  const { postGoogleReviewReply } = await import("@/lib/integrations/google-business");
  const result = await postGoogleReviewReply(
    integration.credentials,
    review.external_id,
    approvedDraft.content
  );

  if (result.updatedEncryptedCreds) {
    await ctx.supabase
      .from("integrations")
      .update({ credentials: result.updatedEncryptedCreds })
      .eq("id", integration.id);
  }

  if (!result.success) {
    return { error: result.error ?? "Failed to post reply to Google.", posted: false, platform: "google" };
  }

  // 6. Mark draft as posted and update review status
  await ctx.supabase
    .from("reply_drafts")
    .update({ posted_at: new Date().toISOString() })
    .eq("id", approvedDraft.id);

  await ctx.supabase
    .from("reviews")
    .update({ status: "posted" })
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId);

  await ctx.supabase.from("activity_logs").insert({
    organization_id: ctx.orgId,
    user_id: ctx.userId,
    action: "reply.auto_posted",
    entity_type: "review",
    entity_id: reviewId,
    metadata: { platform: "google_business", draft_id: approvedDraft.id },
  });

  revalidatePath("/reviews");
  revalidatePath("/integrations");
  return { error: null, posted: true, platform: "google" };
}
