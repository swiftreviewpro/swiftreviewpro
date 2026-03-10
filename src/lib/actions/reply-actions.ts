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
import type { ReplyDraft, BrandSettings, Organization, ReviewStatus } from "@/lib/types";
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

  // 5. Build prompt context
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
  };

  // 6. Generate via AI
  const result = await generateReply(promptCtx);

  if (result.error || !result.content) {
    return { error: result.error ?? "Generation failed." };
  }

  // 7. Determine version number
  const { count: draftCount } = await ctx.supabase
    .from("reply_drafts")
    .select("id", { count: "exact", head: true })
    .eq("review_id", reviewId);

  const version = (draftCount ?? 0) + 1;

  // 8. Insert draft
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

  // 9. Update review status → draft_generated
  await ctx.supabase
    .from("reviews")
    .update({ status: "draft_generated" })
    .eq("id", reviewId)
    .eq("organization_id", ctx.orgId);

  // 10. Log activity
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
