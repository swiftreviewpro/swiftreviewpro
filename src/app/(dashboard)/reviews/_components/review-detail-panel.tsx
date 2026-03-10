"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  MapPin,
  Calendar,
  Globe,
  User,
  Trash2,
  Archive,
  AlertTriangle,
} from "lucide-react";
import type { Review, ReviewStatus } from "@/lib/types";
import { VALID_STATUS_TRANSITIONS } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { RatingStars } from "./rating-stars";
import { ReplyEditor } from "./reply-editor";
import { formatReviewDate, STATUS_CONFIG } from "../_lib/helpers";
import { toast } from "sonner";
import {
  updateReviewStatus,
  deleteReview,
} from "@/lib/actions/review-actions";

interface ReviewDetailPanelProps {
  review: Review | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function ReviewDetailPanel({
  review,
  open,
  onOpenChange,
  onUpdated,
}: ReviewDetailPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (!review) return;
      setError(null);
      startTransition(async () => {
        const result = await updateReviewStatus(
          review.id,
          newStatus as ReviewStatus
        );
        if (result.error) {
          setError(result.error);
        } else {
          toast.success("Status updated");
          onUpdated();
        }
      });
    },
    [review, onUpdated]
  );

  const handleDelete = useCallback(() => {
    if (!review) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(review.id);
      if (result.error) {
        setError(result.error);
      } else {
        toast.success("Review deleted");
        onOpenChange(false);
        onUpdated();
      }
    });
  }, [review, onOpenChange, onUpdated]);

  if (!review) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {review.reviewer_name.charAt(0).toUpperCase()}
            </div>
            {review.reviewer_name}
          </SheetTitle>
          <SheetDescription>
            Review from {review.platform} &middot;{" "}
            {formatReviewDate(review.review_date)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 py-2">
          {/* Rating + Status */}
          <div className="flex items-center justify-between">
            <RatingStars rating={review.rating} size="md" />
            <StatusBadge status={review.status} />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              {review.platform}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(review.review_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {review.location?.name ?? "Unknown"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {review.source === "csv_import" ? "CSV Import" : "Manual"}
            </div>
          </div>

          <Separator />

          {/* Full review text */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Review
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {review.review_text}
            </p>
          </div>

          {/* AI Reply Editor */}
          <ReplyEditor review={review} onUpdated={onUpdated} />

          <Separator />

          {/* Status change */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Change Status
            </h4>
            <Select
              value={review.status}
              onValueChange={(val) => {
                if (val) handleStatusChange(val);
              }}
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* Current status */}
                <SelectItem value={review.status}>
                  {STATUS_CONFIG[review.status].label} (current)
                </SelectItem>
                {/* Valid transitions from current status */}
                {VALID_STATUS_TRANSITIONS[review.status].map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {review.status !== "needs_attention" &&
              VALID_STATUS_TRANSITIONS[review.status].includes("needs_attention") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("needs_attention")}
                disabled={isPending}
              >
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                Flag
              </Button>
            )}
            {review.status !== "archived" &&
              VALID_STATUS_TRANSITIONS[review.status].includes("archived") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("archived")}
                disabled={isPending}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                Archive
              </Button>
            )}

          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <SheetFooter>
          {isPending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the review and all its reply
                  drafts. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
