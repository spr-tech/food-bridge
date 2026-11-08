import { Link } from 'react-router'
import { CancelRequestButton } from '@/components/content/requests/shared/CancelRequestButton'
import { ListingPhoto } from '@/components/content/listings/shared/ListingPhoto'
import { ClockIcon, PinIcon } from '@/components/content/listings/shared/MetaIcons'
import { StatusBadge } from '@/components/content/listings/shared/StatusBadge'
import { optionLabel, PICKUP_AREAS } from '@/utilities/constants/listingOptions'
import { listingDetailPath } from '@/utilities/constants/routes'
import { formatDateTime, formatPickup } from '@/utilities/helpers/format'
import {
  REQUEST_NOT_APPROVED,
  getRecipientRequestStatus,
  wasNotApprovedAndListingClosed,
} from '@/utilities/helpers/request-status'
import type { ListingRequest } from '@/models/api'

export function RequestItem({ request }: { request: ListingRequest }) {
  const { listing } = request
  const area = `${optionLabel(PICKUP_AREAS, listing.pickupArea)}, Lagos`

  const isCollected =
    request.status === 'APPROVED' &&
    listing.status === 'COLLECTED'

  const displayStatus = getRecipientRequestStatus(
    request.status,
    listing.status,
  )

  return (
    <article className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-3 shadow-card sm:gap-4 sm:p-4">
      <ListingPhoto
        photoUrl={listing.photoUrl}
        className="h-30 w-30 shrink-0 rounded-xl"
        iconSize={25}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold wrap-break-word">
            <Link
              to={listingDetailPath(listing.id)}
              className="text-primary underline underline-offset-4"
            >
              {listing.foodName}
            </Link>
          </h3>

          {isCollected ? (
            <StatusBadge kind="listing" status="COLLECTED" className="shrink-0 whitespace-nowrap" />
          ) : (
            <StatusBadge kind="request" status={displayStatus} className="shrink-0 whitespace-nowrap" />
          )}
        </div>

        <p className="mt-1 text-xs text-text-muted">
          {listing.donorName} · {area} · {listing.quantity} {listing.unit}
        </p>

        <p className="mt-1 text-xs text-text-muted">
          Requested {formatDateTime(request.createdAt)}
        </p>

        {request.note && (
          <p className="mt-2 text-sm wrap-break-word text-text-body">
            “{request.note}”
          </p>
        )}

        {request.status === 'APPROVED' && !isCollected && (
          <div className="mt-2 rounded-xl bg-status-available-bg p-2.5 text-xs text-status-available-text">
            <p className="font-semibold">
              Approved. Collect from {listing.donorName}.
            </p>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1">
                <ClockIcon />
                {formatPickup(listing.deadline)}
              </span>

              <span className="flex items-center gap-1">
                <PinIcon />
                {area}
              </span>
            </div>
          </div>
        )}

        {wasNotApprovedAndListingClosed(request.status, listing.status) && (
          <p className="mt-2 text-xs leading-normal text-text-body">
            {REQUEST_NOT_APPROVED}
          </p>
        )}

        {displayStatus === 'PENDING' && (
          <CancelRequestButton
            requestId={request.id}
            listingId={listing.id}
            foodName={listing.foodName}
            className="mt-2 w-full hover:cursor-pointer sm:w-auto"
          />
        )}
      </div>
    </article>
  )
}