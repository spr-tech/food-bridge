// Admin dashboard statistics, today's distribution, every request, recent activity and
// completed handovers. Screens use these hooks; the endpoints handle live and simulated data.
import * as db from '@/mocks/db'
import { simulate } from '@/mocks/simulate'
import { api, LIST_QUERY_OPTIONS } from '@/services/api'
import { env } from '@/config/env'
import {
  mapBackendActivity,
  mapBackendListing,
  mapBackendRequest,
} from '@/services/backend-mappers'
import { readAllPages, SERVICE_PAGE_LIMIT } from '@/services/pages'
import type {
  ActivityEntry,
  AdminRequestFilters,
  BackendActivityResponse,
  BackendDailyDistributionSummary,
  BackendFoodRequest,
  BackendListingResponse,
  CompletedHandover,
  DailyDistribution,
  Listing,
  ListingRequest,
  RequestPage,
} from '@/types/api'

// How far the activity log reaches back (GET /api/activity allows 1 to 100).
const ACTIVITY_REACH = 100

// One row per Collected listing: its approved request names the recipient, and the latest
// COLLECTED activity event on it gives the collection time. Newest collections first; rows
// whose time isn't recorded follow, by collection deadline.
export function joinCompletedHandovers(
  listings: Listing[],
  requests: ListingRequest[],
  activity: ActivityEntry[],
): CompletedHandover[] {
  const collected = listings.filter((listing) => listing.status === 'COLLECTED')

  return collected
    .map((listing) => {
      const approved = requests.find(
        (request) => request.listingId === listing.id && request.status === 'APPROVED',
      )
      const event = activity
        .filter((entry) => entry.listingId === listing.id && entry.type.toUpperCase() === 'COLLECTED')
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]

      return {
        listingId: listing.id,
        foodName: listing.foodName,
        category: listing.category,
        quantity: listing.quantity,
        unit: listing.unit,
        pickupArea: listing.pickupArea,
        photoUrl: listing.photoUrl,
        donorName: listing.donorName,
        recipientName: approved?.recipientName ?? null,
        collectedAt: event?.createdAt ?? null,
        deadline: listing.deadline,
      }
    })
    .sort((a, b) => {
      if (a.collectedAt && b.collectedAt) return Date.parse(b.collectedAt) - Date.parse(a.collectedAt)
      if (a.collectedAt) return -1
      if (b.collectedAt) return 1
      return Date.parse(b.deadline) - Date.parse(a.deadline)
    })
}

type BackendAdminDashboardResponse = {
  totalUsers: number
  totalDonors: number
  totalRecipients: number
  totalListings: number
  availableListings: number
  reservedListings: number
  collectedListings: number
  // EXPIRED listings, and AVAILABLE ones whose deadline has passed but the minute's
  // expiry job hasn't reached yet.
  expiredListings: number
  totalRequests: number
  pendingRequests: number
  completedHandovers: number
  // Portions in completed handovers: a handover's recorded estimate, else the listing's
  // quantity when it is measured in portions. Other units count as 0.
  estimatedPortionsSaved: number
}

// Only the fields currently displayed by the administrator's dashboard.
export type AdminDashboardSummary = Pick<
  BackendAdminDashboardResponse,
  | 'totalListings'
  | 'availableListings'
  | 'reservedListings'
  | 'collectedListings'
  | 'expiredListings'
  | 'pendingRequests'
  | 'completedHandovers'
  | 'estimatedPortionsSaved'
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
              expiredListings: listings.filter(
                (listing) => listing.status === 'EXPIRED',
              ).length,
              pendingRequests: listings.reduce(
                (total, listing) => total + listing.pendingRequestCount,
                0,
              ),
              completedHandovers: collected.length,
              // As the service estimates it, without recorded estimates.
              estimatedPortionsSaved: collected
                .filter((listing) => listing.unit.toUpperCase() === 'PORTIONS')
                .reduce((total, listing) => total + Math.round(listing.quantity), 0),
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

    // -----------------------------------------------------------------------
    // Completed handovers, from three documented reads (there is no handover
    // endpoint to list them): GET /api/listings?availability=COLLECTED, every page;
    // GET /api/admin/requests, every page, for each listing's approved request; and
    // GET /api/activity?limit=100 for the COLLECTED event's time. Activity is
    // optional: if it fails, the rows show without a collection time.
    // -----------------------------------------------------------------------
    getCompletedHandovers: build.query<CompletedHandover[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) {
          return simulate((actor) => {
            const listings = db.listListings(actor, { status: 'COLLECTED', limit: 1000 }).items
            const requests: ListingRequest[] = []
            for (let offset = 0; ; offset += SERVICE_PAGE_LIMIT) {
              const page = db.listAllRequests(actor, { offset, limit: SERVICE_PAGE_LIMIT })
              requests.push(...page.items)
              if (requests.length >= page.total || page.items.length === 0) break
            }
            const activity = db.listActivity(actor, ACTIVITY_REACH)
            return joinCompletedHandovers(listings, requests, activity)
          }, () => [])
        }

        const listings = await readAllPages<BackendListingResponse>(baseQuery, '/api/listings', {
          availability: 'COLLECTED',
        })
        if ('error' in listings) return { error: listings.error }
        if (listings.data.length === 0) return { data: [] }

        const requests = await readAllPages<BackendFoodRequest>(baseQuery, '/api/admin/requests')
        if ('error' in requests) return { error: requests.error }

        const activity = await baseQuery({ url: '/api/activity', params: { limit: ACTIVITY_REACH } })
        const activityRows =
          !activity.error && Array.isArray(activity.data)
            ? (activity.data as BackendActivityResponse[]).map(mapBackendActivity)
            : []

        return {
          data: joinCompletedHandovers(
            listings.data.map(mapBackendListing),
            requests.data.map((request) => mapBackendRequest(request)),
            activityRows,
          ),
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

export function useDistributionToday() {
  return adminApi.useGetDistributionTodayQuery(undefined, LIST_QUERY_OPTIONS)
}

export function useAdminRequests(filters: AdminRequestFilters = {}) {
  return adminApi.useGetAdminRequestsQuery(filters, LIST_QUERY_OPTIONS)
}

export function useRecentActivity(limit = 20) {
  return adminApi.useGetRecentActivityQuery(limit, LIST_QUERY_OPTIONS)
}

export function useCompletedHandovers() {
  return adminApi.useGetCompletedHandoversQuery(undefined, LIST_QUERY_OPTIONS)
}
