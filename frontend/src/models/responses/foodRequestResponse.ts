import type { BackendRequestState } from '@/utilities/enums/status'

// Backend API types — based on Esther's latest Swagger contract.

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
