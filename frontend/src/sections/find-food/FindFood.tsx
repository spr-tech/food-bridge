// Find food (spec S3), as in 3b-find-food-sidebar-light and m3: search and the Category,
// Pickup area and Status filters (in the page address), the result count (announced),
// when the list was updated, the card grid and "Load more" (12 at a time).
// States: six skeleton cards while loading; "No food listed yet." on an empty start;
// "No listings match your filters" with Clear filters; the error with Try again.
import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/app/session'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { FilterBar } from '@/components/ui/filter-bar'
import { FormField } from '@/components/ui/form-field'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORIES, PICKUP_AREAS } from '@/constants/listingOptions'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { formatUpdated } from '@/lib/format'
import { ListingCard } from '@/sections/find-food/ListingCard'
import { DEFAULT_STATUS, useListingFilters } from '@/sections/find-food/useListingFilters'
import { errorStatus } from '@/services/errors'
import { useListings } from '@/services/listings'
import { useMyRequests } from '@/services/requests'
import type { ListingRequest } from '@/types/api'

const PAGE_SIZE = 12
const SEARCH_DELAY_MS = 300

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'collected', label: 'Collected' },
  { value: 'expired', label: 'Expired' },
]

function countMessage(total: number, availableOnly: boolean): string {
  const noun = total === 1 ? 'listing' : 'listings'
  return availableOnly ? `${total} ${noun} available` : `${total} ${noun}`
}

// Re-renders every 30 seconds, so "Updated 2 minutes ago" stays true.
function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

export function FindFood() {
  const filters = useListingFilters()
  const { update, clearAll } = filters
  const role = useSession()?.role
  const sessionEnded = useSessionEnded()
  const now = useNow()

  // The search box updates the address once typing pauses.
  const [query, setQuery] = useState(filters.q)
  useEffect(() => {
    const timer = window.setTimeout(() => update({ q: query.trim() || undefined }), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [query, update])

  // "Load more" grows the page; a new search or filter starts again at 12.
  const filterKey = JSON.stringify(filters.query)
  const [page, setPage] = useState({ key: filterKey, limit: PAGE_SIZE })
  const limit = page.key === filterKey ? page.limit : PAGE_SIZE

  const listings = useListings({ ...filters.query, limit })
  const myRequests = useMyRequests({ skip: role !== 'recipient' })
  const canRequest = role === 'recipient'

  // This recipient's request on each listing; a cancelled one doesn't count.
  const mine = new Map<string, ListingRequest>()
  for (const request of myRequests.data ?? []) {
    if (request.status !== 'CANCELLED') mine.set(request.listingId, request)
  }

  // After "Load more", focus moves to the first new card's View listing link.
  const cardLinks = useRef<(HTMLAnchorElement | null)[]>([])
  const focusFrom = useRef<number | null>(null)
  const items = listings.data?.items ?? []
  useEffect(() => {
    if (focusFrom.current !== null && items.length > focusFrom.current) {
      cardLinks.current[focusFrom.current]?.focus()
      focusFrom.current = null
    }
  }, [items.length])

  useEffect(() => {
    if (errorStatus(listings.error) === 401) void sessionEnded()
  }, [listings.error, sessionEnded])

  function clearFilters() {
    setQuery('')
    clearAll()
  }

  const total = listings.data?.total ?? 0
  const loaded = listings.data !== undefined && !listings.isFetching

  let body
  if (listings.isLoading) {
    body = (
      <LoadingState label="Loading listings">
        <ul className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <Skeleton shape="card" />
            </li>
          ))}
        </ul>
      </LoadingState>
    )
  } else if (listings.isError) {
    body = (
      <ErrorState
        title="We couldn't load listings."
        description="Check your connection and try again."
        onRetry={() => void listings.refetch()}
        retrying={listings.isFetching}
      />
    )
  } else if (total === 0 && !filters.isFiltered) {
    body = (
      <EmptyState
        title="No food listed yet."
        description="Check back later today. Donors usually list in the afternoon."
      />
    )
  } else if (total === 0) {
    body = (
      <EmptyState
        title="No listings match your filters"
        description="Try a different search or clear the filters."
        action={{ label: 'Clear filters', onClick: clearFilters }}
      />
    )
  } else {
    body = (
      <>
        <ul className="grid gap-[14px] sm:grid-cols-2 md:gap-[18px] lg:grid-cols-3">
          {items.map((listing, index) => (
            <li key={listing.id}>
              <ListingCard
                ref={(element) => {
                  cardLinks.current[index] = element
                }}
                listing={listing}
                myRequest={mine.get(listing.id)}
                canRequest={canRequest}
              />
            </li>
          ))}
        </ul>
        {items.length < total && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="secondary"
              loading={listings.isFetching}
              onClick={() => {
                focusFrom.current = items.length
                setPage({ key: filterKey, limit: limit + PAGE_SIZE })
              }}
            >
              Load more
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="max-w-[1080px]">
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search by food name, donor or area"
        searchPlaceholder="Search by food name, donor or area…"
        activeCount={filters.activeCount}
        onClearAll={clearFilters}
        resultMessage={loaded && !listings.isError ? countMessage(total, filters.status === DEFAULT_STATUS) : undefined}
      >
        <FormField label="Category" className="sm:min-w-40 sm:flex-1">
          {(field) => (
            <Select
              {...field}
              options={CATEGORIES}
              value={filters.category}
              onValueChange={(value) => update({ category: value })}
              allowAny
              anyLabel="All categories"
            />
          )}
        </FormField>
        <FormField label="Pickup area" className="sm:min-w-40 sm:flex-1">
          {(field) => (
            <Select
              {...field}
              options={PICKUP_AREAS}
              value={filters.area}
              onValueChange={(value) => update({ area: value })}
              allowAny
              anyLabel="All areas"
            />
          )}
        </FormField>
        <FormField label="Status" className="sm:min-w-40 sm:flex-1">
          {(field) => (
            <Select
              {...field}
              options={STATUS_OPTIONS}
              value={filters.status === 'all' ? undefined : filters.status}
              onValueChange={(value) => update({ status: value ?? 'all' })}
              allowAny
              anyLabel="All statuses"
            />
          )}
        </FormField>
      </FilterBar>

      {listings.fulfilledTimeStamp && !listings.isError && (
        <p className="mb-4 text-[13px] text-text-muted">{formatUpdated(listings.fulfilledTimeStamp, now)}</p>
      )}

      {body}
    </div>
  )
}
