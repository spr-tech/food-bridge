// The donor's listings, newest first (spec S6), with its states: skeleton rows while
// loading; the error with Try again; an empty start that points to Share food; a 401
// goes to sign in.
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { formatUpdated } from '@/lib/format'
import { YourListingRow } from '@/sections/your-listings/YourListingRow'
import { errorStatus } from '@/services/errors'
import { useMyListings } from '@/services/listings'

export function YourListings() {
  const listings = useMyListings()
  const navigate = useNavigate()
  const sessionEnded = useSessionEnded()
  const now = useNow()

  useEffect(() => {
    if (errorStatus(listings.error) === 401) void sessionEnded()
  }, [listings.error, sessionEnded])

  if (listings.isLoading) {
    return (
      <LoadingState label="Loading your listings">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </LoadingState>
    )
  }

  if (listings.isError) {
    return (
      <ErrorState
        title="We couldn't load your listings."
        description="Check your connection and try again."
        onRetry={() => void listings.refetch()}
        retrying={listings.isFetching}
      />
    )
  }

  // Newest first, whatever order the service sends them in.
  const items = [...(listings.data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  if (items.length === 0) {
    return (
      <EmptyState
        title="You haven't listed any food yet."
        description="Share your surplus food and nearby community groups can request it."
        action={{ label: 'List surplus food', onClick: () => void navigate(ROUTES.createListing) }}
      />
    )
  }

  return (
    <>
      {listings.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">{formatUpdated(listings.fulfilledTimeStamp, now)}</p>
      )}
      <ul className="grid gap-3">
        {items.map((listing) => (
          <li key={listing.id}>
            <YourListingRow listing={listing} />
          </li>
        ))}
      </ul>
    </>
  )
}