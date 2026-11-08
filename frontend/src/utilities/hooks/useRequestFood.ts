
import { useCallback, useState } from 'react'
import { useToast } from '@/components/ui/toast/toast'
import { useIdempotencyKey } from '@/utilities/hooks/useIdempotencyKey'
import { useSessionEnded } from '@/utilities/hooks/useSessionEnded'
import { errorCode, errorStatus } from '@/utilities/helpers/apiErrors'
import { useCreateRequest } from '@/services/requests'

const EXPIRED_WHILE_REQUESTING =
  'This listing expired before your request was saved.'

// The service's refusals that a retry can't change, so they offer no Try again.
// 409 LISTING_ALREADY_RESERVED: the listing is no longer Available (reserved, collected).
const ALREADY_RESERVED =
  'This food has just been reserved by another organisation.'
// 404 LISTING_NOT_FOUND: the listing was deleted.
const NO_LONGER_LISTED = 'This listing is no longer available.'
// 403 FORBIDDEN: only recipient accounts may request food.
const NOT_ALLOWED = "Your account can't request food."

const NOT_SENT = "Your request wasn't sent. Try again."

export function useRequestFood(listingId: string, onSent?: () => void) {
  const [createRequest, { isLoading }] = useCreateRequest()
  const [requestSent, setRequestSent] = useState(false)

  const { getKey, reset } = useIdempotencyKey()
  const { toast } = useToast()
  const sessionEnded = useSessionEnded()

  const request = useCallback((): Promise<void> => {
    async function send(): Promise<void> {
      try {
        await createRequest({
          listingId,
          idempotencyKey: getKey(),
        }).unwrap()

        // Immediately preserve the successful request state.
        // Do not wait for GET /api/requests to refresh.
        setRequestSent(true)

        reset()

        toast({
          variant: 'success',
          title: 'Request sent',
        })

        onSent?.()
      } catch (error) {
        const code = errorCode(error)
        const status = errorStatus(error)

        if (status === 401) {
          void sessionEnded()
        } else if (code === 'LISTING_EXPIRED') {
          reset()
          toast({
            variant: 'error',
            title: EXPIRED_WHILE_REQUESTING,
          })
        } else if (code === 'ALREADY_REQUESTED') {
          // Not sent by the service yet (it allows a second request); kept for when the
          // backend adds it: this recipient already has a request on this listing.
          setRequestSent(true)
          reset()
        } else if (code === 'LISTING_ALREADY_RESERVED') {
          // The mutation's tags refetch the listing, so its new status shows.
          reset()
          toast({ variant: 'error', title: ALREADY_RESERVED })
        } else if (code === 'LISTING_NOT_FOUND' || status === 404) {
          reset()
          toast({ variant: 'error', title: NO_LONGER_LISTED })
        } else if (code === 'FORBIDDEN' || status === 403) {
          reset()
          toast({ variant: 'error', title: NOT_ALLOWED })
        } else {
          // Keep the same idempotency key for a retry.
          toast({
            variant: 'error',
            title: NOT_SENT,
            action: {
              label: 'Try again',
              onClick: () => void send(),
            },
          })
        }
      }
    }

    return send()
  }, [
    createRequest,
    listingId,
    getKey,
    reset,
    toast,
    sessionEnded,
    onSent,
  ])

  return {
    request,
    isLoading,
    isRequested: requestSent,
  }
}
