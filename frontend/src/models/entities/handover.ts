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
