// Backend API types — based on Esther's latest Swagger contract.

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
