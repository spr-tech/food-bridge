// The owning donor's requests panel on Listing details (spec S5): every request with its
// organisation, area, time, note and status; Approve and Decline on Pending ones.
// - One approved request per listing: it shows first, every other request Declined, with
//   no buttons. An expired listing's requests show Expired, with no buttons. The service
//   may still store the others as PENDING; they are shown Declined (effectiveStatus), and
//   Approve and Decline only show while the listing is Available with nothing approved.
// - Approve is the optimistic update (services/requests.ts): the panel changes as soon as
//   the donor confirms. On 409 LISTING_ALREADY_RESERVED it goes back to the service's true
//   state, says so, and focus moves to the request that is actually approved. If the
//   connection drops it goes back and offers Try again.
// - Daily fairness rule (the service's DAILY_DISTRIBUTION_PRIORITY): a recipient who has
//   already had a request approved today can't be approved again while another recipient
//   has had none today. The panel can't tell beforehand (the donor can't see other
//   listings' approvals), so Approve stays on until the service refuses; then it says why,
//   and that organisation's Approve stays off, with the reason beside it, for the rest of
//   this visit. Decline stays available. Every refusal refreshes the requests and listing.
// - Decline waits for the service, then "Request declined".
// States: skeleton rows; "No requests yet. Recipients nearby can see this listing until
// [deadline]."; "We couldn't load requests." with Try again; "Updated …".
import { useEffect, useRef, useState } from 'react'
import { LoadingState } from '@/components/ui/loading-state/LoadingState'
import { EmptyState } from '@/components/ui/empty-state/empty-state'
import { ErrorState } from '@/components/ui/error-state/error-state'
import { Skeleton } from '@/components/ui/skeleton/skeleton'
import { useToast } from '@/components/ui/toast/toast'
import { useNow } from '@/utilities/hooks/useNow'
import { useSessionEnded } from '@/utilities/hooks/useSessionEnded'
import { formatDateTime, formatUpdated } from '@/utilities/helpers/format'
import { RequestRow } from '@/sections/listing-details/RequestRow'
import { errorCode, errorStatus } from '@/utilities/helpers/apiErrors'
import {
  useDecideRequest,
  useListingRequests,
  useMarkCollected,
} from '@/services/requests'
import type { Listing, ListingRequest } from '@/models/api'

const ALREADY_RESERVED =
  'This listing already has an approved request. Your approval was not saved.'
const APPROVAL_DROPPED =
  "Your approval wasn't saved because the connection dropped. Try again."
const APPROVAL_FAILED = "Your approval wasn't saved. Try again."
const APPROVAL_EXPIRED =
  'This listing expired before your approval was saved.'
const APPROVAL_NOT_PENDING =
  'This request can no longer be approved.'
const DECLINE_NOT_PENDING =
  'This request can no longer be declined.'
const DECLINE_FAILED = "Your decline wasn't saved. Try again."
const COLLECT_NOT_ALLOWED =
  "This request can't be marked as collected."
const COLLECT_FAILED = "That wasn't saved. Try again."
const PRIORITY_TITLE = "This request can't be approved yet."
const priorityExplanation = (name: string) =>
  `${name} has already received food today. Every organisation must get its first food today before anyone gets a second, so this approval was not saved. You can approve another organisation's request or decline this one.`
const PRIORITY_HELD =
  "Can't be approved yet: this organisation has already received food today and others are still waiting for their first."

// Where focus goes next: a request once it has been decided; after a refused approval,
// whichever request the service says is approved; or a row whose Approve was refused.
type FocusTarget =
  | { decided: string }
  | { approvedOtherThan: string }
  | { row: string }

function effectiveStatus(
  request: ListingRequest,
  listing: Listing,
  approvedRequestId?: string,
): ListingRequest['status'] {
  if (request.status !== 'PENDING') {
    return request.status
  }

  if (listing.status === 'EXPIRED') {
    return 'EXPIRED'
  }

  const anotherRequestWasApproved =
    approvedRequestId !== undefined &&
    approvedRequestId !== request.id

  const listingIsNoLongerAvailable =
    listing.status === 'RESERVED' ||
    listing.status === 'COLLECTED' ||
    listing.status === 'REVERSED'

  if (anotherRequestWasApproved || listingIsNoLongerAvailable) {
    return 'DECLINED'
  }

  return 'PENDING'
}

export function RequestsPanel({ listing }: { listing: Listing }) {
  const requests = useListingRequests(listing.id)
  const [decideRequest] = useDecideRequest()
  const [markCollected] = useMarkCollected()
  const { toast } = useToast()
  const sessionEnded = useSessionEnded()
  const now = useNow()

  const rows = useRef(new Map<string, HTMLElement>())
  const [focusTarget, setFocusTarget] =
    useState<FocusTarget | null>(null)
  // Recipients the service refused under the daily fairness rule during this visit.
  const [heldRecipients, setHeldRecipients] =
    useState<ReadonlySet<string>>(() => new Set())

  const approvedRequestId = requests.data?.find(
    (request) => request.status === 'APPROVED',
  )?.id

  // A listing with an approved request cannot accept another decision.
  const canDecideRequests =
    listing.status === 'AVAILABLE' &&
    approvedRequestId === undefined

  const eligiblePending = canDecideRequests
    ? (requests.data ?? []).filter(
        (request) => request.status === 'PENDING',
      )
    : []

  useEffect(() => {
    if (!focusTarget || !requests.data) return

    const row =
      'row' in focusTarget
        ? requests.data.find((request) => request.id === focusTarget.row)
        : 'decided' in focusTarget
        ? requests.data.find(
            (request) =>
              request.id === focusTarget.decided &&
              request.status !== 'PENDING',
          )
        : requests.data.find(
            (request) =>
              request.status === 'APPROVED' &&
              request.id !== focusTarget.approvedOtherThan,
          )

    const element = row && rows.current.get(row.id)
    if (!element) return

    const timer = window.setTimeout(() => {
      element.focus()
      setFocusTarget((current) =>
        current === focusTarget ? null : current,
      )
    }, 0)

    return () => window.clearTimeout(timer)
  }, [focusTarget, requests.data])

  useEffect(() => {
    if (errorStatus(requests.error) === 401) {
      void sessionEnded()
    }
  }, [requests.error, sessionEnded])

  async function approve(request: ListingRequest): Promise<void> {
    setFocusTarget({ decided: request.id })

    try {
      await decideRequest({
        requestId: request.id,
        listingId: listing.id,
        decision: 'APPROVED',
      }).unwrap()

      toast({
        variant: 'success',
        title: 'Request approved',
      })
    } catch (error) {
      const status = errorStatus(error)
      const code = errorCode(error)
      const tryAgain = {
        label: 'Try again',
        onClick: () => void approve(request),
      }

      if (status === 401) {
        void sessionEnded()
      } else if (code === 'LISTING_ALREADY_RESERVED') {
        toast({
          variant: 'error',
          title: ALREADY_RESERVED,
        })
        setFocusTarget({ approvedOtherThan: request.id })
      } else if (code === 'DAILY_DISTRIBUTION_PRIORITY') {
        toast({
          variant: 'error',
          title: PRIORITY_TITLE,
          description: priorityExplanation(request.recipientName),
        })
        setHeldRecipients((held) => new Set(held).add(request.recipientId))
        // Its Approve button is going, so focus moves to the row.
        setFocusTarget({ row: request.id })
      } else if (code === 'LISTING_EXPIRED') {
        toast({
          variant: 'error',
          title: APPROVAL_EXPIRED,
        })
      } else if (code === 'REQUEST_NOT_PENDING') {
        toast({
          variant: 'error',
          title: APPROVAL_NOT_PENDING,
        })
      } else if (status === 'FETCH_ERROR') {
        toast({
          variant: 'error',
          title: APPROVAL_DROPPED,
          action: tryAgain,
        })
      } else {
        toast({
          variant: 'error',
          title: APPROVAL_FAILED,
          action: tryAgain,
        })
      }
    }
  }

  async function decline(request: ListingRequest): Promise<void> {
    try {
      await decideRequest({
        requestId: request.id,
        listingId: listing.id,
        decision: 'DECLINED',
      }).unwrap()

      toast({
        variant: 'success',
        title: 'Request declined',
      })

      setFocusTarget({ decided: request.id })
    } catch (error) {
      if (errorStatus(error) === 401) {
        void sessionEnded()
      } else if (errorCode(error) === 'REQUEST_NOT_PENDING') {
        toast({
          variant: 'error',
          title: DECLINE_NOT_PENDING,
        })
      } else {
        toast({
          variant: 'error',
          title: DECLINE_FAILED,
          action: {
            label: 'Try again',
            onClick: () => void decline(request),
          },
        })
      }
    }
  }

  async function collect(request: ListingRequest): Promise<void> {
    try {
      await markCollected({
        requestId: request.id,
        listingId: listing.id,
      }).unwrap()

      toast({
        variant: 'success',
        title: 'Marked as collected',
      })
    } catch (error) {
      const status = errorStatus(error)

      if (status === 401) {
        void sessionEnded()
      } else if (status === 409 || status === 403) {
        toast({
          variant: 'error',
          title: COLLECT_NOT_ALLOWED,
        })
      } else {
        toast({
          variant: 'error',
          title: COLLECT_FAILED,
          action: {
            label: 'Try again',
            onClick: () => void collect(request),
          },
        })
      }
    }
  }

  let body

  if (requests.isLoading) {
    body = (
      <LoadingState label="Loading requests">
        {[0, 1].map((key) => (
          <div
            key={key}
            className="rounded-3xl border border-border bg-surface p-4 shadow-card"
          >
            <Skeleton lines={3} />
          </div>
        ))}
      </LoadingState>
    )
  } else if (requests.isError && !requests.data) {
    body = (
      <ErrorState
        headingLevel="h3"
        title="We couldn't load requests."
        description="Check your connection and try again."
        onRetry={() => void requests.refetch()}
        retrying={requests.isFetching}
      />
    )
  } else if (!requests.data?.length) {
    body = (
      <EmptyState
        headingLevel="h3"
        title="No requests yet."
        description={`Recipients nearby can see this listing until ${formatDateTime(listing.deadline)}.`}
      />
    )
  } else {
    body = (
      <ul className="grid gap-3 md:gap-3.5">
        {requests.data.map((request) => {
          const displayStatus = effectiveStatus(
            request,
            listing,
            approvedRequestId,
          )

          const canDecide =
            canDecideRequests &&
            request.status === 'PENDING'

          return (
            <li key={request.id}>
              <RequestRow
                ref={(element) => {
                  if (element) {
                    rows.current.set(request.id, element)
                  } else {
                    rows.current.delete(request.id)
                  }
                }}
                request={request}
                listing={listing}
                displayStatus={displayStatus}
                canDecide={canDecide}
                approveHeldReason={
                  heldRecipients.has(request.recipientId)
                    ? PRIORITY_HELD
                    : undefined
                }
                otherPending={eligiblePending.filter(
                  (pending) => pending.id !== request.id,
                ).length}
                onApprove={() => void approve(request)}
                onDecline={() => decline(request)}
                onCollect={() => collect(request)}
              />
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section
      aria-labelledby="requests-heading"
      className="mt-7 md:max-w-190"
    >
      <h2 id="requests-heading" className="text-2xl">
        Requests
      </h2>

      {requests.fulfilledTimeStamp && requests.data ? (
        <p className="mt-1 mb-3.5 text-[13px] text-text-muted">
          {formatUpdated(requests.fulfilledTimeStamp, now)}
        </p>
      ) : (
        <div className="mb-3.5" />
      )}

      {body}
    </section>
  )
}
