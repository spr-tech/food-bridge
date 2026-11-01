
// A recipient's one action on a listing (spec S4), by situation:
// - Already requested (and not cancelled): "Your request" with the request's status badge.
// - Approved: explain that the listing is reserved for this organisation.
// - Available: "Request this food", with an explanation of the approval process.
// - Reserved for someone else: "Already reserved", no button.
// - Expired: explain that the deadline has passed.
// - Collected: the listing badge says Collected.
// When the button a recipient pressed goes away, focus moves to what replaced it.

import { useEffect, useRef, useState } from 'react'
import { CancelRequestButton } from '@/components/common/CancelRequestButton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequestFood } from '@/hooks/useRequestFood'
import { useMyRequests } from '@/services/requests'
import type { Listing, ListingRequest } from '@/types/api'

const NOTE = 'mt-2.5 text-[12.5px] leading-[1.55] text-text-muted md:text-[13px]'

// This recipient's latest request on the listing; a cancelled one doesn't count.
function latestRequest(
  requests: ListingRequest[] | undefined,
  listingId: string,
): ListingRequest | undefined {
  return requests
    ?.filter(
      (request) =>
        request.listingId === listingId &&
        request.status !== 'CANCELLED',
    )
    .sort(
      (a, b) =>
        Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )[0]
}

export function RecipientAction({
  listing,
}: {
  listing: Listing
}) {
  const myRequests = useMyRequests()

  const [focusNext, setFocusNext] = useState<
    'status' | 'request' | null
  >(null)

  const statusRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<HTMLButtonElement>(null)

  const { request, isLoading } = useRequestFood(
    listing.id,
    () => setFocusNext('status'),
  )

  const myRequest = latestRequest(myRequests.data, listing.id)

  // Wait for refreshed requests before moving focus to the new element.
  useEffect(() => {
    const target =
      focusNext === 'status'
        ? statusRef.current
        : focusNext === 'request'
          ? requestRef.current
          : null

    if (!target) return

    const timer = window.setTimeout(() => {
      target.focus()

      // Only clear the focus target if no newer target was set.
      setFocusNext((current) =>
        current === focusNext ? null : current,
      )
    }, 0)

    return () => window.clearTimeout(timer)
  }, [
    focusNext,
    myRequest?.id,
    myRequest?.status,
    listing.status,
  ])

  // Wait for the recipient's requests before choosing an action.
  if (myRequests.isLoading) {
    return <Skeleton lines={2} />
  }

  if (myRequest) {
    const isApprovedAndReserved =
      myRequest.status === 'APPROVED' &&
      listing.status === 'RESERVED'

    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        className="rounded-xl border border-border bg-bg p-4"
      >
        <p className="flex flex-wrap items-center gap-2.5 text-sm font-semibold">
          <span>Your request</span>
          <StatusBadge
            kind="request"
            status={myRequest.status}
          />
        </p>

        {isApprovedAndReserved && (
          <p className={NOTE}>
            This listing is reserved for your organisation.
            Your collection has been approved.
          </p>
        )}

        {myRequest.status === 'PENDING' && (
          <CancelRequestButton
            requestId={myRequest.id}
            listingId={listing.id}
            foodName={listing.foodName}
            className="mt-3.5 w-full sm:w-auto"
            onCancelled={() => setFocusNext('request')}
          />
        )}
      </div>
    )
  }

  if (listing.status === 'AVAILABLE') {
    return (
      <>
        <Button
          ref={requestRef}
          size="lg"
          loading={isLoading}
          onClick={() => void request()}
          className="h-12.5 w-full text-[15px] font-bold"
        >
          Request this food
        </Button>

        <p className={NOTE}>
          The donor approves one request. You'll see the result in Your requests.
        </p>
      </>
    )
  }

  if (listing.status === 'RESERVED') {
    return (
      <p className="font-semibold text-text-body">
        Already reserved
      </p>
    )
  }

  if (listing.status === 'EXPIRED') {
    return (
      <p className={NOTE}>
        The collection deadline has passed, so this listing can't be requested.
      </p>
    )
  }

  return null
}
