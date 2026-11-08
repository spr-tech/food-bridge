// Requests waiting (/admin/requests): every request still waiting for its donor's decision,
// opened from the dashboard's Requests waiting card. Donors approve or decline; an
// administrator only monitors, so there are no actions here (original brief).
// A request is waiting while it is Pending and its listing is still Available. The service
// also leaves requests Pending on listings that have moved on (reserved, collected, expired
// or deleted); no decision is due on those, so they are listed apart, without actions, each
// saying why. Every count here is of the rows GET /api/admin/requests?status=PENDING returns;
// the dashboard's Requests waiting figure (the service's pendingRequests) counts them all, so
// a note explains the difference rather than forcing the two to match.
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, CircleSlash, Inbox, ListChecks, ShoppingBasket } from 'lucide-react'
import { ListingPhoto } from '@/components/common/ListingPhoto'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SummaryStrip } from '@/components/common/SummaryStrip'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { optionLabel, PICKUP_AREAS } from '@/utilities/constants/listingOptions'
import { listingDetailPath, ROUTES } from '@/utilities/constants/routes'
import { LISTING_STATUS } from '@/utilities/constants/status'
import { useNow } from '@/utilities/hooks/useNow'
import { useSessionEnded } from '@/utilities/hooks/useSessionEnded'
import { cn } from '@/utilities/helpers/cn'
import { formatDateTime, formatListingQuantity, formatUpdated } from '@/utilities/helpers/format'
import { usePendingRequests } from '@/services/admin'
import { errorStatus } from '@/utilities/helpers/apiErrors'
import type { ListingRequest } from '@/models/api'
import type { ListingStatus } from '@/utilities/enums/status'

const CARD = 'rounded-3xl border border-border bg-surface shadow-card'
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

const newestFirst = (a: ListingRequest, b: ListingRequest) => Date.parse(b.createdAt) - Date.parse(a.createdAt)

const requestsWord = (count: number) => (count === 1 ? 'request' : 'requests')
const statusWord = (status: ListingStatus) => LISTING_STATUS[status].label.toLowerCase()

// "9 collected and 7 deleted": the listings' statuses, most first.
function byListingStatus(requests: ListingRequest[]): string {
  const counts = new Map<ListingStatus, number>()
  for (const request of requests) {
    counts.set(request.listing.status, (counts.get(request.listing.status) ?? 0) + 1)
  }
  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => `${count} ${statusWord(status)}`)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
}

export function AdminRequestsHeader() {
  return (
    <>
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
      <PageHeader
        eyebrow="Administrator · Requests"
        title="Requests waiting"
        description="Requests from recipient organisations that are waiting for the donor's decision."
      />
    </>
  )
}

export function AdminRequests() {
  const requests = usePendingRequests()
  const now = useNow()
  const navigate = useNavigate()
  const sessionEnded = useSessionEnded()

  // A 401 ends the session (spec section 4).
  useEffect(() => {
    if (errorStatus(requests.error) === 401) void sessionEnded()
  }, [requests.error, sessionEnded])

  if (requests.isLoading) {
    return (
      <LoadingState label="Loading requests waiting">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </LoadingState>
    )
  }

  if (requests.isError || !requests.data) {
    return (
      <div className={CARD}>
        <ErrorState
          title="We couldn't load the requests."
          description="Check your connection and try again."
          onRetry={() => void requests.refetch()}
          retrying={requests.isFetching}
        />
      </div>
    )
  }

  const all = [...requests.data].sort(newestFirst)
  const waiting = all.filter((request) => request.listing.status === 'AVAILABLE')
  const leftPending = all.filter((request) => request.listing.status !== 'AVAILABLE')
  const listings = new Set(waiting.map((request) => request.listingId)).size

  return (
    <div className="flex flex-col gap-5">
      <SummaryStrip
        label="Requests at a glance"
        figures={[
          {
            label: 'Requests waiting',
            value: waiting.length,
            hint: 'For a donor decision',
            icon: <ListChecks size={18} />,
          },
          {
            label: 'Listings',
            value: listings,
            hint: 'Available, with requests waiting',
            icon: <ShoppingBasket size={18} />,
          },
          {
            label: 'No decision due',
            value: leftPending.length,
            hint: 'Pending on listings no longer available',
            icon: <CircleSlash size={18} />,
          },
        ]}
      />

      {leftPending.length > 0 && (
        <p className="rounded-2xl border border-border bg-surface p-4 text-[13px] leading-relaxed text-text-muted">
          The service marks {all.length} {requestsWord(all.length)} as pending, and the dashboard's
          Requests waiting figure counts them all. {waiting.length === 0 ? 'None' : waiting.length} of
          them {waiting.length <= 1 ? 'is' : 'are'} on an available listing and waiting for the
          donor's decision. The other {leftPending.length} {leftPending.length === 1 ? 'is' : 'are'} on
          listings that are no longer available ({byListingStatus(leftPending)}), so no decision is
          due on {leftPending.length === 1 ? 'it' : 'them'}.
        </p>
      )}

      <section aria-labelledby="waiting-heading" className={cn(CARD, 'p-5 sm:p-6')}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="waiting-heading" className="font-display text-2xl text-text">
            Waiting for a decision
          </h2>
          {requests.fulfilledTimeStamp && (
            <p className="text-[13px] text-text-muted">{formatUpdated(requests.fulfilledTimeStamp, now)}</p>
          )}
        </div>

        {waiting.length > 0 ? (
          <RequestList requests={waiting} now={now} />
        ) : (
          <EmptyState
            headingLevel="h3"
            icon={<Inbox size={32} />}
            title="No requests waiting"
            description="No request on an available listing is waiting for the donor's decision."
            action={{ label: 'Browse all listings', onClick: () => void navigate(ROUTES.listings) }}
          />
        )}
      </section>

      {leftPending.length > 0 && (
        <section aria-labelledby="left-pending-heading" className={cn(CARD, 'p-5 sm:p-6')}>
          <h2 id="left-pending-heading" className="font-display text-xl text-text">
            Still marked pending, no decision due
          </h2>
          <p className="mt-2 mb-4 text-[13px] leading-relaxed text-text-muted">
            The service still marks {leftPending.length} {requestsWord(leftPending.length)} as pending
            on listings that are no longer available. A donor can't approve or decline{' '}
            {leftPending.length === 1 ? 'it' : 'them'}, so {leftPending.length === 1 ? "it isn't" : "they aren't"}{' '}
            counted as waiting.
          </p>
          <details className="group">
            <summary className={cn('w-fit rounded-full text-sm font-semibold text-primary underline underline-offset-4', FOCUS)}>
              Show these requests
            </summary>
            <div className="mt-4">
              <RequestList requests={leftPending} now={now} noDecisionDue />
            </div>
          </details>
        </section>
      )}
    </div>
  )
}

function RequestList({
  requests,
  now,
  noDecisionDue = false,
}: {
  requests: ListingRequest[]
  now: number
  noDecisionDue?: boolean
}) {
  return (
    <ul className="grid gap-3">
      {requests.map((request) => (
        <li key={request.id}>
          <RequestRow request={request} today={new Date(now)} noDecisionDue={noDecisionDue} />
        </li>
      ))}
    </ul>
  )
}

function RequestRow({
  request,
  today,
  noDecisionDue,
}: {
  request: ListingRequest
  today: Date
  noDecisionDue: boolean
}) {
  const { listing } = request

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-border p-3 sm:gap-4 sm:p-4">
      <ListingPhoto photoUrl={listing.photoUrl} className="size-16 shrink-0 rounded-xl" iconSize={20} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 font-sans text-sm font-semibold wrap-break-word">
            <Link
              to={listingDetailPath(listing.id)}
              className={cn('text-primary underline underline-offset-4', FOCUS)}
            >
              {listing.foodName}
            </Link>
          </h3>
          <StatusBadge kind="listing" status={listing.status} className="shrink-0 whitespace-nowrap" />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {listing.donorName} · {optionLabel(PICKUP_AREAS, listing.pickupArea) || listing.pickupArea}, Lagos ·{' '}
          {formatListingQuantity(listing)}
        </p>
        <p className="mt-1 text-[13px] text-text-body">
          <span className="font-semibold text-text">{request.recipientName}</span> requested{' '}
          {formatDateTime(request.createdAt, today)}
        </p>
        {noDecisionDue && (
          <p className="mt-1 text-xs text-text-muted">
            No decision due: the listing is {statusWord(listing.status)}.
          </p>
        )}
      </div>
    </article>
  )
}
