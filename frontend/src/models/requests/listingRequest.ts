import type { ListingStatus } from '@/utilities/enums/status'

// Backend API types — based on Esther's latest Swagger contract.

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

export type ListingFilters = {
  q?: string
  category?: string
  area?: string
  status?: ListingStatus | 'all'
  limit?: number
}
