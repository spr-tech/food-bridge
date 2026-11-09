import type { BackendListingState } from '@/utilities/enums/status'

// Backend API types — based on Esther's latest Swagger contract.

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
  // A soft-deleted listing: status DELETED, with deleted true and the time it was deleted.
  deleted?: boolean
  deletedAt?: string | null
}
