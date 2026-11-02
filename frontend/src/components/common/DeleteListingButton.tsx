// "Delete listing" on the donor's Your listings rows (an icon button) and on Listing
// details (a full button), for the accounts canDeleteListing allows; nothing for anyone
// else. A danger-tone confirmation first: "Delete this listing?", with Cancel focused.
// The service keeps a deleted listing as a record (a soft delete), so the wording says it
// is taken off FoodBridge, not that it is erased. Then:
// - success (204): the toast "Listing deleted"; the listing, the lists and the donor's
//   listings refresh, so the listing leaves the screen only once the service has said so
// - 401: the session ends (sign in again, then back here)
// - 403, 404, 409, 500 or no connection: the dialog stays open with what went wrong, and
//   nothing is removed. A 409 on a Reserved listing says that is why.
// On a Collected listing the button is disabled, with the reason (deleteBlockedReason).
// The service decides who may delete; this button is not the safeguard.
import { useId, useState } from 'react'
import { useSession } from '@/app/session'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { canDeleteListing, deleteBlockedReason } from '@/lib/listing-permissions'
import { errorStatus } from '@/services/errors'
import { useDeleteListing } from '@/services/listings'
import type { Listing } from '@/types/api'

// Thrown to keep the dialog open after a refusal; the message is already on screen.
class NotDeleted extends Error {}

function failureMessage(status: number | string | undefined, listingStatus: Listing['status']): string {
  switch (status) {
    case 403:
      return "You don't have permission to delete this listing."
    case 404:
      return 'This listing no longer exists.'
    case 409:
      if (listingStatus === 'RESERVED') {
        return "A reserved listing can't be deleted, because a recipient is due to collect it. Mark it as collected instead."
      }
      if (listingStatus === 'COLLECTED') {
        return "A collected listing can't be deleted. It stays in your listing history as a record of the handover."
      }
      return 'This listing can no longer be deleted. It may have just been reserved.'
    default:
      return "The listing wasn't deleted. Check your connection and try again."
  }
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

type DeleteListingButtonProps = {
  listing: Listing
  // "icon" for a listing row, "button" for Listing details.
  variant?: 'icon' | 'button'
  // After a confirmed delete, e.g. to leave a page whose listing has gone.
  onDeleted?: () => void
}

export function DeleteListingButton({ listing, variant = 'button', onDeleted }: DeleteListingButtonProps) {
  const session = useSession()
  const [deleteListing] = useDeleteListing()
  const { toast } = useToast()
  const sessionEnded = useSessionEnded()
  const [failure, setFailure] = useState<string | null>(null)
  const reasonId = useId()

  if (!canDeleteListing(session, listing)) return null

  // Offered but disabled, with the reason: for an icon in a row the reason is read out
  // (and shown on hover); under the full button it is shown.
  const blocked = deleteBlockedReason(listing)
  if (blocked) {
    return variant === 'icon' ? (
      <>
        <button
          type="button"
          disabled
          aria-label={`Delete listing: ${listing.foodName}`}
          aria-describedby={reasonId}
          title={blocked}
          className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-lg border border-border bg-surface text-text-muted opacity-50"
        >
          <TrashIcon />
        </button>
        <span id={reasonId} className="sr-only">
          {blocked}
        </span>
      </>
    ) : (
      <div className="flex flex-col items-end gap-1.5">
        <Button variant="danger" disabled aria-label={`Delete listing: ${listing.foodName}`} aria-describedby={reasonId}>
          <TrashIcon />
          Delete listing
        </Button>
        <p id={reasonId} className="text-right text-[12.5px] text-text-muted md:text-[13px]">
          {blocked}
        </p>
      </div>
    )
  }

  async function confirmDelete(): Promise<void> {
    setFailure(null)
    try {
      await deleteListing(listing.id).unwrap()
    } catch (error) {
      const status = errorStatus(error)
      if (status === 401) {
        void sessionEnded()
        return
      }
      setFailure(failureMessage(status, listing.status))
      throw new NotDeleted()
    }
    toast({ variant: 'success', title: 'Listing deleted' })
    onDeleted?.()
  }

  const label = `Delete listing: ${listing.foodName}`
  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        aria-label={label}
        title="Delete listing"
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-hover text-danger transition-colors hover:border-danger hover:bg-danger hover:text-on-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <TrashIcon />
      </button>
    ) : (
      <Button variant="danger" aria-label={label}>
        <TrashIcon />
        Delete listing
      </Button>
    )

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Delete this listing?"
      description={`${listing.foodName} will be taken off FoodBridge: it leaves your listings and recipients can no longer find or request it. You can't undo this.`}
      confirmLabel="Delete listing"
      tone="danger"
      onConfirm={confirmDelete}
      onOpenChange={(open) => {
        if (open) setFailure(null)
      }}
    >
      {failure && (
        <p role="alert" className="rounded-lg border border-danger bg-danger/10 p-3 text-danger">
          {failure}
        </p>
      )}
    </ConfirmDialog>
  )
}
