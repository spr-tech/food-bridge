// Shapes the service sends and receives. Written from the spec until openapi.yaml exists;
// when it does, these must match it (and it wins if they differ).
import type { Role } from '@/types/role'
import type { ListingStatus, RequestStatus } from '@/types/status'

export type Session = {
  token: string
  accountId: string
  role: Role
  organisationName: string
  email: string
}

export type Listing = {
  id: string
  foodName: string
  description: string
  // Values from constants/listingOptions.ts (lists TBC, spec S2).
  category: string
  quantity: number
  unit: string
  pickupArea: string
  // ISO 8601 with the Lagos offset, e.g. "2026-10-26T19:00:00+01:00".
  deadline: string
  photoUrl: string | null
  status: ListingStatus
  donorId: string
  donorName: string
  createdAt: string
  // Pending requests on this listing (the donor's "3 requests waiting").
  pendingRequestCount: number
}

// What a request shows about its listing, so Your requests needs no second call.
export type ListingSummary = Pick<
  Listing,
  'id' | 'foodName' | 'quantity' | 'unit' | 'pickupArea' | 'deadline' | 'donorName' | 'status'
>

export type ListingRequest = {
  id: string
  listingId: string
  listing: ListingSummary
  recipientId: string
  recipientName: string
  recipientArea: string
  note: string | null
  status: RequestStatus
  createdAt: string
}

export type ListingFilters = {
  q?: string
  category?: string
  area?: string
  // 'all' shows every status.
  status?: ListingStatus | 'all'
  // How many to return; "Load more" asks for 12 more each time.
  limit?: number
}

export type ListingPage = {
  items: Listing[]
  total: number
}

export type CreateListingInput = {
  foodName: string
  description: string
  category: string
  quantity: number
  unit: string
  pickupArea: string
  deadline: string
  photoUrl: string | null
}

// The body of every error the service returns.
export type ApiErrorBody = {
  code: string
  message: string
  // Field name to message, on 400 validation errors.
  fields?: Record<string, string>
}
