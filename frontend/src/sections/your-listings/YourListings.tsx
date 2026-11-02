// The donor's listings, newest first (spec S6), with its states: skeleton rows while
// loading; the error with Try again; an empty start that points to Share food; a 401
// goes to sign in.
// Two tabs, like the recipient's Your requests:
// - Your listings: the current work, Available and Reserved (awaiting collection)
// - Listing history: Collected and Expired, and Deleted ones if the service ever returns
//   them (today it leaves deleted listings out of the donor's list)
// The tab is kept in the address (?view=history), so it survives a refresh and works
// with Back and Forward. Each listing is placed by the status the service sends.
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { cn } from '@/lib/cn'
import { formatUpdated } from '@/lib/format'
import { YourListingRow } from '@/sections/your-listings/YourListingRow'
import { errorStatus } from '@/services/errors'
import { useMyListings } from '@/services/listings'
import type { Listing } from '@/types/api'

type ListingView = 'active' | 'history'

const ACTIVE: ReadonlySet<Listing['status']> = new Set(['AVAILABLE', 'RESERVED'])

const LISTING_HISTORY_PARAM = 'view'
const LISTING_HISTORY_VALUE = 'history'

function isActiveListing(listing: Listing): boolean {
  return ACTIVE.has(listing.status)
}

function ListingList({ listings }: { listings: Listing[] }) {
  return (
    <ul className="grid gap-3">
      {listings.map((listing) => (
        <li key={listing.id}>
          <YourListingRow listing={listing} />
        </li>
      ))}
    </ul>
  )
}

type TabProps = {
  id: string
  panelId: string
  label: string
  count: number
  selected: boolean
  onSelect: () => void
}

function Tab({ id, panelId, label, count, selected, onSelect }: TabProps) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={panelId}
      onClick={onSelect}
      className={cn(
        'flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        selected ? 'bg-primary text-on-primary shadow-sm' : 'bg-transparent text-text-secondary hover:bg-surface',
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs',
          selected ? 'bg-on-primary/15 text-on-primary' : 'bg-surface text-text-muted',
        )}
      >
        {count}
      </span>
    </button>
  )
}

export function YourListings() {
  const listings = useMyListings()
  const navigate = useNavigate()
  const sessionEnded = useSessionEnded()
  const now = useNow()
  const [searchParams, setSearchParams] = useSearchParams()
  const view: ListingView =
    searchParams.get(LISTING_HISTORY_PARAM) === LISTING_HISTORY_VALUE ? 'history' : 'active'

  function showView(next: ListingView) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        if (next === 'history') params.set(LISTING_HISTORY_PARAM, LISTING_HISTORY_VALUE)
        else params.delete(LISTING_HISTORY_PARAM)
        return params
      },
      { preventScrollReset: true },
    )
  }

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

  const active = items.filter(isActiveListing)
  const history = items.filter((listing) => !isActiveListing(listing))

  return (
    <>
      {listings.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">{formatUpdated(listings.fulfilledTimeStamp, now)}</p>
      )}

      <div role="tablist" aria-label="Your listing views" className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-surface-hover p-1">
        <Tab
          id="active-listings-tab"
          panelId="active-listings-panel"
          label="Your listings"
          count={active.length}
          selected={view === 'active'}
          onSelect={() => showView('active')}
        />
        <Tab
          id="listing-history-tab"
          panelId="listing-history-panel"
          label="Listing history"
          count={history.length}
          selected={view === 'history'}
          onSelect={() => showView('history')}
        />
      </div>

      {view === 'active' ? (
        <section id="active-listings-panel" role="tabpanel" aria-labelledby="active-listings-tab" tabIndex={0}>
          <h2 className="mb-3 font-display text-xl">Current listings</h2>
          {active.length > 0 ? (
            <ListingList listings={active} />
          ) : (
            <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-muted">
              Nothing open right now. Available listings and reserved ones awaiting collection appear here.
            </p>
          )}
        </section>
      ) : (
        <section id="listing-history-panel" role="tabpanel" aria-labelledby="listing-history-tab" tabIndex={0}>
          <h2 className="mb-3 font-display text-xl">Listing history</h2>
          {history.length > 0 ? (
            <ListingList listings={history} />
          ) : (
            <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-muted">
              No listing history yet. Collected and expired listings appear here.
            </p>
          )}
        </section>
      )}
    </>
  )
}
