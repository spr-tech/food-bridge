// The one place API status values map to on-screen words and badge tones.
// TODO: API values are placeholders until agreed with the service (spec section 3).
import type { ListingStatus, RequestStatus, StatusTone } from '@/types/status'

type StatusDisplay = {
  label: string
  tone: StatusTone
}

export const REQUEST_STATUS: Record<RequestStatus, StatusDisplay> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  DECLINED: { label: 'Declined', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
}

export const LISTING_STATUS: Record<ListingStatus, StatusDisplay> = {
  AVAILABLE: { label: 'Available', tone: 'success' },
  RESERVED: { label: 'Reserved', tone: 'info' },
  COLLECTED: { label: 'Collected', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
}
