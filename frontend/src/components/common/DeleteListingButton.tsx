// "Delete listing" on the donor's Your listings rows (an icon button) and on Listing
// details (a full button), for the accounts canDeleteListing allows; nothing for anyone
// else. A danger-tone confirmation first: "Delete this listing?", with Cancel focused.
// Then:
// - success (204): the toast "Listing deleted"; the listing, the lists and the donor's
//   listings refresh, so the listing leaves the screen only once the service has said so
// - 401: the session ends (sign in again, then back here)
// - 403, 404, 409, 500 or no connection: the dialog stays open with what went wrong, and
//   nothing is removed
// The service decides who may delete; this button is not the safeguard.
import { useState } from 'react'
import { useSession } from '@/app/session'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { canDeleteListing } from '@/lib/listing-permissions'
import { errorStatus } from '@/services/errors'
import { useDeleteListing } from '@/services/listings'
import type { Listing } from '@/types/api'

// Thrown to keep the dialog open after a refusal; the message is already on screen.
class NotDeleted extends Error {}

function failureMessage(status: number | string | undefined): string {
  switch (status) {
    case 403:
      return "You don't have permission to delete this listing."
    case 404:
      return 'This listing no longer exists.'
    case 409:
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

  if (!canDeleteListing(session, listing)) return null

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
      setFailure(failureMessage(status))
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
      description={`${listing.foodName} will be removed for good, with any requests made for it. You can't undo this.`}
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
