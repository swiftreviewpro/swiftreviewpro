import { PageHeader } from "@/components/layout/page-header";
import { ReviewsPageActions } from "./_components/reviews-page-actions";
import { ReviewsInbox } from "./_components/reviews-inbox";

export const metadata = {
  title: "Reviews | SwiftReview Pro",
  description: "Manage and respond to customer reviews",
};

/**
 * Reviews inbox — /reviews
 * Lists reviews with filters, search, pagination, and management dialogs.
 */
export default function ReviewsPage() {
  return (
    <div className="section-gap">
      <PageHeader
        title="Reviews"
        description="Manage and respond to customer reviews"
        action={<ReviewsPageActions />}
      />
      <ReviewsInbox />
    </div>
  );
}
