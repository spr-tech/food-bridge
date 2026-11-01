import type { ListingStatus, RequestStatus } from '@/types/status'

export function getRecipientRequestStatus(
  requestStatus: RequestStatus,
  listingStatus: ListingStatus,
): RequestStatus {
  if (requestStatus !== 'PENDING') return requestStatus

  if (listingStatus === 'EXPIRED') return 'EXPIRED'

  if (listingStatus === 'RESERVED' || listingStatus === 'COLLECTED') {
    return 'DECLINED'
  }

  return 'PENDING'
}