
// Shapes the service sends and receives.
// Backend types describe Esther's API contract.
// Frontend types describe the data used by the screens.

import type { Role } from '@/types/role'
import type { ListingStatus, RequestStatus } from '@/types/status'

// ---------------------------------------------------------------------------
// Backend API types — based on Esther's latest Swagger contract.
// ---------------------------------------------------------------------------

export type BackendRole = 'DONOR' | 'RECIPIENT' | 'ADMIN'

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

export type BackendFoodCategory =
  | 'PREPARED_MEALS'
  | 'PRODUCE'
  | 'BAKERY'
  | 'DAIRY'
  | 'PANTRY'
  | 'OTHER'

export type BackendFoodUnit =
  | 'PORTIONS'
  | 'KG'
  | 'LITRES'
  | 'ITEMS'
  | 'BOXES'

export type BackendLoginRequest = {
  email: string
  password: string
}

export type BackendLoginResponse = {
  token: string
  id: string
  name: string
  role: BackendRole
  organisationName: string
  email?: string
}

export type BackendMeResponse = {
  id: string
  name: string
  role: BackendRole
  organisationName: string
  email?: string
}

export type BackendCreateListingRequest = {
  foodName: string
  description: string
  category: string
  quantity: number
  unit: string
  imageReference?: string | null
  pickupArea: string
  collectionDeadline: string
}

export type BackendListingResponse = {
  id: string
  foodName: string
  description: string
  category: string
  quantity: number
  unit: string
  imageReference: string | null
  pickupArea: string
  collectionDeadline: string
  status: BackendListingState | string
  donorId: string
  donorName: string
  createdAt: string
  pendingRequestCount: number
}

export type BackendFoodRequest = {
  id: string
  listingId: string
  recipientId: string
  recipientName: string
  status: BackendRequestState
  createdAt: string
  note?: string | null
  recipientArea?: string
}

// GET /api/admin/distribution/today. The daily fairness rule's progress, counted in Lagos.
export type BackendDailyDistributionSummary = {
  totalRecipients: number
  availableListings: number
  approvedListingsToday: number
  recipientsServedToday: number
  recipientsWaitingToday: number
  firstRoundInProgress: boolean
}

// GET /api/activity. details is a JSON string recorded by the service (often "{}").
export type BackendActivityResponse = {
  id: string
  actorName: string | null
  type: string
  listingId: string | null
  listingTitle: string | null
  details: string | null
  createdAt: string
}

export type BackendErrorResponse = {
  code: string
  message: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Frontend types — used by the application screens.
// ---------------------------------------------------------------------------

export type Session = {
  token: string
  accountId: string
  role: Role
  organisationName: string
  email: string
}

// The signed-in account as GET /api/auth/me describes it: the session without its token.
export type Account = Omit<Session, 'token'>

export type DailyDistribution = BackendDailyDistributionSummary

export type ActivityEntry = {
  id: string
  actorName: string
  type: string
  listingId: string | null
  listingTitle: string | null
  details: string | null
  createdAt: string
}

export type Listing = {
  id: string
  foodName: string
  description: string
  category: string
  quantity: number
  unit: string
  pickupArea: string
  deadline: string
  photoUrl: string | null
  status: ListingStatus
  donorId: string
  donorName: string
  createdAt: string
  pendingRequestCount: number
}

// Listing information displayed inside a recipient's request.
// photoUrl is included so RequestItem can display the food picture.
export type ListingSummary = Pick<
  Listing,
  | 'id'
  | 'foodName'
  | 'quantity'
  | 'unit'
  | 'pickupArea'
  | 'deadline'
  | 'donorName'
  | 'status'
  | 'photoUrl'
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

// One completed handover, put together from documented data: a Collected listing (GET
// /api/listings), its approved request (GET /api/admin/requests) and, when the service's
// recent activity still holds it, the COLLECTED event's time (GET /api/activity). The
// service records no handover id or collection time of its own, so either may be null.
export type CompletedHandover = {
  listingId: string
  foodName: string
  category: string
  quantity: number
  unit: string
  pickupArea: string
  photoUrl: string | null
  donorName: string
  recipientName: string | null
  collectedAt: string | null
  deadline: string
}

export type ListingFilters = {
  q?: string
  category?: string
  area?: string
  status?: ListingStatus | 'all'
  limit?: number
}

export type ListingPage = {
  items: Listing[]
  total: number
}

export type RequestPage = {
  items: ListingRequest[]
  total: number
}

export type AdminRequestFilters = {
  status?: RequestStatus
  offset?: number
  limit?: number
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

// ---------------------------------------------------------------------------
// API error types.
// ---------------------------------------------------------------------------

export type ApiErrorBody = {
  code: string
  message: string
  fields?: Record<string, string>
}
