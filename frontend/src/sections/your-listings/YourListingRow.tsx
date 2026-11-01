// One of the donor's listings on Your listings (spec S6).
// The food name opens the listing; the pencil opens Edit listing.
import { Link } from 'react-router'
import { ListingPhoto } from '@/components/common/ListingPhoto'
import {
  ClockIcon,
  PinIcon,
  QuantityIcon,
} from '@/components/common/MetaIcons'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  optionLabel,
  PICKUP_AREAS,
} from '@/constants/listingOptions'
import { listingDetailPath } from '@/constants/routes'
import { formatListingQuantity, formatPickup } from '@/lib/format'
import type { Listing } from '@/types/api'

function waitingText(count: number): string | null {
  if (count === 0) return null
  return count === 1
    ? '1 request waiting'
    : `${count} requests waiting`
}

export function YourListingRow({ listing }: { listing: Listing }) {
  const waiting = waitingText(listing.pendingRequestCount)
  const detailPath = listingDetailPath(listing.id)
  const editPath = `${detailPath}/edit`

  return (
    <article className="relative flex gap-4 rounded-2xl border border-border bg-surface p-3.5 hover:bg-surface-hover has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus">
      <ListingPhoto
        photoUrl={listing.photoUrl}
        className="h-15.5 w-21 shrink-0 rounded-md"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 font-display text-lg wrap-break-word">
            <Link
              to={detailPath}
              className="outline-none after:absolute after:inset-0"
            >
              {listing.foodName}
            </Link>
          </h2>

          {/* Keep the edit action and status badge aligned consistently. */}
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <Link
              to={editPath}
              aria-label={`Edit ${listing.foodName}`}
              title="Edit listing"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-hover text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Link>

            <StatusBadge
              kind="listing"
              status={listing.status}
            />
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-secondary">
          <li className="flex items-center gap-1.5">
            <QuantityIcon />
            {formatListingQuantity(listing)}
          </li>

          <li className="flex items-center gap-1.5">
            <ClockIcon />
            {formatPickup(listing.deadline)}
          </li>

          <li className="flex items-center gap-1.5">
            <PinIcon />
            {optionLabel(PICKUP_AREAS, listing.pickupArea)}, Lagos
          </li>
        </ul>

        {waiting && (
          <p className="text-sm font-semibold text-warning">
            {waiting}
          </p>
        )}
      </div>
    </article>
  )
}