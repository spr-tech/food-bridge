// Listings: browse, details, create, update, upload photos, and the donor's own listings.
// Screens use these hooks only; mock and live services share the same UI-facing types.

import * as db from '@/mocks/db'
import { simulate, simulateWrite } from '@/mocks/simulate'
import { shrinkPhoto } from '@/lib/photo'
import { api, LIST_QUERY_OPTIONS } from '@/services/api'
import { env } from '@/config/env'
import {
  extractImageReference,
  mapBackendListing,
} from '@/services/backend-mappers'

import type {
  BackendCreateListingRequest,
  BackendListingResponse,
  CreateListingInput,
  Listing,
  ListingFilters,
  ListingPage,
} from '@/types/api'

function queryParams(
  filters: ListingFilters,
  mine = false,
) {
  const params: Record<string, string | number | boolean> = {
    offset: 0,
    limit: filters.limit ?? 50,
  }

  if (filters.q?.trim()) params.keyword = filters.q.trim()
  if (filters.category) params.category = filters.category
  if (filters.area) params.pickupArea = filters.area

  if (filters.status && filters.status !== 'all') {
    params.availability = filters.status.toUpperCase()
  }

  if (mine) params.mine = true

  return params
}

function toBackendListingRequest(
  input: CreateListingInput,
): BackendCreateListingRequest {
  return {
    foodName: input.foodName,
    description: input.description,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    ...(input.photoUrl
      ? { imageReference: input.photoUrl }
      : {}),
    pickupArea: input.pickupArea,
    collectionDeadline: input.deadline,
  }
}

const listingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // -----------------------------------------------------------------------
    // GET /api/listings
    // Browse and filter food listings.
    // -----------------------------------------------------------------------
    getListings: build.query<ListingPage, ListingFilters>({
      queryFn: async (
        filters,
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        if (env.useMocks) {
          return simulate(
            (actor) => db.listListings(actor, filters),
            () => ({ items: [], total: 0 }),
          )
        }

        const result = await baseQuery({
          url: '/api/listings',
          params: queryParams(filters),
        })

        if (result.error) return { error: result.error }

        const rows = Array.isArray(result.data)
          ? (result.data as BackendListingResponse[])
          : []

        const items = rows.map(mapBackendListing)

        const headerTotal =
          result.meta?.response?.headers.get('x-total-count')

        const total =
          headerTotal !== null &&
          headerTotal !== undefined &&
          Number.isFinite(Number(headerTotal))
            ? Number(headerTotal)
            : items.length

        return {
          data: {
            items,
            total,
          },
        }
      },

      providesTags: (result) => [
        { type: 'Listing', id: 'LIST' },
        ...(result?.items ?? []).map((listing) => ({
          type: 'Listing' as const,
          id: listing.id,
        })),
      ],
    }),

    // -----------------------------------------------------------------------
    // GET /api/listings/{listingId}
    // Get one listing.
    // -----------------------------------------------------------------------
    getListing: build.query<Listing, string>({
      queryFn: async (
        id,
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        if (env.useMocks) {
          return simulate((actor) => db.getListing(actor, id))
        }

        const result = await baseQuery({
          url: `/api/listings/${encodeURIComponent(id)}`,
        })

        if (result.error) return { error: result.error }

        return {
          data: mapBackendListing(
            result.data as BackendListingResponse,
          ),
        }
      },

      providesTags: (_result, _error, id) => [
        { type: 'Listing', id },
      ],
    }),

    // -----------------------------------------------------------------------
    // PUT /api/listings/{listingId}
    // Update an existing listing.
    // -----------------------------------------------------------------------
    updateListing: build.mutation<
      Listing,
      {
        listingId: string
        input: CreateListingInput
      }
    >({
      queryFn: async (
        { listingId, input },
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        if (env.useMocks) {
          return simulateWrite((actor) =>
            db.updateListing(actor, listingId, input),
          )
        }

        const result = await baseQuery({
          url: `/api/listings/${encodeURIComponent(listingId)}`,
          method: 'PUT',
          body: toBackendListingRequest(input),
        })

        if (result.error) return { error: result.error }

        return {
          data: mapBackendListing(
            result.data as BackendListingResponse,
          ),
        }
      },

      invalidatesTags: (_result, _error, { listingId }) => [
        { type: 'Listing', id: listingId },
        { type: 'Listing', id: 'LIST' },
        { type: 'Listing', id: 'MINE' },
      ],
    }),

    // -----------------------------------------------------------------------
    // POST /api/listings/images
    // Upload a photo. The backend stores it in Cloudinary.
    // -----------------------------------------------------------------------
    uploadListingImage: build.mutation<string, File>({
      queryFn: async (
        file,
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        if (env.useMocks) {
          const saved = await simulateWrite(() => true)

          if ('error' in saved) return { error: saved.error }

          return {
            data: await shrinkPhoto(file),
          }
        }

        const form = new FormData()
        form.append('file', file)

        const result = await baseQuery({
          url: '/api/listings/images',
          method: 'POST',
          body: form,
        })

        if (result.error) return { error: result.error }

        try {
          return {
            data: extractImageReference(result.data),
          }
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error:
                error instanceof Error
                  ? error.message
                  : 'The uploaded photo URL was missing.',
            },
          }
        }
      },
    }),

    // -----------------------------------------------------------------------
    // POST /api/listings
    // Create a food listing.
    // -----------------------------------------------------------------------
    createListing: build.mutation<
      Listing,
      {
        input: CreateListingInput
        idempotencyKey: string
      }
    >({
      queryFn: async (
        { input, idempotencyKey },
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        if (env.useMocks) {
          return simulateWrite((actor) =>
            db.createListing(actor, input, idempotencyKey),
          )
        }

        const result = await baseQuery({
          url: '/api/listings',
          method: 'POST',
          body: toBackendListingRequest(input),
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        })

        if (result.error) return { error: result.error }

        return {
          data: mapBackendListing(
            result.data as BackendListingResponse,
          ),
        }
      },

      invalidatesTags: [
        { type: 'Listing', id: 'LIST' },
        { type: 'Listing', id: 'MINE' },
      ],
    }),

    // -----------------------------------------------------------------------
    // GET /api/listings?mine=true
    // Get the authenticated donor's own listings.
    // -----------------------------------------------------------------------
    getMyListings: build.query<Listing[], void>({
      queryFn: async (
        _arg,
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        if (env.useMocks) {
          return simulate(
            (actor) => db.listMyListings(actor),
            () => [],
          )
        }

        const result = await baseQuery({
          url: '/api/listings',
          params: queryParams({}, true),
        })

        if (result.error) return { error: result.error }

        const rows = Array.isArray(result.data)
          ? (result.data as BackendListingResponse[])
          : []

        return {
          data: rows.map(mapBackendListing),
        }
      },

      providesTags: (result) => [
        { type: 'Listing', id: 'MINE' },
        ...(result ?? []).map((listing) => ({
          type: 'Listing' as const,
          id: listing.id,
        })),
      ],
    }),
  }),
})

// ---------------------------------------------------------------------------
// Hooks used by frontend screens.
// ---------------------------------------------------------------------------

type QueryOptions = {
  skip?: boolean
}

export function useListings(
  filters: ListingFilters,
  options: QueryOptions = {},
) {
  return listingsApi.useGetListingsQuery(filters, {
    ...LIST_QUERY_OPTIONS,
    ...options,
  })
}

export const useListing = listingsApi.useGetListingQuery

export const usePrefetchListing = () =>
  listingsApi.usePrefetch('getListing')

export const useUploadListingImage =
  listingsApi.useUploadListingImageMutation

export const useCreateListing =
  listingsApi.useCreateListingMutation

export const useUpdateListing =
  listingsApi.useUpdateListingMutation

export function useMyListings(
  options: QueryOptions = {},
) {
  return listingsApi.useGetMyListingsQuery(undefined, {
    ...LIST_QUERY_OPTIONS,
    ...options,
  })
}

// Exported for request services that need to invalidate listing caches.
export { listingsApi }