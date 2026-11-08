import { useEffect, useRef, useState } from 'react'
import { CancelRequestButton } from '@/components/common/CancelRequestButton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRequestFood } from '@/utilities/hooks/useRequestFood'
import {
  REQUEST_NOT_APPROVED,
  getRecipientRequestStatus,
  wasNotApprovedAndListingClosed,
} from '@/utilities/helpers/request-status'
import { useMyRequests } from '@/services/requests'
import type { Listing, ListingRequest } from '@/models/api'

const NOTE = 'mt-2.5 text-[12.5px] leading-[1.55] text-text-muted md:text-[13px]'

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

export function RecipientAction({ listing }: { listing: Listing }) {
  const myRequests = useMyRequests()

  const [focusNext, setFocusNext] = useState<'status' | 'request' | null>(null)

  const statusRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<HTMLButtonElement>(null)

  const { request, isLoading } = useRequestFood(
    listing.id,
    () => setFocusNext('status'),
  )

  const myRequest = latestRequest(myRequests.data, listing.id)

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
      setFocusNext((current) =>
        current === focusNext ? null : current,
      )
    }, 0)

    return () => window.clearTimeout(timer)
  }, [focusNext, myRequest?.id, myRequest?.status, listing.status])

  if (myRequests.isLoading) {
    return <Skeleton lines={2} />
  }

  if (myRequest) {
    const isCollected =
      myRequest.status === 'APPROVED' &&
      listing.status === 'COLLECTED'

    const displayStatus = getRecipientRequestStatus(
      myRequest.status,
      listing.status,
    )

    const notApproved = wasNotApprovedAndListingClosed(
      myRequest.status,
      listing.status,
    )

    const isApprovedAndReserved =
      myRequest.status === 'APPROVED' &&
      listing.status === 'RESERVED'

    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        className="rounded-2xl border border-border bg-bg p-4"
      >
        <p className="flex flex-wrap items-center gap-2.5 text-sm font-semibold">
          <span>Your request</span>

          {isCollected ? (
            <StatusBadge kind="listing" status="COLLECTED" />
          ) : (
            <StatusBadge kind="request" status={displayStatus} />
          )}
        </p>

        {isApprovedAndReserved && (
          <p className={NOTE}>
            This listing is reserved for your organisation.
            Your collection has been approved.
          </p>
        )}

        {notApproved && (
          <p className={NOTE}>{REQUEST_NOT_APPROVED}</p>
        )}

        {listing.status === 'DELETED' && (
          <p className={NOTE}>
            The donor has removed this listing, so it can't be collected.
          </p>
        )}

        {displayStatus === 'PENDING' && (
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

  if (listing.status === 'DELETED') {
    return (
      <p className={NOTE}>
        The donor has removed this listing, so it can't be requested.
      </p>
    )
  }

  if (listing.status === 'REVERSED') {
    return (
      <p className={NOTE}>
        This listing's handover was reversed, so it can't be requested.
      </p>
    )
  }

  return null
}