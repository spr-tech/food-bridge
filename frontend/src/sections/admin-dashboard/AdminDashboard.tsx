// The administrator's dashboard (brief journey 5): open listings, requests waiting,
// reserved, completed handovers, expired, and an estimate of food saved.
// Some figures and destinations remain unavailable until the backend contract is updated.
// Below them: today's progress through the daily fairness rule (GET
// /api/admin/distribution/today) and recent activity (GET /api/activity). Each part loads
// and fails on its own, so one slow or failing call never hides the others.
import { useEffect } from 'react'
import { Link } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { activityLabel } from '@/constants/activity'
import { listingDetailPath, ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { formatDateTime, formatUpdated } from '@/lib/format'
import { errorStatus } from '@/services/errors'
import { useAdminDashboard, useDistributionToday, useRecentActivity } from '@/services/admin'

// How many activity rows the dashboard shows (the service allows 1 to 100).
const ACTIVITY_LIMIT = 10

const SECTION_HEADING = 'mb-3 font-sans text-lg font-bold'

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

// A 401 from any part of the dashboard ends the session (spec section 4).
function useEndSessionOn401(error: unknown) {
  const sessionEnded = useSessionEnded()

  useEffect(() => {
    if (errorStatus(error) === 401) {
      void sessionEnded()
    }
  }, [error, sessionEnded])
}

export function AdminDashboard() {
  return (
    <>
      <DashboardStats />
      <DistributionToday />
      <RecentActivity />
    </>
  )
}

function DashboardStats() {
  const dashboard = useAdminDashboard()
  const now = useNow()
  useEndSessionOn401(dashboard.error)

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

function DistributionToday() {
  const distribution = useDistributionToday()
  useEndSessionOn401(distribution.error)

  let body
  if (distribution.isLoading) {
    body = (
      <LoadingState label="Loading today's distribution">
        <Skeleton shape="card" />
      </LoadingState>
    )
  } else if (distribution.isError || !distribution.data) {
    body = (
      <ErrorState
        headingLevel="h3"
        title="We couldn't load today's distribution."
        description="Check your connection and try again."
        onRetry={() => void distribution.refetch()}
        retrying={distribution.isFetching}
      />
    )
  } else {
    const today = distribution.data
    const stats: Stat[] = [
      {
        label: 'Organisations served',
        value: `${today.recipientsServedToday.toLocaleString('en-GB')} of ${today.totalRecipients.toLocaleString('en-GB')}`,
        hint: 'Recipient organisations with food approved today',
      },
      {
        label: 'Still waiting',
        value: today.recipientsWaitingToday,
        hint: 'Recipient organisations with no approval yet today',
      },
      {
        label: 'Approved today',
        value: today.approvedListingsToday,
        hint: 'Requests approved since midnight, Lagos time',
      },
    ]

    body = (
      <>
        <p className="mb-4 text-sm">
          {today.firstRoundInProgress
            ? 'First round in progress: an organisation that has received food today can’t be approved again until every organisation has had its first.'
            : 'First round complete: every recipient organisation has received food today.'}
        </p>
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

  return (
    <section aria-labelledby="distribution-heading" className="mt-10">
      <h2 id="distribution-heading" className={SECTION_HEADING}>
        Today’s distribution
      </h2>
      {body}
    </section>
  )
}

function RecentActivity() {
  const activity = useRecentActivity(ACTIVITY_LIMIT)
  const now = useNow()
  useEndSessionOn401(activity.error)

  let body
  if (activity.isLoading) {
    body = <LoadingState label="Loading recent activity" />
  } else if (activity.isError || !activity.data) {
    body = (
      <ErrorState
        headingLevel="h3"
        title="We couldn't load recent activity."
        description="Check your connection and try again."
        onRetry={() => void activity.refetch()}
        retrying={activity.isFetching}
      />
    )
  } else if (activity.data.length === 0) {
    body = (
      <EmptyState
        headingLevel="h3"
        title="No activity yet"
        description="Listings, requests and handovers will appear here as they happen."
      />
    )
  } else {
    body = (
      <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {activity.data.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-0.5 px-5 py-3">
            <p className="text-sm">
              <span className="font-semibold">{entry.actorName}</span> {activityLabel(entry.type).toLowerCase()}
              {entry.listingTitle && (
                <>
                  {': '}
                  {entry.listingId ? (
                    <Link
                      to={listingDetailPath(entry.listingId)}
                      className="font-medium text-primary underline underline-offset-4"
                    >
                      {entry.listingTitle}
                    </Link>
                  ) : (
                    entry.listingTitle
                  )}
                </>
              )}
            </p>
            {entry.createdAt && (
              <time dateTime={entry.createdAt} className="text-[13px] text-text-muted">
                {formatDateTime(entry.createdAt, new Date(now))}
              </time>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="activity-heading" className="mt-10">
      <h2 id="activity-heading" className={SECTION_HEADING}>
        Recent activity
      </h2>
      {body}
    </section>
  )
}
