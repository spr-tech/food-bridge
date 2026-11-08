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
import { ListChecks, ShoppingBasket, Truck } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { SummaryStrip } from '@/components/common/SummaryStrip'
import { ViewTabs } from '@/components/common/ViewTabs'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/utilities/constants/routes'
import { useNow } from '@/utilities/hooks/useNow'
import { useSessionEnded } from '@/utilities/hooks/useSessionEnded'
import { formatUpdated } from '@/utilities/helpers/format'
import { YourListingRow } from '@/sections/your-listings/YourListingRow'
import { errorStatus } from '@/services/errors'
import { useMyListings } from '@/services/listings'
import type { Listing } from '@/models/api'

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
  const available = items.filter((listing) => listing.status === 'AVAILABLE')
  const reserved = items.filter((listing) => listing.status === 'RESERVED')
  // Requests still awaiting a decision: only an Available listing's count (once a listing
  // is reserved the service still counts its other requests as pending). As in the menu.
  const waiting = available.reduce((sum, listing) => sum + listing.pendingRequestCount, 0)

  return (
    <>
      {listings.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">{formatUpdated(listings.fulfilledTimeStamp, now)}</p>
      )}

      <SummaryStrip
        label="Your listings at a glance"
        figures={[
          { label: 'Available', value: available.length, hint: 'Open to requests', icon: <ShoppingBasket size={18} /> },
          { label: 'Reserved', value: reserved.length, hint: 'Awaiting collection', icon: <Truck size={18} /> },
          { label: 'Requests waiting', value: waiting, hint: 'For your decision', icon: <ListChecks size={18} /> },
        ]}
      />

      <ViewTabs
        label="Your listing views"
        tabs={[
          {
            id: 'active-listings-tab',
            panelId: 'active-listings-panel',
            label: 'Your listings',
            count: active.length,
            selected: view === 'active',
            onSelect: () => showView('active'),
          },
          {
            id: 'listing-history-tab',
            panelId: 'listing-history-panel',
            label: 'Listing history',
            count: history.length,
            selected: view === 'history',
            onSelect: () => showView('history'),
          },
        ]}
      />

      {view === 'active' ? (
        <section id="active-listings-panel" role="tabpanel" aria-labelledby="active-listings-tab" tabIndex={0}>
          <h2 className="mb-3 font-display text-xl">Current listings</h2>
          {active.length > 0 ? (
            <ListingList listings={active} />
          ) : (
            <p className="rounded-3xl border border-border bg-surface p-5 text-sm text-text-muted shadow-card">
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
            <p className="rounded-3xl border border-border bg-surface p-5 text-sm text-text-muted shadow-card">
              No listing history yet. Collected and expired listings appear here.
            </p>
          )}
        </section>
      )}
    </>
  )
}
