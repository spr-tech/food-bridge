// One request in the donor's panel (spec S5), laid out like the request cards in
// 5-donor-requests and m5: the organisation's initials, its name and the status badge,
// its area and when it asked, its note, and on a Pending request Approve and Decline,
// each behind the spec's confirmation. Approve and Decline are 160px wide on desktop and
// split the card's width on a phone. The row can take focus (tabIndex -1), so the panel
// can move focus to it when its buttons go.
import { forwardRef } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { optionLabel, PICKUP_AREAS } from '@/constants/listingOptions'
import { formatListingQuantity, formatRequested, initials } from '@/lib/format'
import type { Listing, ListingRequest } from '@/types/api'

// "The other 2 pending requests will be declined.", in the singular for one, left out for none.
function othersLine(count: number): string {
  if (count === 0) return ''
  if (count === 1) return ' The other pending request will be declined.'
  return ` The other ${count} pending requests will be declined.`
}

type RequestRowProps = {
  request: ListingRequest
  listing: Listing
  // Pending requests on the listing other than this one, for the approve dialog.
  otherPending: number
  onApprove: () => void
  onDecline: () => Promise<void>
}

export const RequestRow = forwardRef<HTMLDivElement, RequestRowProps>(function RequestRow(
  { request, listing, otherPending, onApprove, onDecline },
  ref,
) {
  const name = request.recipientName
  const area = optionLabel(PICKUP_AREAS, request.recipientArea)

  return (
    <Card
      ref={ref}
      tabIndex={-1}
      // 16px corners over the shared Card's own; md padding tops its 16px up to 18px 20px.
      className="rounded-2xl! border-border shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_22px_rgb(30_42_36/0.05)] md:px-1 md:py-0.5"
    >
      <div className="flex items-start gap-3 md:gap-4">
        <span aria-hidden="true" className="grid size-9.5 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-bold text-on-primary md:size-10.5">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 font-sans text-[15px] font-bold wrap-break-word">{name}</h3>
            <StatusBadge kind="request" status={request.status} />
          </div>
          <p className="mt-0.5 text-[12.5px] text-text-muted md:text-[13px]">
            {area ? `${area}, Lagos · ` : ''}
            {formatRequested(request.createdAt)}
          </p>
        </div>
      </div>

      {request.note && (
        <p className="mt-2.5 text-[13.5px] wrap-break-word text-text-body md:ml-14.5 md:mt-2">“{request.note}”</p>
      )}

      {request.status === 'PENDING' && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:ml-14.5 md:flex md:mt-3.5">
          <ConfirmDialog
            trigger={
              <Button aria-label={`Approve: ${name}`} className="h-10.5 font-bold md:h-10 md:w-40">
                Approve
              </Button>
            }
            title="Approve this request?"
            description={`${name} will be the only recipient for ${listing.foodName} (${formatListingQuantity(listing)}).${othersLine(otherPending)}`}
            confirmLabel="Approve request"
            // The panel changes at once (the optimistic update), so the dialog closes at once.
            onConfirm={onApprove}
          />
          <ConfirmDialog
            trigger={
              <Button variant="secondary" aria-label={`Decline: ${name}`} className="h-10.5 bg-surface font-bold hover:bg-surface-hover md:h-10 md:w-40">
                Decline
              </Button>
            }
            title="Decline this request?"
            description={`${name} will be told their request was declined.`}
            confirmLabel="Decline request"
            onConfirm={onDecline}
          />
        </div>
      )}
    </Card>
  )
})
