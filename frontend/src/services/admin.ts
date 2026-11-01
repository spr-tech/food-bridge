// Admin dashboard statistics.
// Screens use this hook; the endpoint handles live and simulated data.
import * as db from '@/mocks/db'
import { simulate } from '@/mocks/simulate'
import { api, LIST_QUERY_OPTIONS } from '@/services/api'
import { env } from '@/config/env'

type BackendAdminDashboardResponse = {
  totalUsers: number
  totalDonors: number
  totalRecipients: number
  totalListings: number
  availableListings: number
  reservedListings: number
  collectedListings: number
  totalRequests: number
  pendingRequests: number
  completedHandovers: number
}

// Only the fields currently displayed by the administrator's dashboard.
export type AdminDashboardSummary = Pick<
  BackendAdminDashboardResponse,
  | 'totalListings'
  | 'availableListings'
  | 'reservedListings'
  | 'collectedListings'
  | 'pendingRequests'
  | 'completedHandovers'
>

const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    // -----------------------------------------------------------------------
    // GET /api/admin/dashboard
    // Get platform-wide dashboard statistics.
    // -----------------------------------------------------------------------
    getAdminDashboard: build.query<AdminDashboardSummary, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) {
          const result = await simulate(
            (actor) =>
              db.listListings(actor, {
                status: 'all',
                limit: 1000,
              }),
            () => ({ items: [], total: 0 }),
          )

          if ('error' in result) return { error: result.error }

          const listings = result.data.items
          const collected = listings.filter(
            (listing) => listing.status === 'COLLECTED',
          )

          return {
            data: {
              totalListings: result.data.total,
              availableListings: listings.filter(
                (listing) => listing.status === 'AVAILABLE',
              ).length,
              reservedListings: listings.filter(
                (listing) => listing.status === 'RESERVED',
              ).length,
              collectedListings: collected.length,
              pendingRequests: listings.reduce(
                (total, listing) => total + listing.pendingRequestCount,
                0,
              ),
              completedHandovers: collected.length,
            },
          }
        }

        const result = await baseQuery({
          url: '/api/admin/dashboard',
        })

        if (result.error) return { error: result.error }

        return {
          data: result.data as AdminDashboardSummary,
        }
      },

      providesTags: [
        { type: 'Listing', id: 'LIST' },
        { type: 'Request', id: 'LIST' },
      ],
    }),
  }),
})

export function useAdminDashboard() {
  return adminApi.useGetAdminDashboardQuery(undefined, LIST_QUERY_OPTIONS)
}