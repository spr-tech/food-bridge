// One listing on Find food (spec S3, 3b-find-food-sidebar-light, m3): thumbnail, status
// badge, food name, category and donor, quantity, pickup time and area, then "View
// listing" and "Request food" side by side.
// The second button by situation: Request food (available); Requested, with "Requested ·
// waiting for donor" while pending; Reserved; Expired; Collected. Administrators can't
// request, so they get View listing only.
// Requesting follows S4's rules: one idempotency key per press, reused on Try again.
import { forwardRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { CATEGORIES, PICKUP_AREAS, UNITS } from '@/constants/listingOptions'
import { listingDetailPath } from '@/constants/routes'
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { cn } from '@/lib/cn'
import { formatPickup, formatQuantity } from '@/lib/format'
import { errorCode, errorStatus } from '@/services/errors'
import { usePrefetchListing } from '@/services/listings'
import { useCreateRequest } from '@/services/requests'
import type { Listing, ListingRequest } from '@/types/api'

const EXPIRED_WHILE_REQUESTING = 'This listing expired before your request was saved.'
const NOT_SENT = "Your request wasn't sent. Try again."

const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value

function quantityOf(listing: Listing): string {
  const unit = UNITS.find((option) => option.value === listing.unit)
  return unit ? formatQuantity(listing.quantity, unit) : `${listing.quantity} ${listing.unit}`
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="shrink-0">
        {icon}
      </svg>
      {children}
    </li>
  )
}

function Thumbnail({ photoUrl }: { photoUrl: string | null }) {
  const box = 'h-15.5 w-21 shrink-0 rounded-md'
  if (photoUrl) return <img src={photoUrl} alt="" className={cn(box, 'object-cover')} />
  return (
    // The placeholder the spec asks for when there's no photo.
    <div aria-hidden="true" className={cn(box, 'flex items-center justify-center bg-surface-hover text-text-muted')}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" focusable="false">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 16-5-5-9 9" />
      </svg>
    </div>
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
  const [createRequest, { isLoading }] = useCreateRequest()
  const { getKey, reset } = useIdempotencyKey()
  const { toast } = useToast()
  const sessionEnded = useSessionEnded()
  const prefetch = usePrefetchListing()

  async function request() {
    try {
      await createRequest({ listingId: listing.id, idempotencyKey: getKey() }).unwrap()
      reset()
      toast({ variant: 'success', title: 'Request sent' })
    } catch (error) {
      const code = errorCode(error)
      if (errorStatus(error) === 401) {
        void sessionEnded()
      } else if (code === 'LISTING_EXPIRED') {
        // The lists refresh after any request, so the card turns to Expired.
        reset()
        toast({ variant: 'error', title: EXPIRED_WHILE_REQUESTING })
      } else if (code === 'ALREADY_REQUESTED' || code === 'LISTING_NOT_AVAILABLE') {
        // Already settled elsewhere; the refreshed card shows Requested or Reserved.
        reset()
      } else {
        // Try again reuses the same key, so a request that did reach the service records once.
        toast({ variant: 'error', title: NOT_SENT, action: { label: 'Try again', onClick: () => void request() } })
      }
    }
  }

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
        <Thumbnail photoUrl={listing.photoUrl} />
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <h2 className="mt-3 mb-0.75 line-clamp-2 text-lg leading-snug wrap-break-word">{listing.foodName}</h2>
      <p className="mb-2.5 text-[13px] text-text-muted">
        {labelOf(CATEGORIES, listing.category)} · {listing.donorName}
      </p>
      <ul className="mb-3.5 grid gap-1.25 text-[13px] text-text-secondary">
        <Meta icon={<><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>}>
          {quantityOf(listing)}
        </Meta>
        <Meta icon={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}>{formatPickup(listing.deadline)}</Meta>
        <Meta icon={<><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>}>
          {labelOf(PICKUP_AREAS, listing.pickupArea)}, Lagos
        </Meta>
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
