// Backend API types — based on Esther's latest Swagger contract.

// GET /api/admin/distribution/today. The daily fairness rule's progress, counted in Lagos.
export type BackendDailyDistributionSummary = {
  totalRecipients: number
  availableListings: number
  approvedListingsToday: number
  recipientsServedToday: number
  recipientsWaitingToday: number
  firstRoundInProgress: boolean
}
