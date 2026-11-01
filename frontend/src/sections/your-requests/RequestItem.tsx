
import { Link } from 'react-router'
import { CancelRequestButton } from '@/components/common/CancelRequestButton'
import { ListingPhoto } from '@/components/common/ListingPhoto'
import { StatusBadge } from '@/components/common/StatusBadge'
import { optionLabel, PICKUP_AREAS } from '@/constants/listingOptions'
import { listingDetailPath } from '@/constants/routes'
import { formatDateTime } from '@/lib/format'
import type { ListingRequest } from '@/types/api'

export function RequestItem({
  request,
}: {
  request: ListingRequest
}) {
  const { listing } = request
  const area = `${optionLabel(PICKUP_AREAS, listing.pickupArea)}, Lagos`

  const isCollected = listing.status === 'COLLECTED'

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">
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
            <StatusBadge
              kind="listing"
              status="COLLECTED"
            />
          ) : (
            <StatusBadge
              kind="request"
              status={request.status}
            />
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

        {request.status === 'PENDING' && !isCollected && (
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
