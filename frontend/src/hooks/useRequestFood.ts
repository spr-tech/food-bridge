// Requesting a listing, from a Find food card (S3) or the listing's page (S4), with the
// same rules in both: one idempotency key per press, reused on Try again; "Request sent"
// on success; the expired message on a 409 LISTING_EXPIRED (the listing refreshes to
// Expired); "Your request wasn't sent. Try again." when the service fails or can't be
// reached. Returns whether it was sent, so the caller can move focus.
import { useCallback } from 'react'
import { useToast } from '@/components/ui/toast'
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { errorCode, errorStatus } from '@/services/errors'
import { useCreateRequest } from '@/services/requests'

const EXPIRED_WHILE_REQUESTING = 'This listing expired before your request was saved.'
const NOT_SENT = "Your request wasn't sent. Try again."

export function useRequestFood(listingId: string, onSent?: () => void) {
  const [createRequest, { isLoading }] = useCreateRequest()
  const { getKey, reset } = useIdempotencyKey()
  const { toast } = useToast()
  const sessionEnded = useSessionEnded()

  const request = useCallback((): Promise<void> => {
    async function send(): Promise<void> {
      try {
        await createRequest({ listingId, idempotencyKey: getKey() }).unwrap()
        reset()
        toast({ variant: 'success', title: 'Request sent' })
        onSent?.()
      } catch (error) {
        const code = errorCode(error)
        if (errorStatus(error) === 401) {
          void sessionEnded()
        } else if (code === 'LISTING_EXPIRED') {
          // Every write refreshes the listing it touches, so it turns to Expired.
          reset()
          toast({ variant: 'error', title: EXPIRED_WHILE_REQUESTING })
        } else if (code === 'ALREADY_REQUESTED' || code === 'LISTING_NOT_AVAILABLE') {
          // Already settled elsewhere; the refreshed listing shows Requested or Reserved.
          reset()
        } else {
          // Try again reuses the same key, so a request that did reach the service records once.
          toast({ variant: 'error', title: NOT_SENT, action: { label: 'Try again', onClick: () => void send() } })
        }
      }
    }
    return send()
  }, [createRequest, listingId, getKey, reset, toast, sessionEnded, onSent])

  return { request, isLoading }
}
