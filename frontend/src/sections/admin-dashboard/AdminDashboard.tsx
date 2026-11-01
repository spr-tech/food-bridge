// The administrator's dashboard (brief journey 5): open listings, requests waiting,
// reserved, completed handovers, expired, and an estimate of food saved.
// Some figures and destinations remain unavailable until the backend contract is updated.
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
import { useAdminDashboard } from '@/services/admin'

type Stat = {
  label: string
  value: number | string
  hint: string
  to?: string
}

function StatCard({ stat }: { stat: Stat }) {
  const value =
    typeof stat.value === 'number'
      ? stat.value.toLocaleString('en-GB')
      : stat.value

  const content = (
    <>
      <p className="text-sm font-semibold text-text-muted">{stat.label}</p>
      <p className="mt-1 font-display text-4xl">{value}</p>
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
  const dashboard = useAdminDashboard()
  const sessionEnded = useSessionEnded()
  const now = useNow()

  useEffect(() => {
    if (errorStatus(dashboard.error) === 401) {
      void sessionEnded()
    }
  }, [dashboard.error, sessionEnded])

  if (dashboard.isLoading) {
    return (
      <LoadingState label="Loading the dashboard">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </LoadingState>
    )
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <ErrorState
        title="We couldn't load the dashboard."
        description="Check your connection and try again."
        onRetry={() => void dashboard.refetch()}
        retrying={dashboard.isFetching}
      />
    )
  }

  const summary = dashboard.data

  const stats: Stat[] = [
    {
      label: 'Open listings',
      value: summary.availableListings,
      hint: 'Available to request now',
      to: `${ROUTES.listings}?status=available`,
    },
    {
      label: 'Requests waiting',
      value: summary.pendingRequests,
      hint: 'Pending donor decisions; admin request view not connected yet',
    },
    {
      label: 'Reserved',
      value: summary.reservedListings,
      hint: 'A request approved, awaiting collection',
      to: `${ROUTES.listings}?status=reserved`,
    },
    {
      label: 'Completed handovers',
      value: summary.completedHandovers,
      hint: 'Collected; listing filter awaiting backend correction',
    },
    {
      label: 'Expired',
      value: '—',
      hint: 'Waiting for an explicit expired-listings count from the backend',
    },
    {
      label: 'Food saved (estimate)',
      value: '—',
      hint: 'Waiting for a complete portions-saved estimate from the backend',
    },
  ]

  return (
    <>
      {dashboard.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">
          {formatUpdated(dashboard.fulfilledTimeStamp, now)}
        </p>
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