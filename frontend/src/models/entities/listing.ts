import type { ListingStatus } from '@/utilities/enums/status'

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

export type ListingPage = {
  items: Listing[]
  total: number
  // Deleted listings the service returned for the Expired filter, kept out of items
  // (see getListings). Absent when there were none.
  deletedReturned?: number
}
