// The administrator's dashboard (brief journey 5): open listings, requests waiting,
// reserved, completed handovers, expired, and an estimate of food saved. Each count
// links to All listings filtered to match. States: skeletons while loading; the error
// with Try again; a 401 goes to sign in.
import { useEffect } from 'react'
import { Link } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { formatUpdated } from '@/lib/format'
import { errorStatus } from '@/services/errors'
import { useListings } from '@/services/listings'

type Stat = {
  label: string
  value: number
  hint: string
  // Where the card leads; none for the estimate.
  to?: string
}

function StatCard({ stat }: { stat: Stat }) {
  const content = (
    <>
      <p className="text-sm font-semibold text-text-muted">{stat.label}</p>
      <p className="mt-1 font-display text-4xl">{stat.value.toLocaleString('en-GB')}</p>
      <p className="mt-1 text-[13px] text-text-muted">{stat.hint}</p>
    </>
  )
  const box = 'block rounded-2xl border border-border bg-surface p-5'
  return stat.to ? (
    <Link to={stat.to} className={`${box} hover:bg-surface-hover`}>
      {content}
    </Link>
  ) : (
    <div className={box}>{content}</div>
  )
}

export function AdminDashboard() {
  // Every listing in every state; the counts are worked out from them.
  const listings = useListings({ status: 'all', limit: 1000 })
  const sessionEnded = useSessionEnded()
  const now = useNow()

  useEffect(() => {
    if (errorStatus(listings.error) === 401) void sessionEnded()
  }, [listings.error, sessionEnded])

  if (listings.isLoading) {
    return (
      <LoadingState label="Loading the dashboard">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </LoadingState>
    )
  }

  if (listings.isError) {
    return (
      <ErrorState
        title="We couldn't load the dashboard."
        description="Check your connection and try again."
        onRetry={() => void listings.refetch()}
        retrying={listings.isFetching}
      />
    )
  }

  const items = listings.data?.items ?? []
  const count = (status: string) => items.filter((listing) => listing.status === status).length
  const collected = items.filter((listing) => listing.status === 'COLLECTED')

  const stats: Stat[] = [
    { label: 'Open listings', value: count('AVAILABLE'), hint: 'Available to request now', to: `${ROUTES.listings}?status=available` },
    {
      label: 'Requests waiting',
      value: items.reduce((sum, listing) => sum + listing.pendingRequestCount, 0),
      hint: 'Pending a donor’s decision',
      to: ROUTES.listings,
    },
    { label: 'Reserved', value: count('RESERVED'), hint: 'A request approved, awaiting collection', to: `${ROUTES.listings}?status=reserved` },
    { label: 'Completed handovers', value: collected.length, hint: 'Food collected', to: `${ROUTES.listings}?status=collected` },
    { label: 'Expired', value: count('EXPIRED'), hint: 'Deadline passed', to: `${ROUTES.listings}?status=expired` },
    {
      label: 'Food saved (estimate)',
      value: collected.reduce((sum, listing) => sum + listing.quantity, 0),
      hint: 'Items in collected listings; an estimate, not weighed',
    },
  ]

  return (
    <>
      {listings.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">{formatUpdated(listings.fulfilledTimeStamp, now)}</p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <li key={stat.label}>
            <StatCard stat={stat} />
          </li>
        ))}
      </ul>
    </>
  )
}