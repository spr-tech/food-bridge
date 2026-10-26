// One of the recipient's requests on Your requests (spec S7): the food (linking to the
// listing), donor, area, when it was requested, the note and the status badge. An
// approved request shows where and when to collect in a highlighted block; a pending
// one can be cancelled.
import { Link } from 'react-router'
import { CancelRequestButton } from '@/components/common/CancelRequestButton'
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
    <article className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 font-display text-lg wrap-break-word">
          <Link to={listingDetailPath(listing.id)} className="text-primary underline underline-offset-4">
            {listing.foodName}
          </Link>
        </h3>
        <StatusBadge kind="request" status={request.status} />
      </div>

      <p className="mt-1 text-sm text-text-muted">
        {listing.donorName} · {area} · {listing.quantity} {listing.unit}
      </p>
      <p className="mt-1 text-[13px] text-text-muted">Requested {formatDateTime(request.createdAt)}</p>
      {request.note && <p className="mt-2 text-sm wrap-break-word text-text-body">“{request.note}”</p>}

      {request.status === 'APPROVED' && (
        <div className="mt-3 rounded-xl bg-status-available-bg p-3 text-sm text-status-available-text">
          <p className="font-semibold">Approved. Collect from {listing.donorName}.</p>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <ClockIcon />
              {formatPickup(listing.deadline)}
            </span>
            <span className="flex items-center gap-1.5">
              <PinIcon />
              {area}
            </span>
          </p>
        </div>
      )}

      {request.status === 'PENDING' && (
        <CancelRequestButton
          requestId={request.id}
          listingId={listing.id}
          foodName={listing.foodName}
          className="mt-3 w-full sm:w-auto"
        />
      )}
    </article>
  )
}