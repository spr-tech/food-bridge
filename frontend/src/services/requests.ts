// Request workflows. These hooks keep the screens independent of whether data is mocked
// or returned by Esther's live FoodBridge API.
import * as db from '@/mocks/db'
import { simulate, simulateRivalApproval, simulateWrite } from '@/mocks/simulate'
import { api, LIST_QUERY_OPTIONS } from '@/services/api'
import { env } from '@/config/env'
import { mapBackendListing, mapBackendRequest } from '@/services/backend-mappers'
import { listingsApi } from '@/services/listings'
import type { BackendFoodRequest, BackendListingResponse, ListingRequest } from '@/types/api'

const touched = (listingId: string) => [
  { type: 'Request', id: `LISTING-${listingId}` },
  { type: 'Request', id: 'MINE' },
  { type: 'Listing', id: listingId },
  { type: 'Listing', id: 'LIST' },
  { type: 'Listing', id: 'MINE' },
] as const

const requestsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getListingRequests: build.query<ListingRequest[], string>({
      queryFn: async (listingId, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) {
          return simulate((actor) => db.listListingRequests(actor, listingId), () => [])
        }
        const result = await baseQuery({ url: `/api/listings/${encodeURIComponent(listingId)}/requests` })
        if (result.error) return { error: result.error }
        const rows = Array.isArray(result.data) ? result.data as BackendFoodRequest[] : []
        return { data: rows.map((request) => mapBackendRequest(request)) }
      },
      providesTags: (result, _error, listingId) => [
        { type: 'Request', id: `LISTING-${listingId}` },
        ...(result ?? []).map((request) => ({ type: 'Request' as const, id: request.id })),
      ],
    }),

    createRequest: build.mutation<
      ListingRequest,
      { listingId: string; note?: string | null; idempotencyKey: string }
    >({
      queryFn: async (arg, _api, _extraOptions, baseQuery) => {
        const { listingId, idempotencyKey } = arg
        if (env.useMocks) {
          return simulateWrite((actor) => db.createRequest(actor, { listingId, note: arg.note }, idempotencyKey))
        }
        // Current Swagger documents no request body for this endpoint. The optional note
        // is therefore not sent until Esther adds it to the contract.
        const result = await baseQuery({
          url: `/api/listings/${encodeURIComponent(listingId)}/requests`,
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
        })
        if (result.error) return { error: result.error }
        return { data: mapBackendRequest(result.data as BackendFoodRequest) }
      },
      invalidatesTags: (_result, _error, { listingId }) => [...touched(listingId)],
    }),

    decideRequest: build.mutation<
      ListingRequest,
      { requestId: string; listingId: string; decision: 'APPROVED' | 'DECLINED' }
    >({
      queryFn: async ({ requestId, decision }, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) {
          return simulateWrite((actor) => {
            if (decision === 'APPROVED') simulateRivalApproval(requestId)
            return db.decideRequest(actor, { requestId, decision })
          })
        }
        const action = decision === 'APPROVED' ? 'approve' : 'decline'
        const result = await baseQuery({
          url: `/api/requests/${encodeURIComponent(requestId)}/${action}`,
          method: 'PATCH',
        })
        if (result.error) return { error: result.error }
        return { data: mapBackendRequest(result.data as BackendFoodRequest) }
      },
      invalidatesTags: (_result, _error, { listingId }) => [...touched(listingId)],
    }),

    cancelRequest: build.mutation<ListingRequest, { requestId: string; listingId: string }>({
      queryFn: async ({ requestId }, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) {
          return simulateWrite((actor) => db.cancelRequest(actor, { requestId }))
        }
        const result = await baseQuery({
          url: `/api/requests/${encodeURIComponent(requestId)}/cancel`,
          method: 'POST',
        })
        if (result.error) return { error: result.error }
        return { data: mapBackendRequest(result.data as BackendFoodRequest) }
      },
      invalidatesTags: (_result, _error, { listingId }) => [...touched(listingId)],
    }),

    // PATCH /api/requests/{requestId}/collected. The donor records the handover. The
    // service's reply is untyped in the contract, so it is not used: the screen refetches.
    markCollected: build.mutation<void, { requestId: string; listingId: string }>({
      queryFn: async ({ requestId }, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) {
          return simulateWrite((actor) => db.markCollected(actor, { requestId }))
        }
        const result = await baseQuery({
          url: `/api/requests/${encodeURIComponent(requestId)}/collected`,
          method: 'PATCH',
        })
        if (result.error) return { error: result.error }
        return { data: undefined }
      },
      invalidatesTags: (_result, _error, { listingId }) => [...touched(listingId)],
    }),

    getMyRequests: build.query<ListingRequest[], void>({
      queryFn: async (_arg, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) return simulate((actor) => db.listMyRequests(actor), () => [])
        const result = await baseQuery({ url: '/api/requests', params: { mine: true } })
        if (result.error) return { error: result.error }
        const rows = Array.isArray(result.data) ? result.data as BackendFoodRequest[] : []
        // The current API response contains only request fields. Fetch each listing to
        // supply the summary required by the existing Your Requests screen. Esther's
        // planned enriched response will let us remove these extra calls.
        const enriched = await Promise.all(rows.map(async (request) => {
          const detail = await baseQuery({ url: `/api/listings/${encodeURIComponent(request.listingId)}` })
          const listing = detail.error || !detail.data
            ? undefined
            : mapBackendListing(detail.data as BackendListingResponse)
          return mapBackendRequest(request, listing)
        }))
        return { data: enriched }
      },
      providesTags: (result) => [
        { type: 'Request', id: 'MINE' },
        ...(result ?? []).map((request) => ({ type: 'Request' as const, id: request.id })),
      ],
    }),
  }),
})

requestsApi.enhanceEndpoints({
  endpoints: {
    decideRequest: {
      async onQueryStarted({ requestId, listingId, decision }, { dispatch, queryFulfilled }) {
        if (decision !== 'APPROVED') return
        const patches = [
          dispatch(
            requestsApi.util.updateQueryData('getListingRequests', listingId, (draft) => {
              for (const request of draft) {
                if (request.id === requestId) request.status = 'APPROVED'
                else if (request.status === 'PENDING') request.status = 'DECLINED'
              }
              draft.sort((a, b) => Number(b.status === 'APPROVED') - Number(a.status === 'APPROVED'))
            }),
          ),
          dispatch(
            listingsApi.util.updateQueryData('getListing', listingId, (draft) => {
              draft.status = 'RESERVED'
              draft.pendingRequestCount = 0
            }),
          ),
        ]
        try {
          await queryFulfilled
        } catch {
          for (const patch of patches.reverse()) patch.undo()
        }
      },
    },
  },
})

type QueryOptions = { skip?: boolean }

export function useListingRequests(listingId: string, options: QueryOptions = {}) {
  return requestsApi.useGetListingRequestsQuery(listingId, { ...LIST_QUERY_OPTIONS, ...options })
}

export const useCreateRequest = requestsApi.useCreateRequestMutation
export const useDecideRequest = requestsApi.useDecideRequestMutation
export const useCancelRequest = requestsApi.useCancelRequestMutation
export const useMarkCollected = requestsApi.useMarkCollectedMutation

export function useMyRequests(options: QueryOptions = {}) {
  return requestsApi.useGetMyRequestsQuery(undefined, { ...LIST_QUERY_OPTIONS, ...options })
}

// ---------------------------------------------------------------------------
// Explanation
// - Your requests now asks GET /api/requests?mine=true, because the contract's mine
//   parameter defaults to false.
// - decideRequest no longer destructures an unused listingId inside queryFn; the cache
//   update below still uses it.$\n// ---------------------------------------------------------------------------$\n// Explanation$\n// markCollected calls PATCH /api/requests/{requestId}/collected (live) or the mock above.$\n// The reply is an untyped map in the contract, so it is ignored; the tags refetch the data.$\n// useMarkCollected is the hook the donor's panel uses.$\n