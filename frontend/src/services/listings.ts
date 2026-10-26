// Listings: browse, details, create, and the donor's own. Screens use these hooks only.
import * as db from '@/mocks/db'
import { simulate, simulateWrite } from '@/mocks/simulate'
import { api, LIST_QUERY_OPTIONS } from '@/services/api'
import type { CreateListingInput, Listing, ListingFilters, ListingPage } from '@/types/api'

export const listingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    getListings: build.query<ListingPage, ListingFilters>({
      queryFn: (filters) =>
        simulate(
          (actor) => db.listListings(actor, filters),
          () => ({ items: [], total: 0 }),
        ),
      providesTags: (result) => [
        { type: 'Listing', id: 'LIST' },
        ...(result?.items ?? []).map((listing) => ({ type: 'Listing' as const, id: listing.id })),
      ],
    }),

    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    getListing: build.query<Listing, string>({
      queryFn: (id) => simulate((actor) => db.getListing(actor, id)),
      providesTags: (_result, _error, id) => [{ type: 'Listing', id }],
    }),

    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    createListing: build.mutation<Listing, { input: CreateListingInput; idempotencyKey: string }>({
      queryFn: ({ input, idempotencyKey }) =>
        simulateWrite((actor) => db.createListing(actor, input, idempotencyKey)),
      invalidatesTags: [
        { type: 'Listing', id: 'LIST' },
        { type: 'Listing', id: 'MINE' },
      ],
    }),

    // TEMPORARY: simulated until the API exists. Replace the inside with an
    // injectEndpoints endpoint; the screen must not change.
    getMyListings: build.query<Listing[], void>({
      queryFn: () =>
        simulate(
          (actor) => db.listMyListings(actor),
          () => [],
        ),
      providesTags: (result) => [
        { type: 'Listing', id: 'MINE' },
        ...(result ?? []).map((listing) => ({ type: 'Listing' as const, id: listing.id })),
      ],
    }),
  }),
})

type QueryOptions = { skip?: boolean }

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export function useListings(filters: ListingFilters, options: QueryOptions = {}) {
  return listingsApi.useGetListingsQuery(filters, { ...LIST_QUERY_OPTIONS, ...options })
}

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export const useListing = listingsApi.useGetListingQuery

// Fetches a listing's details ahead of a click (cards call it on hover and focus).
export const usePrefetchListing = () => listingsApi.usePrefetch('getListing')

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export const useCreateListing = listingsApi.useCreateListingMutation

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export function useMyListings(options: QueryOptions = {}) {
  return listingsApi.useGetMyListingsQuery(undefined, { ...LIST_QUERY_OPTIONS, ...options })
}
