// Status values as the API sends them, and the badge tones they map to.
// TODO: API values are TBC with the service engineers (spec section 3).
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED'

// DELETED: the service keeps a deleted listing (a soft delete). It leaves it out of every
// list, but still returns it by id to its donor, an administrator and its requesters.
export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'COLLECTED' | 'EXPIRED' | 'DELETED'

export type StatusTone = 'success' | 'warning' | 'info' | 'neutral'
