"use client";

import type { Review } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { RatingStars } from "./rating-stars";
import { truncate, formatReviewDate } from "../_lib/helpers";
import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface ReviewsTableProps {
  reviews: Review[];
  onRowClick: (review: Review) => void;
}

export function ReviewsTable({ reviews, onRowClick }: ReviewsTableProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="card-elevated overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-[160px]">
              Reviewer
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-[90px]">
              Source
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-[100px]">
              Rating
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">
              Review
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-[90px]">
              Date
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-[130px]">
              Location
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider w-[130px]">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow
              key={review.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick(review)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(review);
                }
              }}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {review.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[120px]">
                    {review.reviewer_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {review.platform}
                </span>
              </TableCell>
              <TableCell>
                <RatingStars rating={review.rating} />
              </TableCell>
              <TableCell>
                <p className="text-sm text-muted-foreground leading-snug">
                  {truncate(review.review_text, 80)}
                </p>
                {review.reply_drafts && review.reply_drafts.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {review.reply_drafts.length} draft
                      {review.reply_drafts.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {formatReviewDate(review.review_date)}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "truncate max-w-[120px] text-xs",
                    review.location
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {review.location?.name ?? "—"}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={review.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
