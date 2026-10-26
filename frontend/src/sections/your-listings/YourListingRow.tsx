// One of the donor's listings on Your listings (spec S6): photo, food name (the whole row
// opens the listing), status badge, quantity, pickup time and area, and how many requests
// are waiting.
import { Link } from 'react-router'
import { ListingPhoto } from '@/components/common/ListingPhoto'
import { ClockIcon, PinIcon, QuantityIcon } from '@/components/common/MetaIcons'
import { StatusBadge } from '@/components/common/StatusBadge'
import { optionLabel, PICKUP_AREAS } from '@/constants/listingOptions'
import { listingDetailPath } from '@/constants/routes'
import { formatListingQuantity, formatPickup } from '@/lib/format'
import type { Listing } from '@/types/api'

// "1 request waiting", "3 requests waiting", or nothing when none are.
function waitingText(count: number): string | null {
  if (count === 0) return null
  return count === 1 ? '1 request waiting' : `${count} requests waiting`
}

export function YourListingRow({ listing }: { listing: Listing }) {
  const waiting = waitingText(listing.pendingRequestCount)

  return (
    <article className="relative flex gap-4 rounded-2xl border border-border bg-surface p-3.5 hover:bg-surface-hover has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus">
      <ListingPhoto photoUrl={listing.photoUrl} className="h-15.5 w-21 shrink-0 rounded-md" />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 font-display text-lg wrap-break-word">
            {/* The link stretches over the whole row, so anywhere on it opens the listing. */}
            <Link to={listingDetailPath(listing.id)} className="outline-none after:absolute after:inset-0">
              {listing.foodName}
            </Link>
          </h2>
          <StatusBadge kind="listing" status={listing.status} />
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

        {waiting && <p className="text-sm font-semibold text-warning">{waiting}</p>}
      </div>
    </article>
  )
}