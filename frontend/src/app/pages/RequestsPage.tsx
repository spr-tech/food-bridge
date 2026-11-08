// /requests: every listing of the donor's that has requests waiting, each with its
// requests panel (Approve and Decline), reusing the listing details panel (spec S5).
// TEMPORARY layout for the Monday checkpoint: grouped by listing, without S8's tabs.
import { Link } from 'react-router'
import { ListChecks, ShoppingBasket } from 'lucide-react'
import { LoadingState } from '@/components/ui/loading-state/LoadingState'
import { PageContainer } from '@/components/layouts/PageContainer'
import { PageHeader } from '@/components/layouts/PageHeader'
import { SummaryStrip } from '@/components/ui/summary-strip/SummaryStrip'
import { EmptyState } from '@/components/ui/empty-state/empty-state'
import { ErrorState } from '@/components/ui/error-state/error-state'
import { Skeleton } from '@/components/ui/skeleton/skeleton'
import { listingDetailPath } from '@/utilities/constants/routes'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { RequestsPanel } from '@/components/content/listings/listing-details/RequestsPanel'
import { useMyListings } from '@/services/listings'

const TITLE = 'Requests'

export function RequestsPage() {
  useDocumentTitle(TITLE)
  const listings = useMyListings()

  // Only Available listings with requests waiting, newest first. Once a request is approved
  // the service still counts the listing's other requests as pending (it doesn't decline
  // them); they show as Declined, so the listing has nothing left to decide.
  const waiting = [...(listings.data ?? [])]
    .filter((listing) => listing.status === 'AVAILABLE' && listing.pendingRequestCount > 0)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  let body
  if (listings.isLoading) {
    body = (
      <LoadingState label="Loading requests">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </LoadingState>
    )
  } else if (listings.isError) {
    body = (
      <ErrorState
        title="We couldn't load requests."
        description="Check your connection and try again."
        onRetry={() => void listings.refetch()}
        retrying={listings.isFetching}
      />
    )
  } else if (waiting.length === 0) {
    body = (
      <EmptyState
        title="No requests yet."
        description="When recipients request your food, they'll appear here."
      />
    )
  } else {
    const requestsWaiting = waiting.reduce((sum, listing) => sum + listing.pendingRequestCount, 0)
    body = (
      <div className="flex flex-col gap-6">
        <SummaryStrip
          label="Requests at a glance"
          figures={[
            {
              label: 'Listings with requests',
              value: waiting.length,
              hint: 'Available listings with requests to decide',
              icon: <ShoppingBasket size={18} />,
            },
            {
              label: 'Requests waiting',
              value: requestsWaiting,
              hint: 'Waiting for your decision',
              icon: <ListChecks size={18} />,
            },
          ]}
        />
        {waiting.map((listing) => (
          <section
            key={listing.id}
            aria-labelledby={`listing-${listing.id}`}
            // One container per listing, so its requests read as a group apart from the next listing.
            className="rounded-3xl border border-border bg-surface p-4 shadow-card md:p-6"
          >
            <h2 id={`listing-${listing.id}`} className="mb-2 font-display text-2xl wrap-break-word">
              <Link
                to={listingDetailPath(listing.id)}
                className="text-text underline decoration-border underline-offset-4 hover:text-primary hover:decoration-primary"
              >
                {listing.foodName}
              </Link>
            </h2>
            <RequestsPanel listing={listing} />
          </section>
        ))}
      </div>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Donor · Requests"
        title={TITLE}
        description="Requests waiting for your decision, grouped by listing."
      />
      {body}
    </PageContainer>
  )
}

// ---------------------------------------------------------------------------
// Explanation
// - Each listing's group is its own card (the dashboard's rounded, softly shadowed style),
//   so one listing's requests are easy to tell apart from the next. The groups stack
//   vertically across the full width, under a summary of what's waiting.
// - The request cards inside keep their own white cards, so there is a container around
//   each listing and a card around each request.
