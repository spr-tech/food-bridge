
import { Link } from 'react-router'
import { CancelRequestButton } from '@/components/common/CancelRequestButton'
import { ListingPhoto } from '@/components/common/ListingPhoto'
import { ClockIcon, PinIcon } from '@/components/common/MetaIcons'
import { StatusBadge } from '@/components/common/StatusBadge'
import { optionLabel, PICKUP_AREAS } from '@/constants/listingOptions'
import { listingDetailPath } from '@/constants/routes'
import { formatDateTime, formatPickup } from '@/lib/format'
import type { ListingRequest } from '@/types/api'

export function RequestItem({ request }: { request: ListingRequest }) {
  const { listing } = request
  const area = `${optionLabel(PICKUP_AREAS, listing.pickupArea)}, Lagos`

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">

      {/* Food photograph */}
      <ListingPhoto
        photoUrl={listing.photoUrl}
        className="h-30 w-30 shrink-0 rounded-xl"
        iconSize={25}
      />

      {/* Request information */}
      <div className="min-w-0 flex-1">

        {/* Food name and status */}
        <div className="flex items-start justify-between gap-2">

          <h3 className="min-w-0 flex-1 text-sm font-semibold wrap-break-word">
            <Link
              to={listingDetailPath(listing.id)}
              className="text-primary underline underline-offset-4"
            >
              {listing.foodName}
            </Link>
          </h3>

          <StatusBadge
            kind="request"
            status={request.status}
          />

        </div>

        {/* Donor, location and quantity */}
        <p className="mt-1 text-xs text-text-muted">
          {listing.donorName} · {area} · {listing.quantity} {listing.unit}
        </p>

        {/* Request date */}
        <p className="mt-1 text-xs text-text-muted">
          Requested {formatDateTime(request.createdAt)}
        </p>

        {/* Optional recipient note */}
        {request.note && (
          <p className="mt-2 text-sm wrap-break-word text-text-body">
            “{request.note}”
          </p>
        )}

        {/* Approved collection details */}
        {request.status === 'APPROVED' && (
          <div className="mt-2 rounded-lg bg-status-available-bg p-2 text-xs text-status-available-text">

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

        {/* Cancel button for pending requests */}
        {request.status === 'PENDING' && (
          <CancelRequestButton
            requestId={request.id}
            listingId={listing.id}
            foodName={listing.foodName}
            className="mt-2 w-full sm:w-auto hover:cursor-pointer "
          />
        )}

      </div>
    </article>
  )
}
