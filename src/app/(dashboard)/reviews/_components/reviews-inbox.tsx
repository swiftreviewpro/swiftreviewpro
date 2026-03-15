"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table";
import type { Review } from "@/lib/types";
import {
  fetchReviews,
  fetchLocations,
} from "@/lib/actions/review-actions";
import type { FetchReviewsParams } from "@/lib/actions/review-actions";
import { ReviewFilters } from "./review-filters";
import { ReviewsTable } from "./reviews-table";
import { ReviewsPagination } from "./reviews-pagination";
import { AddReviewDialog } from "./add-review-dialog";
import { CsvImportDialog } from "./csv-import-dialog";
import { ReviewDetailPanel } from "./review-detail-panel";

const VALID_STATUS_PARAMS = ["all", "new", "draft_generated", "posted", "positive", "negative"];

export function ReviewsInbox() {
  const searchParams = useSearchParams();

  // Hydrate initial status filter from URL ?status= param
  const initialStatus = useMemo(() => {
    const param = searchParams.get("status");
    return param && VALID_STATUS_PARAMS.includes(param) ? param : "all";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- State ----
  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>(
    []
  );
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [perPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [status, setStatus] = useState(initialStatus);
  const [locationId, setLocationId] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ---- Debounce search ----
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ---- Compute filter params ----
  const filterParams = useMemo((): FetchReviewsParams => {
    const params: FetchReviewsParams = {
      page,
      perPage,
    };

    // Map filter tabs to actual query params
    if (status === "positive") {
      params.ratingFilter = "positive";
    } else if (status === "negative") {
      params.ratingFilter = "negative";
    } else if (status !== "all") {
      params.status = status;
    }

    if (locationId !== "all") {
      params.locationId = locationId;
    }

    if (searchDebounced) {
      params.search = searchDebounced;
    }

    return params;
  }, [status, locationId, searchDebounced, page, perPage]);

  // ---- Load data ----
  const loadReviews = useCallback(() => {
    startTransition(async () => {
      const result = await fetchReviews(filterParams);
      if (!result.error) {
        setReviews(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } else {
        toast.error(result.error ?? "Failed to load reviews");
      }
      setLoading(false);
    });
  }, [filterParams]);

  const loadLocations = useCallback(async () => {
    const result = await fetchLocations();
    if (!result.error) {
      setLocations(result.data);
    } else {
      toast.error("Failed to load locations");
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Reload on filter changes
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Listen for header button events
  useEffect(() => {
    const handleOpenAdd = () => setAddOpen(true);
    const handleOpenCsv = () => setCsvOpen(true);
    window.addEventListener("reviews:open-add-review", handleOpenAdd);
    window.addEventListener("reviews:open-csv-import", handleOpenCsv);
    return () => {
      window.removeEventListener("reviews:open-add-review", handleOpenAdd);
      window.removeEventListener("reviews:open-csv-import", handleOpenCsv);
    };
  }, []);

  // ---- Handlers ----
  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setLocationId(value);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRowClick = useCallback((review: Review) => {
    setSelectedReview(review);
    setDetailOpen(true);
  }, []);

  const handleReviewUpdated = useCallback(() => {
    loadReviews();
  }, [loadReviews]);

  // When detail panel closes, if the review was changed, refresh it
  const handleDetailOpenChange = useCallback(
    (open: boolean) => {
      setDetailOpen(open);
      if (!open) {
        // Find updated version in reviews list
        if (selectedReview) {
          const updated = reviews.find((r) => r.id === selectedReview.id);
          setSelectedReview(updated ?? null);
        }
      }
    },
    [selectedReview, reviews]
  );

  const isFiltered = status !== "all" || locationId !== "all" || searchDebounced;
  const showSkeleton = loading && reviews.length === 0;
  const showEmpty = !loading && reviews.length === 0;
  const showTable = reviews.length > 0;

  return (
    <>
      {/* Filters */}
      <ReviewFilters
        status={status}
        locationId={locationId}
        search={search}
        locations={locations}
        onStatusChange={handleStatusChange}
        onLocationChange={handleLocationChange}
        onSearchChange={handleSearchChange}
      />

      {/* Loading skeleton */}
      {showSkeleton && <DataTableSkeleton columns={7} rows={8} />}

      {/* Empty state */}
      {showEmpty && !isFiltered && (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="Import your first batch of reviews or add one manually to get started."
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCsvOpen(true)}
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Import CSV
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Review
              </Button>
            </div>
          }
        />
      )}

      {showEmpty && isFiltered && (
        <EmptyState
          icon={MessageSquare}
          title="No matching reviews"
          description="Try adjusting your filters or search terms."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("all");
                setLocationId("all");
                setSearch("");
              }}
            >
              Clear Filters
            </Button>
          }
        />
      )}

      {/* Table */}
      {showTable && (
        <>
          <ReviewsTable reviews={reviews} onRowClick={handleRowClick} />
          <ReviewsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Loading indicator for transitions */}
      {isPending && !showSkeleton && (
        <div className="flex justify-center py-2">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddReviewDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        locations={locations}
        onSuccess={handleReviewUpdated}
      />
      <CsvImportDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        locations={locations}
        onSuccess={handleReviewUpdated}
      />
      <ReviewDetailPanel
        review={selectedReview}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        onUpdated={handleReviewUpdated}
      />
    </>
  );
}
