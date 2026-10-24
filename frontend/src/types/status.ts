// Status values as the API sends them, and the badge tones they map to.
// TODO: API values are TBC with the service engineers (spec section 3).
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED'

export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'COLLECTED' | 'EXPIRED'

export type StatusTone = 'success' | 'warning' | 'info' | 'neutral'
