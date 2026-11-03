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

// Shown on the recipient's request for as long as it is on screen. It says only what the
// data shows: this request wasn't approved, and the listing has moved on. It gives no reason,
// because the service sends none: a donor may have approved someone else, or declined this
// request by hand first.
export const REQUEST_NOT_APPROVED =
  'This request was not approved. The food listing is no longer available for requests.'

// Whether to show REQUEST_NOT_APPROVED: this request is Pending (as the service may leave it)
// or Declined, and its listing is Reserved or Collected, so it can't be requested any more.
// Expired and Deleted listings have their own explanations, and a Declined request on a
// listing that is still Available shows its Declined status only.
export function wasNotApprovedAndListingClosed(
  requestStatus: RequestStatus,
  listingStatus: ListingStatus,
): boolean {
  return (
    (requestStatus === 'PENDING' || requestStatus === 'DECLINED') &&
    (listingStatus === 'RESERVED' || listingStatus === 'COLLECTED')
  )
}
