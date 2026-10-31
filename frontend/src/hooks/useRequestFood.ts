
import { useCallback, useState } from 'react'
import { useToast } from '@/components/ui/toast'
import { useIdempotencyKey } from '@/hooks/useIdempotencyKey'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { errorCode, errorStatus } from '@/services/errors'
import { useCreateRequest } from '@/services/requests'

const EXPIRED_WHILE_REQUESTING =
  'This listing expired before your request was saved.'

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

        if (errorStatus(error) === 401) {
          void sessionEnded()
        } else if (code === 'LISTING_EXPIRED') {
          reset()
          toast({
            variant: 'error',
            title: EXPIRED_WHILE_REQUESTING,
          })
        } else if (code === 'ALREADY_REQUESTED') {
          // The backend confirms that this recipient
          // already has a request on this listing.
          setRequestSent(true)
          reset()
        } else if (code === 'LISTING_NOT_AVAILABLE') {
          reset()
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
