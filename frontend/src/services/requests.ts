// Requests: make, approve or decline, cancel, and the lists for donors and recipients.
// Screens use these hooks only. Every write refreshes the listing it touches, the lists
// and the navigation counts.
import * as db from '@/mocks/db'
import { simulate } from '@/mocks/simulate'
import { api, LIST_QUERY_OPTIONS } from '@/services/api'
import type { ListingRequest } from '@/types/api'

// What changes when a request on this listing changes.
const touched = (listingId: string) =>
  [
    { type: 'Request', id: `LISTING-${listingId}` },
    { type: 'Request', id: 'MINE' },
    { type: 'Listing', id: listingId },
    { type: 'Listing', id: 'LIST' },
    { type: 'Listing', id: 'MINE' },
  ] as const

const requestsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    getListingRequests: build.query<ListingRequest[], string>({
      queryFn: (listingId) =>
        simulate(
          (actor) => db.listListingRequests(actor, listingId),
          () => [],
        ),
      providesTags: (result, _error, listingId) => [
        { type: 'Request', id: `LISTING-${listingId}` },
        ...(result ?? []).map((request) => ({ type: 'Request' as const, id: request.id })),
      ],
    }),

    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    createRequest: build.mutation<
      ListingRequest,
      { listingId: string; note?: string | null; idempotencyKey: string }
    >({
      queryFn: ({ listingId, note, idempotencyKey }) =>
        simulate((actor) => db.createRequest(actor, { listingId, note }, idempotencyKey)),
      invalidatesTags: (_result, _error, { listingId }) => [...touched(listingId)],
    }),

    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    decideRequest: build.mutation<
      ListingRequest,
      { requestId: string; listingId: string; decision: 'APPROVED' | 'DECLINED' }
    >({
      queryFn: ({ requestId, decision }) =>
        simulate((actor) => db.decideRequest(actor, { requestId, decision })),
      invalidatesTags: (_result, _error, { listingId }) => [...touched(listingId)],
    }),

    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    cancelRequest: build.mutation<ListingRequest, { requestId: string; listingId: string }>({
      queryFn: ({ requestId }) => simulate((actor) => db.cancelRequest(actor, { requestId })),
      invalidatesTags: (_result, _error, { listingId }) => [...touched(listingId)],
    }),

    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    getMyRequests: build.query<ListingRequest[], void>({
      queryFn: () =>
        simulate(
          (actor) => db.listMyRequests(actor),
          () => [],
        ),
      providesTags: (result) => [
        { type: 'Request', id: 'MINE' },
        ...(result ?? []).map((request) => ({ type: 'Request' as const, id: request.id })),
      ],
    }),
  }),
})

type QueryOptions = { skip?: boolean }

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export function useListingRequests(listingId: string, options: QueryOptions = {}) {
  return requestsApi.useGetListingRequestsQuery(listingId, { ...LIST_QUERY_OPTIONS, ...options })
}

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export const useCreateRequest = requestsApi.useCreateRequestMutation

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export const useDecideRequest = requestsApi.useDecideRequestMutation

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export const useCancelRequest = requestsApi.useCancelRequestMutation

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export function useMyRequests(options: QueryOptions = {}) {
  return requestsApi.useGetMyRequestsQuery(undefined, { ...LIST_QUERY_OPTIONS, ...options })
}
