// Listings: browse, details, create, update, upload photos, and the donor's own listings.
// Screens use these hooks only; mock and live services share the same UI-facing types.

import * as db from '@/mocks/db'
import { simulate, simulateWrite } from '@/mocks/simulate'
import { matchesListingSearch, matchesPickupArea } from '@/utilities/helpers/listing-search'
import { compressPhoto, shrinkPhoto } from '@/utilities/helpers/photo'
import { api, LIST_QUERY_OPTIONS } from '@/configs/serviceConfig'
import { env } from '@/configs/env'
import {
  extractImageReference,
  mapBackendListing,
} from '@/services/mappers/backend-mappers'
import { readAllPages, readPages } from '@/utilities/helpers/pagedQuery'

import type {
  BackendCreateListingRequest,
  BackendListingResponse,
  CreateListingInput,
  Listing,
  ListingFilters,
  ListingPage,
} from '@/models/api'

// The filters the service applies itself; readPages adds offset and limit.
function queryParams(filters: ListingFilters) {
  const params: Record<string, string> = {}

  if (filters.q?.trim()) params.keyword = filters.q.trim()
  if (filters.category) params.category = filters.category
  if (filters.area) params.pickupArea = filters.area

  if (filters.status && filters.status !== 'all') {
    params.availability = filters.status.toUpperCase()
  }

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
            (): ListingPage => ({ items: [], total: 0 }),
          )
        }

        // The service's keyword search skips the donor and area, and its area filter only
        // matches the exact stored text ("surulere", not "Surulere, Lagos - …"). With a
        // search or an area, ask it for status and category only, load every page, and
        // match the search and area here.
        // Expired and Deleted take the same path, keeping each row by the status it carries.
        // Backend defect (2 November 2026): availability=EXPIRED also returns deleted
        // listings (status DELETED, deleted true), and availability=DELETED is refused with
        // 400 INVALID_LISTING. Deleted rows from the Expired filter are counted in
        // deletedReturned so the page can say so, and Deleted reads the unfiltered list
        // (only an administrator's includes deleted listings). Remove both once the service
        // filters by status correctly.
        const byStatus = filters.status === 'EXPIRED' || filters.status === 'DELETED'
        if (filters.q?.trim() || filters.area || byStatus) {
          const all = await readAllPages<BackendListingResponse>(
            baseQuery,
            '/api/listings',
            queryParams({
              ...filters,
              q: undefined,
              area: undefined,
              status: filters.status === 'DELETED' ? 'all' : filters.status,
            }),
          )
          if ('error' in all) return { error: all.error }

          const rows = all.data.map(mapBackendListing)
          const inStatus = byStatus
            ? rows.filter((listing) => listing.status === filters.status)
            : rows
          const deletedReturned =
            filters.status === 'EXPIRED'
              ? rows.filter((listing) => listing.status === 'DELETED').length
              : 0

          const matches = inStatus.filter(
            (listing) =>
              matchesPickupArea(listing, filters.area) &&
              matchesListingSearch(listing, filters.q ?? ''),
          )

          return {
            data: {
              items: matches.slice(0, filters.limit ?? 50),
              total: matches.length,
              ...(deletedReturned > 0 ? { deletedReturned } : {}),
            },
          }
        }

        // "Load more" grows the limit past 100, which the service refuses in one call, so
        // the rows are read in pages of at most 100.
        const page = await readPages<BackendListingResponse>(
          baseQuery,
          '/api/listings',
          queryParams(filters),
          filters.limit ?? 50,
        )
        if ('error' in page) return { error: page.error }

        return {
          data: {
            items: page.data.rows.map(mapBackendListing),
            total: page.data.total,
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
    // DELETE /api/listings/{listingId}
    // Delete a listing. The service replies 204 No Content.
    // -----------------------------------------------------------------------
    deleteListing: build.mutation<void, string>({
      queryFn: async (
        listingId,
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        if (env.useMocks) {
          return simulateWrite((actor) =>
            db.deleteListing(actor, listingId),
          )
        }

        const result = await baseQuery({
          url: `/api/listings/${encodeURIComponent(listingId)}`,
          method: 'DELETE',
        })

        if (result.error) return { error: result.error }

        return { data: undefined }
      },

      // The listing's requests go with it, so a recipient's own list refreshes too.
      invalidatesTags: (_result, _error, listingId) => [
        { type: 'Listing', id: listingId },
        { type: 'Listing', id: 'LIST' },
        { type: 'Listing', id: 'MINE' },
        { type: 'Request', id: 'MINE' },
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

        // The service accepts 1 MB; people may choose photos up to 5 MB. If the browser
        // can't redraw the photo, send it as chosen and let the service decide.
        const upload = await compressPhoto(file).catch(() => file)
        const form = new FormData()
        form.append('file', upload)

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
    // Get every one of the authenticated donor's own listings.
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

        // Every page, so a donor with more than one page of listings (history included)
        // sees them all.
        const result = await readAllPages<BackendListingResponse>(
          baseQuery,
          '/api/listings',
          { mine: true },
        )

        if ('error' in result) return { error: result.error }

        return {
          data: result.data.map(mapBackendListing),
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

export const useDeleteListing =
  listingsApi.useDeleteListingMutation

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