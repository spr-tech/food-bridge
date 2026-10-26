// One listing on Find food (spec S3, 3b-find-food-sidebar-light, m3): thumbnail, status
// badge, food name, category and donor, quantity, pickup time and area, then "View
// listing" and "Request food" side by side.
// The second button by situation: Request food (available); Requested, with "Requested ·
// waiting for donor" while pending; Reserved; Expired; Collected. Administrators can't
// request, so they get View listing only.
// Requesting follows S4's rules: one idempotency key per press, reused on Try again.
import { forwardRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ListingPhoto } from '@/components/common/ListingPhoto'
import { ClockIcon, PinIcon, QuantityIcon } from '@/components/common/MetaIcons'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CATEGORIES, optionLabel, PICKUP_AREAS } from '@/constants/listingOptions'
import { listingDetailPath } from '@/constants/routes'
import { useRequestFood } from '@/hooks/useRequestFood'
import { cn } from '@/lib/cn'
import { formatListingQuantity, formatPickup } from '@/lib/format'
import { usePrefetchListing } from '@/services/listings'
import type { Listing, ListingRequest } from '@/types/api'

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {icon}
      {children}
    </li>
  )
}

// The card's two buttons share one size: 38px tall, 13px text.
const CARD_BUTTON = 'h-9.5 px-2.5 text-[13px] font-bold'
const DISABLED = 'bg-disabled-bg text-disabled-text border-transparent hover:bg-disabled-bg disabled:opacity-100'

type ListingCardProps = {
  listing: Listing
  // This recipient's request on the listing, if any (cancelled ones left out).
  myRequest?: ListingRequest
  canRequest: boolean
}

export const ListingCard = forwardRef<HTMLAnchorElement, ListingCardProps>(function ListingCard(
  { listing, myRequest, canRequest },
  viewLinkRef,
) {
  const { request, isLoading } = useRequestFood(listing.id)
  const prefetch = usePrefetchListing()

  const pending = myRequest?.status === 'PENDING'
  let second: ReactNode = null
  if (canRequest) {
    const disabledLabel = myRequest
      ? 'Requested'
      : listing.status === 'RESERVED'
        ? 'Reserved'
        : listing.status === 'EXPIRED'
          ? 'Expired'
          : listing.status === 'COLLECTED'
            ? 'Collected'
            : null
    second = disabledLabel ? (
      <Button
        variant="secondary"
        disabled
        aria-label={`${disabledLabel}: ${listing.foodName}`}
        className={cn(CARD_BUTTON, DISABLED)}
      >
        {disabledLabel}
      </Button>
    ) : (
      <Button
        className={CARD_BUTTON}
        loading={isLoading}
        aria-label={`Request food: ${listing.foodName}`}
        onClick={() => void request()}
      >
        Request food
      </Button>
    )
  }

  return (
    <Card className="h-full rounded-2xl border-border shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_22px_rgb(30_42_36/0.05)]">
      <div className="flex items-start justify-between gap-3">
        <ListingPhoto photoUrl={listing.photoUrl} className="h-15.5 w-21 shrink-0 rounded-md" />
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <h2 className="mt-3 mb-0.75 line-clamp-2 text-lg leading-snug wrap-break-word">{listing.foodName}</h2>
      <p className="mb-2.5 text-[13px] text-text-muted">
        {optionLabel(CATEGORIES, listing.category)} · {listing.donorName}
      </p>
      <ul className="mb-3.5 grid gap-1.25 text-[13px] text-text-secondary">
        <Meta icon={<QuantityIcon />}>{formatListingQuantity(listing)}</Meta>
        <Meta icon={<ClockIcon />}>{formatPickup(listing.deadline)}</Meta>
        <Meta icon={<PinIcon />}>{optionLabel(PICKUP_AREAS, listing.pickupArea)}, Lagos</Meta>
      </ul>
      {canRequest && pending && (
        <p className="-mt-1.5 mb-2.5 text-xs font-semibold text-status-pending-text">Requested · waiting for donor</p>
      )}
      <div className={cn('grid gap-2', second ? 'grid-cols-2' : 'grid-cols-1')}>
        <Link
          ref={viewLinkRef}
          to={listingDetailPath(listing.id)}
          onMouseEnter={() => prefetch(listing.id, { ifOlderThan: 30 })}
          onFocus={() => prefetch(listing.id, { ifOlderThan: 30 })}
          aria-label={`View listing: ${listing.foodName}`}
          className={cn(
            CARD_BUTTON,
            'inline-flex items-center justify-center rounded-md border border-border-input bg-surface text-primary hover:bg-surface-hover',
          )}
        >
          View listing
        </Link>
        {second}
      </div>
    </Card>
  )
})
