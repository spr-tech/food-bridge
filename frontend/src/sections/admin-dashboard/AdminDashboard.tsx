// The administrator's dashboard (brief journey 5): open listings, requests waiting,
// reserved, completed handovers, expired, and food saved per unit. Requests waiting opens
// /admin/requests and Expired opens the Expired listings.
// Below them: the listing pipeline and the share collected (both from GET
// /api/admin/dashboard), today's progress through the daily fairness rule (GET
// /api/admin/distribution/today) and recent activity (GET /api/activity). Each part loads
// and fails on its own, so one slow or failing call never hides the others.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, ListChecks, PackageCheck, ShoppingBasket, Truck } from 'lucide-react'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { activityLabel } from '@/utilities/constants/activity'
import { listingDetailPath, ROUTES } from '@/utilities/constants/routes'
import { useNow } from '@/utilities/hooks/useNow'
import { useSessionEnded } from '@/utilities/hooks/useSessionEnded'
import { cn } from '@/utilities/helpers/cn'
import { foodSavedByUnit } from '@/utilities/helpers/food-saved'
import { formatDateTime, formatLongDay, formatUnit, formatUpdated, initials } from '@/utilities/helpers/format'
import { errorStatus } from '@/utilities/helpers/apiErrors'
import {
  useAdminDashboard,
  useCompletedHandovers,
  useDistributionToday,
  useRecentActivity,
  type AdminDashboardSummary,
} from '@/services/admin'

// Recent activity: the 50 most recent events (the service allows 1 to 100), shown five
// at a time.
const ACTIVITY_LIMIT = 50
const ACTIVITY_STEP = 5

const CARD = 'rounded-3xl border border-border bg-surface shadow-card'
const EYEBROW = 'text-[11px] font-bold tracking-widest text-text-muted uppercase'
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

type Stat = {
  label: string
  value: number | string
  hint: string
  to?: string
  icon: ReactNode
  featured?: boolean
}

const formatValue = (value: number | string) =>
  typeof value === 'number' ? value.toLocaleString('en-GB') : value

// A headline figure. Linked cards lift on hover and show an arrow; the featured card is
// the dark green of the sidebar.
function StatCard({ stat }: { stat: Stat }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'grid size-10 place-items-center rounded-2xl',
            stat.featured ? 'bg-pill-on-dark text-highlight-on-dark' : 'bg-cream text-primary',
          )}
        >
          {stat.icon}
        </span>
        {stat.to && (
          <span
            aria-hidden="true"
            className={cn(
              'grid size-9 place-items-center rounded-full border transition-colors',
              stat.featured
                ? 'border-pill-on-dark text-on-dark-heading group-hover:bg-highlight-on-dark group-hover:text-on-count'
                : 'border-border text-text-muted group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary',
            )}
          >
            <ArrowUpRight size={16} />
          </span>
        )}
      </div>
      <div className="mt-6">
        <p className={cn('text-sm font-semibold', stat.featured ? 'text-link-on-dark' : 'text-text-muted')}>
          {stat.label}
        </p>
        <p
          className={cn(
            'mt-1 font-display text-5xl leading-none tracking-tight',
            stat.featured ? 'text-on-dark-heading' : 'text-text',
          )}
        >
          {formatValue(stat.value)}
        </p>
        <p className={cn('mt-3 text-[13px] leading-snug', stat.featured ? 'text-footer-on-dark' : 'text-text-muted')}>
          {stat.hint}
        </p>
      </div>
    </>
  )

  const box = cn(
    'group flex h-full flex-col rounded-3xl border p-5 shadow-card',
    stat.featured
      ? 'border-sidebar-dark bg-sidebar-dark'
      : 'border-border bg-surface',
  )

  return stat.to ? (
    <Link
      to={stat.to}
      className={cn(
        box,
        FOCUS,
        'transition motion-safe:hover:-translate-y-0.5',
        !stat.featured && 'hover:border-border-hover',
      )}
    >
      {content}
    </Link>
  ) : (
    <div className={box}>{content}</div>
  )
}

// A titled card. Its h2 names the region.
function Panel({
  eyebrow,
  title,
  action,
  className,
  children,
}: {
  eyebrow: string
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className={cn(CARD, 'flex min-w-0 flex-col p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className={EYEBROW}>{eyebrow}</p>
          <h2 id={headingId} className="mt-1 font-display text-2xl leading-tight text-text">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// A small pill-shaped link in a panel's corner.
function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:border-primary hover:bg-surface-hover',
        FOCUS,
      )}
    >
      {children}
      <ArrowUpRight size={14} aria-hidden="true" />
    </Link>
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

// The page's header: today's date, the one h1, when the figures were fetched, and links
// to the two lists an administrator works from.
export function DashboardHeader() {
  const dashboard = useAdminDashboard()
  const now = useNow()

  return (
    <PageHeader
      eyebrow={`Today · ${formatLongDay(new Date(now))}`}
      title="Dashboard"
      description="How FoodBridge is doing, across every listing."
      actions={
        <>
          {dashboard.fulfilledTimeStamp && (
            <p className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-[13px] text-muted-on-cream">
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
              {formatUpdated(dashboard.fulfilledTimeStamp, now)}
            </p>
          )}
          <Link
            to={ROUTES.listings}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-hover',
              FOCUS,
            )}
          >
            <ShoppingBasket size={16} aria-hidden="true" />
            Browse all listings
          </Link>
          <Link
            to={ROUTES.completedHandovers}
            className={cn(
              'inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover',
              FOCUS,
            )}
          >
            <PackageCheck size={16} aria-hidden="true" />
            View handovers
          </Link>
        </>
      }
    />
  )
}

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-5">
      <DashboardStats />
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <ListingPipeline />
        <DistributionToday />
        <HandoverShare className="lg:col-span-2 xl:col-span-1" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <RecentActivity className="xl:col-span-2" />
        <MoreFigures />
      </div>
    </div>
  )
}

function DashboardStats() {
  const dashboard = useAdminDashboard()
  useEndSessionOn401(dashboard.error)

  let body
  if (dashboard.isLoading) {
    body = (
      <LoadingState label="Loading the dashboard">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton shape="card" />
          <Skeleton shape="card" />
          <Skeleton shape="card" />
          <Skeleton shape="card" />
        </div>
      </LoadingState>
    )
  } else if (dashboard.isError || !dashboard.data) {
    body = (
      <div className={CARD}>
        <ErrorState
          headingLevel="h3"
          title="We couldn't load the dashboard."
          description="Check your connection and try again."
          onRetry={() => void dashboard.refetch()}
          retrying={dashboard.isFetching}
        />
      </div>
    )
  } else {
    const summary = dashboard.data

    const stats: Stat[] = [
      {
        label: 'Completed handovers',
        value: summary.completedHandovers,
        hint: 'Food collected by a recipient. View every handover.',
        to: ROUTES.completedHandovers,
        icon: <PackageCheck size={20} />,
        featured: true,
      },
      {
        label: 'Open listings',
        value: summary.availableListings,
        hint: 'Available to request now',
        to: `${ROUTES.listings}?status=available`,
        icon: <ShoppingBasket size={20} />,
      },
      {
        label: 'Requests waiting',
        value: summary.pendingRequests,
        hint: 'Requests the service marks as pending. View those due a donor decision.',
        to: ROUTES.adminRequests,
        icon: <ListChecks size={20} />,
      },
      {
        label: 'Reserved',
        value: summary.reservedListings,
        hint: 'A request approved, awaiting collection',
        to: `${ROUTES.listings}?status=reserved`,
        icon: <Truck size={20} />,
      },
    ]

    body = (
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <StatCard stat={stat} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Platform summary
      </h2>
      {body}
    </section>
  )
}

// What the cards below the headline figures show while the summary isn't there: a
// skeleton while it loads, otherwise a short line (the summary's own error offers Try again).
function SummaryPending({ loading }: { loading: boolean }) {
  return loading ? (
    <LoadingState label="Loading the figures">
      <Skeleton lines={4} />
    </LoadingState>
  ) : (
    <p className="text-sm text-text-muted">These figures appear once the dashboard loads.</p>
  )
}

// Listings by stage, as bars on one scale. Each bar carries its label and value as text,
// so the figures don't depend on the bar's length or colour.
function ListingPipeline() {
  const dashboard = useAdminDashboard()
  const summary = dashboard.data

  return (
    <Panel eyebrow="Listings" title="Listing pipeline">
      {summary ? <PipelineBars summary={summary} /> : <SummaryPending loading={dashboard.isLoading} />}
    </Panel>
  )
}

function PipelineBars({ summary }: { summary: AdminDashboardSummary }) {
  const stages = [
    { label: 'Open', value: summary.availableListings },
    { label: 'Reserved', value: summary.reservedListings },
    { label: 'Collected', value: summary.collectedListings },
  ]
  const max = Math.max(1, ...stages.map((stage) => stage.value))

  return (
    <>
      <ul className="grid flex-1 grid-cols-3 gap-4" aria-label="Listings by stage">
        {stages.map((stage) => (
          <li key={stage.label} className="flex flex-col items-center gap-2">
            <span className="font-display text-2xl text-text">{formatValue(stage.value)}</span>
            <span className="flex min-h-36 w-full max-w-16 flex-1 items-end overflow-hidden rounded-2xl bg-cream" aria-hidden="true">
              <span
                className="block w-full rounded-2xl bg-primary"
                style={{ height: `${Math.max(4, (stage.value / max) * 100)}%` }}
              />
            </span>
            <span className="text-[13px] font-semibold text-text-muted">{stage.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-border pt-4 text-[13px] text-text-muted">
        {summary.totalListings.toLocaleString('en-GB')} listings recorded in total
      </p>
    </>
  )
}

// The share of every recorded listing that has been collected, as a ring meter.
function HandoverShare({ className }: { className?: string }) {
  const dashboard = useAdminDashboard()
  const summary = dashboard.data

  return (
    <Panel
      eyebrow="Handovers"
      title="Share collected"
      className={className}
      action={<PanelLink to={ROUTES.completedHandovers}>View all</PanelLink>}
    >
      {summary ? <ShareRing summary={summary} /> : <SummaryPending loading={dashboard.isLoading} />}
    </Panel>
  )
}

const RING_RADIUS = 52
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function ShareRing({ summary }: { summary: AdminDashboardSummary }) {
  const share =
    summary.totalListings > 0 ? Math.round((summary.collectedListings / summary.totalListings) * 100) : null

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row lg:flex-col xl:flex-col">
      <div className="relative size-44">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={RING_RADIUS} fill="none" strokeWidth="14" className="stroke-cream" />
          {share !== null && share > 0 && (
            <circle
              cx="64"
              cy="64"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="14"
              strokeDasharray={`${(share / 100) * RING_LENGTH} ${RING_LENGTH}`}
              className="stroke-primary"
            />
          )}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <p className="font-display text-4xl leading-none text-text">{share === null ? '—' : `${share}%`}</p>
          <p className="mt-1 text-[11px] font-bold tracking-widest text-text-muted uppercase">Collected</p>
        </div>
      </div>
      <p className="max-w-60 text-center text-[13px] text-text-muted">
        {summary.collectedListings.toLocaleString('en-GB')} of {summary.totalListings.toLocaleString('en-GB')}{' '}
        listings have been collected by a recipient.
      </p>
    </div>
  )
}

// The expired count (GET /api/admin/dashboard), linked to the Expired listings, and the
// food saved: the quantity listed on each completed handover, one total per unit. The
// service's estimatedPortionsSaved isn't shown: its figure can't yet be traced to the
// handovers it counts (see README, Known limitations).
function MoreFigures() {
  const dashboard = useAdminDashboard()
  const handovers = useCompletedHandovers()
  useEndSessionOn401(handovers.error)

  let foodSaved: ReactNode
  if (handovers.isLoading) foodSaved = <p className="mt-2 font-display text-2xl text-text">…</p>
  else if (handovers.isError || !handovers.data) {
    foodSaved = <p className="mt-2 font-display text-2xl text-text">Unavailable</p>
  } else {
    const totals = foodSavedByUnit(handovers.data)
    foodSaved =
      totals.length > 0 ? (
        <>
          <ul aria-label="Food saved by unit" className="mt-3 grid grid-cols-2 gap-2">
            {totals.map((total) => (
              <li key={total.unit} className="rounded-xl bg-surface px-3 py-2">
                <span className="block font-display text-2xl leading-tight text-text">
                  {total.quantity.toLocaleString('en-GB')}
                </span>
                <span className="text-[13px] text-text-muted">{formatUnit(total)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] leading-snug text-muted-on-cream">
            From {handovers.data.length.toLocaleString('en-GB')} completed{' '}
            {handovers.data.length === 1 ? 'handover' : 'handovers'}, using the quantity each donor listed.
            Units are kept apart and never converted, so these figures can’t be added together.
            Reversed handovers aren’t counted.
          </p>
        </>
      ) : (
        <p className="mt-2 font-display text-2xl text-text">None yet</p>
      )
  }

  return (
    <Panel eyebrow="Listings" title="More figures">
      {dashboard.data ? (
        <ul className="flex flex-col gap-3">
          <li>
            <Link
              to={`${ROUTES.listings}?status=expired`}
              className={cn(
                'group block rounded-2xl border border-transparent bg-cream p-4 transition-colors hover:border-primary',
                FOCUS,
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-muted-on-cream">Expired</span>
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-full border border-cream-border text-text-muted transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
                >
                  <ArrowUpRight size={14} />
                </span>
              </span>
              <span className="mt-1 block font-display text-3xl leading-none text-text">
                {dashboard.data.expiredListings.toLocaleString('en-GB')}
              </span>
              <span className="mt-2 block text-[13px] leading-snug text-muted-on-cream">
                Listings whose collection deadline passed before anyone collected them. Deleted
                listings aren’t counted.
              </span>
            </Link>
          </li>
          <li className="rounded-2xl bg-cream p-4" aria-busy={handovers.isLoading || undefined}>
            <p className="text-sm font-semibold text-muted-on-cream">Food saved, by unit</p>
            {foodSaved}
            {handovers.isError && (
              <button
                type="button"
                onClick={() => void handovers.refetch()}
                className="mt-2 text-[13px] font-semibold text-primary underline underline-offset-4"
              >
                Try again
              </button>
            )}
          </li>
        </ul>
      ) : (
        <SummaryPending loading={dashboard.isLoading} />
      )}
    </Panel>
  )
}

function DistributionToday() {
  const distribution = useDistributionToday()
  useEndSessionOn401(distribution.error)

  let body
  if (distribution.isLoading) {
    body = (
      <LoadingState label="Loading today's distribution">
        <Skeleton lines={4} />
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
    const served =
      today.totalRecipients > 0 ? Math.min(100, (today.recipientsServedToday / today.totalRecipients) * 100) : 0
    const stats = [
      {
        label: 'Organisations served',
        value: `${today.recipientsServedToday.toLocaleString('en-GB')} of ${today.totalRecipients.toLocaleString('en-GB')}`,
        hint: 'Recipient organisations with food approved today',
      },
      {
        label: 'Still waiting',
        value: formatValue(today.recipientsWaitingToday),
        hint: 'Recipient organisations with no approval yet today',
      },
      {
        label: 'Approved today',
        value: formatValue(today.approvedListingsToday),
        hint: 'Requests approved since midnight, Lagos time',
      },
    ]

    body = (
      <>
        <span
          className={cn(
            'mb-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
            today.firstRoundInProgress
              ? 'bg-status-pending-bg text-status-pending-text'
              : 'bg-status-available-bg text-status-available-text',
          )}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          {today.firstRoundInProgress ? 'In progress' : 'Complete'}
        </span>
        <p className="mb-5 text-sm leading-relaxed text-text-body">
          {today.firstRoundInProgress
            ? 'First round in progress: an organisation that has received food today can’t be approved again until every organisation has had its first.'
            : 'First round complete: every recipient organisation has received food today.'}
        </p>

        <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-cream" aria-hidden="true">
          <div className="h-full rounded-full bg-accent" style={{ width: `${served}%` }} />
        </div>

        <ul className="mt-auto flex flex-col gap-2.5">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 rounded-2xl border border-border px-4 py-3"
            >
              <p className="text-[13px] font-semibold text-text">{stat.label}</p>
              <p className="row-span-2 font-display text-2xl leading-tight text-text">{stat.value}</p>
              <p className="text-xs leading-snug text-text-muted">{stat.hint}</p>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <Panel eyebrow="Daily fairness rule" title="Today’s distribution">
      {body}
    </Panel>
  )
}

function RecentActivity({ className }: { className?: string }) {
  const activity = useRecentActivity(ACTIVITY_LIMIT)
  const now = useNow()
  const [shown, setShown] = useState(ACTIVITY_STEP)
  const showMoreRef = useRef<HTMLButtonElement>(null)
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
      <ul className="-mx-2 flex flex-col">
        {activity.data.slice(0, shown).map((entry) => (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-bg"
          >
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-xs font-bold text-primary"
            >
              {initials(entry.actorName) || '·'}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <p className="min-w-0 text-sm text-text-body">
                <span className="font-semibold text-text">{entry.actorName}</span>{' '}
                {activityLabel(entry.type).toLowerCase()}
                {entry.listingTitle && (
                  <>
                    {': '}
                    {entry.listingId ? (
                      <Link
                        to={listingDetailPath(entry.listingId)}
                        className="font-medium wrap-break-word text-primary underline underline-offset-4"
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
                <time dateTime={entry.createdAt} className="shrink-0 text-xs text-text-muted">
                  {formatDateTime(entry.createdAt, new Date(now))}
                </time>
              )}
            </div>
          </li>
        ))}
      </ul>
    )

    const total = activity.data.length
    const visible = Math.min(shown, total)
    if (total > ACTIVITY_STEP) {
      body = (
        <>
          {body}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-[13px] text-text-muted" aria-live="polite">
              Showing {visible} of {total}
            </p>
            <div className="flex gap-2">
              {visible > ACTIVITY_STEP && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShown(ACTIVITY_STEP)
                    showMoreRef.current?.focus()
                  }}
                >
                  Show less
                </Button>
              )}
              <Button
                ref={showMoreRef}
                variant="secondary"
                size="sm"
                // aria-disabled, not disabled, so focus stays on it once everything is shown.
                aria-disabled={visible >= total || undefined}
                className="aria-disabled:opacity-50"
                onClick={() => {
                  if (visible < total) setShown((count) => count + ACTIVITY_STEP)
                }}
              >
                Show more
              </Button>
            </div>
          </div>
        </>
      )
    }
  }

  return (
    <Panel eyebrow="Platform" title="Recent activity" className={className}>
      {body}
    </Panel>
  )
}
