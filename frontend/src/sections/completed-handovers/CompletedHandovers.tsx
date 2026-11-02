// Completed handovers (/admin/handovers): every Collected listing with the donor, the
// recipient whose approved request it was, the quantity and, when recorded, when it was
// collected. Opened from the dashboard's Completed handovers card.
// The service has no handover list of its own, so useCompletedHandovers puts each row
// together from documented reads (see src/services/admin.ts). A recipient or collection
// time the service doesn't supply is shown as "Not recorded", never guessed.
import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, CalendarCheck, PackageCheck, Store, Users } from 'lucide-react'
import { DESKTOP_QUERY } from '@/components/layout/AppLayout'
import { ListingPhoto } from '@/components/common/ListingPhoto'
import { LoadingState } from '@/components/common/LoadingState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { optionLabel, PICKUP_AREAS } from '@/constants/listingOptions'
import { listingDetailPath, ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useNow } from '@/hooks/useNow'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { cn } from '@/lib/cn'
import { formatDateTime, formatListingQuantity, formatUpdated } from '@/lib/format'
import { useCompletedHandovers } from '@/services/admin'
import { errorStatus } from '@/services/errors'
import type { CompletedHandover } from '@/types/api'

const CARD = 'rounded-3xl border border-border bg-surface shadow-card'
const NOT_RECORDED = 'Not recorded'
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

export function CompletedHandoversHeader() {
  return (
    <header className="mb-8">
      <Link
        to={ROUTES.admin}
        className={cn(
          'mb-5 inline-flex items-center gap-2 rounded-full text-sm font-semibold text-primary hover:underline',
          FOCUS,
        )}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>
      <p className="text-[11px] font-bold tracking-widest text-accent uppercase">Handovers</p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-tight text-text sm:text-5xl">
        Completed <em className="text-accent">handovers</em>
      </h1>
      <p className="mt-3 max-w-2xl text-text-muted">
        Food a donor has marked as collected by a recipient organisation.
      </p>
    </header>
  )
}

export function CompletedHandovers() {
  const handovers = useCompletedHandovers()
  const now = useNow()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const navigate = useNavigate()
  const sessionEnded = useSessionEnded()

  // A 401 ends the session (spec section 4).
  useEffect(() => {
    if (errorStatus(handovers.error) === 401) void sessionEnded()
  }, [handovers.error, sessionEnded])

  if (handovers.isLoading) {
    return (
      <LoadingState label="Loading completed handovers">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton lines={2} />
          <Skeleton lines={2} />
          <Skeleton lines={2} />
        </div>
        <Skeleton lines={6} />
      </LoadingState>
    )
  }

  if (handovers.isError || !handovers.data) {
    return (
      <div className={CARD}>
        <ErrorState
          title="We couldn't load completed handovers."
          description="Check your connection and try again."
          onRetry={() => void handovers.refetch()}
          retrying={handovers.isFetching}
        />
      </div>
    )
  }

  const rows = handovers.data

  if (rows.length === 0) {
    return (
      <div className={CARD}>
        <EmptyState
          icon={<PackageCheck size={32} />}
          title="No completed handovers yet"
          description="A handover appears here once a donor marks an approved request as collected."
          action={{ label: 'Browse all listings', onClick: () => void navigate(ROUTES.listings) }}
        />
      </div>
    )
  }

  const donors = new Set(rows.map((row) => row.donorName)).size
  const recipients = new Set(rows.flatMap((row) => (row.recipientName ? [row.recipientName] : []))).size
  const today = new Date(now)

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid gap-4 sm:grid-cols-3" aria-label="Summary">
        <Figure icon={<PackageCheck size={20} />} label="Handovers" value={rows.length} featured />
        <Figure icon={<Store size={20} />} label="Donors" value={donors} />
        <Figure icon={<Users size={20} />} label="Recipient organisations" value={recipients} />
      </ul>

      <section aria-labelledby="handover-records" className={cn(CARD, 'overflow-hidden')}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
          <h2 id="handover-records" className="font-display text-2xl text-text">
            Handover records
          </h2>
          {handovers.fulfilledTimeStamp && (
            <p className="text-[13px] text-text-muted">{formatUpdated(handovers.fulfilledTimeStamp, now)}</p>
          )}
        </div>

        {isDesktop ? <HandoverTable rows={rows} today={today} /> : <HandoverCards rows={rows} today={today} />}
      </section>

      <p className="text-[13px] leading-relaxed text-text-muted">
        Collection times come from the platform’s 100 most recent activity events, and the
        recipient from the listing’s approved request. Where the service no longer holds either,
        the record shows “{NOT_RECORDED}”.
      </p>
    </div>
  )
}

function Figure({
  icon,
  label,
  value,
  featured = false,
}: {
  icon: ReactNode
  label: string
  value: number
  featured?: boolean
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-4 rounded-3xl border p-5 shadow-card',
        featured ? 'border-sidebar-dark bg-sidebar-dark' : 'border-border bg-surface',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-2xl',
          featured ? 'bg-pill-on-dark text-highlight-on-dark' : 'bg-cream text-primary',
        )}
      >
        {icon}
      </span>
      <div>
        <p className={cn('text-sm font-semibold', featured ? 'text-link-on-dark' : 'text-text-muted')}>{label}</p>
        <p className={cn('font-display text-3xl leading-tight', featured ? 'text-on-dark-heading' : 'text-text')}>
          {value.toLocaleString('en-GB')}
        </p>
      </div>
    </li>
  )
}

function FoodCell({ row }: { row: CompletedHandover }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ListingPhoto photoUrl={row.photoUrl} className="size-12 shrink-0 rounded-xl" iconSize={18} />
      <div className="min-w-0">
        <Link
          to={listingDetailPath(row.listingId)}
          className={cn('font-semibold wrap-break-word text-text hover:text-primary hover:underline', FOCUS)}
        >
          {row.foodName}
        </Link>
        <p className="text-[13px] text-text-muted">{optionLabel(PICKUP_AREAS, row.pickupArea)}, Lagos</p>
      </div>
    </div>
  )
}

function Recorded({ value }: { value: string | null }) {
  return value ? <>{value}</> : <span className="text-text-muted italic">{NOT_RECORDED}</span>
}

function collectedText(row: CompletedHandover, today: Date): string | null {
  return row.collectedAt ? formatDateTime(row.collectedAt, today) : null
}

function HandoverTable({ rows, today }: { rows: CompletedHandover[]; today: Date }) {
  const head = 'px-4 py-3 text-left text-[11px] font-bold tracking-widest text-text-muted uppercase'

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse text-sm">
        <thead className="bg-bg">
          <tr>
            <th scope="col" className={cn(head, 'pl-6')}>
              Food
            </th>
            <th scope="col" className={head}>
              Donor
            </th>
            <th scope="col" className={head}>
              Recipient
            </th>
            <th scope="col" className={head}>
              Quantity
            </th>
            <th scope="col" className={head}>
              Collected
            </th>
            <th scope="col" className={cn(head, 'pr-6')}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.listingId} className="border-t border-border transition-colors hover:bg-bg">
              <td className="py-3 pr-4 pl-6">
                <FoodCell row={row} />
              </td>
              <td className="px-4 py-3 text-text-body">{row.donorName}</td>
              <td className="px-4 py-3 text-text-body">
                <Recorded value={row.recipientName} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-text-body">{formatListingQuantity(row)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-text-body">
                {row.collectedAt ? (
                  <time dateTime={row.collectedAt}>{collectedText(row, today)}</time>
                ) : (
                  <Recorded value={null} />
                )}
              </td>
              <td className="py-3 pr-6 pl-4">
                <StatusBadge kind="listing" status="COLLECTED" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HandoverCards({ rows, today }: { rows: CompletedHandover[]; today: Date }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.listingId} className="flex flex-col gap-4 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <FoodCell row={row} />
            <StatusBadge kind="listing" status="COLLECTED" className="shrink-0" />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Detail label="Donor">{row.donorName}</Detail>
            <Detail label="Recipient">
              <Recorded value={row.recipientName} />
            </Detail>
            <Detail label="Quantity">{formatListingQuantity(row)}</Detail>
            <Detail label="Collected">
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck size={14} aria-hidden="true" className="text-text-muted" />
                <Recorded value={collectedText(row, today)} />
              </span>
            </Detail>
          </dl>
        </li>
      ))}
    </ul>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 wrap-break-word text-text-body">{children}</dd>
    </div>
  )
}
