"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  RefreshCw,
  Save,
  CheckCircle2,
  Send,
  Loader2,
  Pencil,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Review, ReplyDraft, ReviewStatus } from "@/lib/types";
import {
  generateReplyDraft,
  saveDraft,
  approveDraft,
  markDraftPosted,
} from "@/lib/actions/reply-actions";

interface ReplyEditorProps {
  review: Review;
  onUpdated: () => void;
}

export function ReplyEditor({ review, onUpdated }: ReplyEditorProps) {
  // Find the latest draft by version
  const latestDraft = review.reply_drafts
    ?.slice()
    .sort((a, b) => b.version - a.version)[0] ?? null;

  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isApproving, startApproving] = useTransition();
  const [isPosting, startPosting] = useTransition();

  const [draft, setDraft] = useState<ReplyDraft | null>(latestDraft);
  const [editContent, setEditContent] = useState(latestDraft?.content ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync when review prop changes (e.g. after refresh)
  useEffect(() => {
    const newDraft =
      review.reply_drafts?.slice().sort((a, b) => b.version - a.version)[0] ??
      null;
    setDraft(newDraft);
    setEditContent(newDraft?.content ?? "");
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, [review]);

  const isPending = isGenerating || isSaving || isApproving || isPosting;
  const hasDraft = !!draft;
  const isApproved = draft?.is_approved ?? false;
  const isPosted = !!draft?.posted_at;

  // ---- Generate / Regenerate ----
  const handleGenerate = useCallback(() => {
    startGenerating(async () => {
      const result = await generateReplyDraft(review.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setDraft(result.data);
        setEditContent(result.data.content);
        setIsEditing(false);
        setHasUnsavedChanges(false);
        toast.success(
          hasDraft ? "New draft generated" : "Reply draft generated"
        );
        onUpdated();
      }
    });
  }, [review.id, hasDraft, onUpdated]);

  // ---- Save edited content ----
  const handleSave = useCallback(() => {
    if (!draft) return;
    startSaving(async () => {
      const result = await saveDraft(draft.id, editContent);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setDraft(result.data);
        setHasUnsavedChanges(false);
        setIsEditing(false);
        toast.success("Draft saved");
        onUpdated();
      }
    });
  }, [draft, editContent, onUpdated]);

  // ---- Approve ----
  const handleApprove = useCallback(() => {
    if (!draft) return;
    // Save first if there are unsaved changes
    startApproving(async () => {
      if (hasUnsavedChanges) {
        const saveResult = await saveDraft(draft.id, editContent);
        if (saveResult.error) {
          toast.error(saveResult.error);
          return;
        }
      }
      const result = await approveDraft(draft.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setDraft(result.data);
        setIsEditing(false);
        setHasUnsavedChanges(false);
        toast.success("Reply approved");
        onUpdated();
      }
    });
  }, [draft, editContent, hasUnsavedChanges, onUpdated]);

  // ---- Mark as Posted ----
  const handleMarkPosted = useCallback(() => {
    startPosting(async () => {
      const result = await markDraftPosted(review.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Marked as posted");
      onUpdated();
    });
  }, [review.id, onUpdated]);

  // ---- Copy to clipboard ----
  const handleCopy = useCallback(() => {
    const text = editContent || draft?.content || "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [editContent, draft]);

  // ---- Content change ----
  const handleContentChange = useCallback(
    (value: string) => {
      setEditContent(value);
      setHasUnsavedChanges(value !== draft?.content);
    },
    [draft]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Reply
        </h4>
        {hasDraft && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            v{draft.version}
          </Badge>
        )}
        {isApproved && !isPosted && (
          <Badge variant="secondary" className="text-[10px]">
            Approved
          </Badge>
        )}
        {isPosted && (
          <Badge variant="default" className="text-[10px]">
            Posted
          </Badge>
        )}
      </div>

      {/* No draft yet — generate CTA */}
      {!hasDraft && !isGenerating && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center">
          <Sparkles className="h-6 w-6 text-primary/60" />
          <div>
            <p className="text-sm font-medium">No reply draft yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate an AI-powered response based on your brand settings
            </p>
          </div>
          <Button size="sm" onClick={handleGenerate} disabled={isPending}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Generate Reply
          </Button>
        </div>
      )}

      {/* Generation loading state */}
      {isGenerating && (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-6 text-center">
          <div className="relative">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <Loader2 className="h-3 w-3 text-primary animate-spin" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Generating reply…</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crafting a {review.rating >= 4 ? "warm" : review.rating <= 2 ? "empathetic" : "balanced"},{" "}
              on-brand response
            </p>
          </div>
        </div>
      )}

      {/* Draft content */}
      {hasDraft && !isGenerating && (
        <>
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={6}
              className="text-sm leading-relaxed resize-y"
              placeholder="Edit your reply…"
              disabled={isPending}
            />
          ) : (
            <div
              className="rounded-lg border bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                if (!isPosted) setIsEditing(true);
              }}
              role={isPosted ? undefined : "button"}
              tabIndex={isPosted ? undefined : 0}
              onKeyDown={(e) => {
                if (!isPosted && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setIsEditing(true);
                }
              }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {draft.content}
              </p>
              {!isPosted && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  Click to edit
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Regenerate */}
            {!isPosted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isPending}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Regenerate
              </Button>
            )}

            {/* Save (when editing) */}
            {isEditing && hasUnsavedChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isPending}
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save
              </Button>
            )}

            {/* Cancel editing */}
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditContent(draft.content);
                  setHasUnsavedChanges(false);
                  setIsEditing(false);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}

            {/* Copy */}
            {hasDraft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={isPending}
              >
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Approve */}
            {!isApproved && !isPosted && (
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isPending}
              >
                {isApproving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Approve
              </Button>
            )}

            {/* Mark as Posted */}
            {isApproved && !isPosted && (
              <Button
                size="sm"
                onClick={handleMarkPosted}
                disabled={isPending}
              >
                {isPosting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Mark Posted
              </Button>
            )}
          </div>

          {/* Status hint */}
          {hasUnsavedChanges && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              You have unsaved changes
            </p>
          )}
        </>
      )}
    </div>
  );
}
