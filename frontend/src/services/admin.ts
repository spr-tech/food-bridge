// Admin dashboard statistics, today's distribution, every request and recent activity.
// Screens use these hooks; the endpoints handle live and simulated data.
import * as db from '@/mocks/db'
import { simulate } from '@/mocks/simulate'
import { api, LIST_QUERY_OPTIONS } from '@/services/api'
import { env } from '@/config/env'
import { mapBackendActivity, mapBackendRequest } from '@/services/backend-mappers'
import type {
  ActivityEntry,
  AdminRequestFilters,
  BackendActivityResponse,
  BackendDailyDistributionSummary,
  BackendFoodRequest,
  DailyDistribution,
  RequestPage,
} from '@/types/api'

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

    // -----------------------------------------------------------------------
    // GET /api/admin/distribution/today
    // Progress of the daily fairness rule (Lagos day). Administrators only.
    // -----------------------------------------------------------------------
    getDistributionToday: build.query<DailyDistribution, void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) return simulate((actor) => db.distributionToday(actor))

        const result = await baseQuery({ url: '/api/admin/distribution/today' })
        if (result.error) return { error: result.error }

        return { data: result.data as BackendDailyDistributionSummary }
      },
      providesTags: [
        { type: 'Listing', id: 'LIST' },
        { type: 'Request', id: 'LIST' },
      ],
    }),

    // -----------------------------------------------------------------------
    // GET /api/admin/requests?status=&offset=0&limit=50
    // Every request on the platform, a page at a time (limit 100 at most); the
    // total is in X-Total-Count. Administrators only. The rows carry no listing
    // summary, so each request's listing shows only its id until one is added.
    // -----------------------------------------------------------------------
    getAdminRequests: build.query<RequestPage, AdminRequestFilters>({
      queryFn: async (filters, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) {
          return simulate(
            (actor) => db.listAllRequests(actor, filters),
            () => ({ items: [], total: 0 }),
          )
        }

        const result = await baseQuery({
          url: '/api/admin/requests',
          params: {
            ...(filters.status ? { status: filters.status } : {}),
            offset: filters.offset ?? 0,
            limit: filters.limit ?? 50,
          },
        })
        if (result.error) return { error: result.error }

        const rows = Array.isArray(result.data) ? (result.data as BackendFoodRequest[]) : []
        const items = rows.map((request) => mapBackendRequest(request))
        const headerTotal = Number(result.meta?.response?.headers.get('x-total-count') ?? NaN)

        return {
          data: { items, total: Number.isFinite(headerTotal) ? headerTotal : items.length },
        }
      },
      providesTags: (result) => [
        { type: 'Request', id: 'LIST' },
        ...(result?.items ?? []).map((request) => ({ type: 'Request' as const, id: request.id })),
      ],
    }),

    // -----------------------------------------------------------------------
    // GET /api/activity?limit=20
    // The latest platform activity, newest first (limit 1 to 100). The service
    // allows administrators only.
    // -----------------------------------------------------------------------
    getRecentActivity: build.query<ActivityEntry[], number>({
      queryFn: async (limit, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) return simulate((actor) => db.listActivity(actor, limit), () => [])

        const result = await baseQuery({ url: '/api/activity', params: { limit } })
        if (result.error) return { error: result.error }

        const rows = Array.isArray(result.data) ? (result.data as BackendActivityResponse[]) : []
        return { data: rows.map(mapBackendActivity) }
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

export function useDistributionToday() {
  return adminApi.useGetDistributionTodayQuery(undefined, LIST_QUERY_OPTIONS)
}

export function useAdminRequests(filters: AdminRequestFilters = {}) {
  return adminApi.useGetAdminRequestsQuery(filters, LIST_QUERY_OPTIONS)
}

export function useRecentActivity(limit = 20) {
  return adminApi.useGetRecentActivityQuery(limit, LIST_QUERY_OPTIONS)
}
