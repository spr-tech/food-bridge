import type { RequestStatus } from '@/utilities/enums/status'

export type AdminRequestFilters = {
  status?: RequestStatus
  offset?: number
  limit?: number
}
