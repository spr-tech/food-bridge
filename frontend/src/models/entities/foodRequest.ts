import type { ListingSummary } from '@/models/entities/listing'
import type { RequestStatus } from '@/utilities/enums/status'

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

export type RequestPage = {
  items: ListingRequest[]
  total: number
}
