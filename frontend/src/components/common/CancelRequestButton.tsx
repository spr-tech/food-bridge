// "Cancel request" on a recipient's own Pending request (Listing details S4, Your requests
// S7). A danger-tone confirmation first: "Cancel this request?" / "The donor will no
// longer see it.", with Keep request and Cancel request. Then:
// - success: the toast "Request cancelled"; the lists and the listing refresh
// - 409 REQUEST_NOT_PENDING (the donor decided first, or it expired): "This request can no
//   longer be cancelled." The refresh shows its true status.
// - 500 or no connection: "Your request wasn't cancelled. Try again." with Try again.
// The service decides who may cancel (only the recipient who made it, only while Pending);
// callers show this button on the recipient's own Pending requests only.
import { ConfirmDialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { errorCode, errorStatus } from '@/services/errors'
import { useCancelRequest } from '@/services/requests'

const NO_LONGER_PENDING = 'This request can no longer be cancelled.'
const NOT_CANCELLED = "Your request wasn't cancelled. Try again."

type CancelRequestButtonProps = {
  requestId: string
  listingId: string
  // Names the request for screen readers where several share a page: "Cancel request: Agege bread".
  foodName: string
  className?: string
  // After a confirmed cancel, so the caller can move focus off the button, which goes.
  onCancelled?: () => void
}

export function CancelRequestButton({ requestId, listingId, foodName, className, onCancelled }: CancelRequestButtonProps) {
  const [cancelRequest] = useCancelRequest()
  const { toast } = useToast()
  const sessionEnded = useSessionEnded()

  // Never throws, so the dialog always closes; what happened is said in a toast.
  async function cancel(): Promise<void> {
    try {
      await cancelRequest({ requestId, listingId }).unwrap()
      toast({ variant: 'success', title: 'Request cancelled' })
      onCancelled?.()
    } catch (error) {
      if (errorStatus(error) === 401) {
        void sessionEnded()
      } else if (errorCode(error) === 'REQUEST_NOT_PENDING') {
        toast({ variant: 'error', title: NO_LONGER_PENDING })
      } else {
        toast({ variant: 'error', title: NOT_CANCELLED, action: { label: 'Try again', onClick: () => void cancel() } })
      }
    }
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="secondary" aria-label={`Cancel request: ${foodName}`} className={className}>
          Cancel request
        </Button>
      }
      title="Cancel this request?"
      description="The donor will no longer see it."
      confirmLabel="Cancel request"
      cancelLabel="Keep request"
      tone="danger"
      onConfirm={cancel}
    />
  )
}
