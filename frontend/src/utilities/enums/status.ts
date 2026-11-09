// Status values as the API sends them, and the badge tones they map to.
// TODO: API values are TBC with the service engineers (spec section 3).
// REVERSED: the approved request's handover was undone (PATCH /api/handovers/{id}/reverse);
// the service puts its listing back to AVAILABLE.
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED' | 'REVERSED'

// DELETED: the service keeps a deleted listing (a soft delete). It leaves it out of donors'
// and recipients' lists but not an administrator's (with no status filter, or Expired),
// and still returns it by id to its donor, an administrator and its requesters.
// REVERSED: a listing whose handover was undone before the service changed reversal to
// reopen the listing (it now marks the request REVERSED instead). Such listings can still
// be returned; the service treats them as closed: no request, edit or delete.
export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'COLLECTED' | 'REVERSED' | 'EXPIRED' | 'DELETED'

export type StatusTone = 'success' | 'warning' | 'info' | 'neutral'

// Backend API types — based on Esther's latest Swagger contract.

export type BackendListingState =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'COLLECTED'
  | 'REVERSED'
  | 'EXPIRED'
  | 'DELETED'

export type BackendRequestState =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REVERSED'
