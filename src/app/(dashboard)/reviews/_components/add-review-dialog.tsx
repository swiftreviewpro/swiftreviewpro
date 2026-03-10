"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createReview } from "@/lib/actions/review-actions";
import { PLATFORMS } from "../_lib/helpers";

interface AddReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: { id: string; name: string }[];
  onSuccess: () => void;
}

export function AddReviewDialog({
  open,
  onOpenChange,
  locations,
  onSuccess,
}: AddReviewDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});
  const [form, setForm] = useState({
    location_id: locations[0]?.id ?? "",
    reviewer_name: "",
    rating: 5,
    review_text: "",
    platform: "Google",
    review_date: new Date().toISOString().split("T")[0],
  });

  const reset = useCallback(() => {
    setForm({
      location_id: locations[0]?.id ?? "",
      reviewer_name: "",
      rating: 5,
      review_text: "",
      platform: "Google",
      review_date: new Date().toISOString().split("T")[0],
    });
    setError(null);
    setFieldErrors({});
  }, [locations]);

  const handleSubmit = useCallback(() => {
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createReview({
        ...form,
        review_date: form.review_date
          ? new Date(form.review_date).toISOString()
          : undefined,
        source: "manual",
      });

      if (result.error) {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(
            result.fieldErrors as Record<string, string[] | undefined>
          );
        }
        return;
      }

      reset();
      onOpenChange(false);
      toast.success("Review added successfully");
      onSuccess();
    });
  }, [form, reset, onOpenChange, onSuccess]);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
          <DialogDescription>
            Manually enter a customer review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location */}
          <div className="space-y-1.5">
            <Label>
              Location <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.location_id}
              onValueChange={(val) =>
                setForm((p) => ({ ...p, location_id: val ?? "" }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.location_id && (
              <p className="text-xs text-destructive">
                {fieldErrors.location_id[0]}
              </p>
            )}
          </div>

          {/* Reviewer name */}
          <div className="space-y-1.5">
            <Label htmlFor="reviewer_name">
              Reviewer Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reviewer_name"
              value={form.reviewer_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, reviewer_name: e.target.value }))
              }
              placeholder="John Smith"
            />
            {fieldErrors.reviewer_name && (
              <p className="text-xs text-destructive">
                {fieldErrors.reviewer_name[0]}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <Label>
              Rating <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, rating: n }))}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`Rate ${n} out of 5 stars`}
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      n <= form.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {form.rating}/5
              </span>
            </div>
          </div>

          {/* Platform & Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(val) =>
                  setForm((p) => ({ ...p, platform: val ?? "Google" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review_date">Review Date</Label>
              <Input
                id="review_date"
                type="date"
                value={form.review_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, review_date: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Review text */}
          <div className="space-y-1.5">
            <Label htmlFor="review_text">
              Review Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="review_text"
              value={form.review_text}
              onChange={(e) =>
                setForm((p) => ({ ...p, review_text: e.target.value }))
              }
              rows={4}
              placeholder="Paste or type the customer's review text…"
            />
            {fieldErrors.review_text && (
              <p className="text-xs text-destructive">
                {fieldErrors.review_text[0]}
              </p>
            )}
          </div>

          {/* Server error */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Add Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
