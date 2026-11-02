// What a recipient's request shows, given its listing. The service can leave a request
// PENDING after its listing has moved on (it doesn't decline the others on approval).
import type { ListingStatus, RequestStatus } from '@/types/status'

export function getRecipientRequestStatus(
  requestStatus: RequestStatus,
  listingStatus: ListingStatus,
): RequestStatus {
  if (requestStatus !== 'PENDING') return requestStatus

  // Expired, deleted, or a handover that was reversed: no decision is coming.
  if (listingStatus === 'EXPIRED' || listingStatus === 'DELETED' || listingStatus === 'REVERSED') {
    return 'EXPIRED'
  }

  if (listingStatus === 'RESERVED' || listingStatus === 'COLLECTED') {
    return 'DECLINED'
  }

  return 'PENDING'
}