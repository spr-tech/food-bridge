// /requests: every listing of the donor's that has requests waiting, each with its
// requests panel (Approve and Decline), reusing the listing details panel (spec S5).
// TEMPORARY layout for the Monday checkpoint: grouped by listing, without S8's tabs.
import { Link } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { listingDetailPath } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { RequestsPanel } from '@/sections/listing-details/RequestsPanel'
import { useMyListings } from '@/services/listings'

const TITLE = 'Requests'

export function RequestsPage() {
  useDocumentTitle(TITLE)
  const listings = useMyListings()

  // Only listings with requests waiting, newest first.
  const waiting = [...(listings.data ?? [])]
    .filter((listing) => listing.pendingRequestCount > 0)
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
    body = (
      <div className="flex flex-col gap-10">
        {waiting.map((listing) => (
          <section key={listing.id} aria-labelledby={`listing-${listing.id}`}>
            <h2 id={`listing-${listing.id}`} className="mb-2 font-display text-2xl">
              <Link to={listingDetailPath(listing.id)} className="text-primary underline underline-offset-4">
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
      <PageHeader title={TITLE} description="Requests waiting for your decision, grouped by listing." />
      {body}
    </PageContainer>
  )
}