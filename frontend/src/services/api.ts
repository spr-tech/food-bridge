// The one RTK Query API for the app. Each resource adds its endpoints in its own
// file with api.injectEndpoints, e.g. services/listings.ts. Never create a second createApi.
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { env } from '@/config/env'

// Caching plan, applied as endpoints are added (keepUnusedDataFor stays at the 60s default):
// - list endpoints use refetchOnMountOrArgChange: 30 and refetchOnReconnect: true
// - listing cards prefetch their detail with usePrefetch on hover and focus (ifOlderThan: 30)
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiUrl,
    prepareHeaders: (headers) => {
      // A fresh ID per request lets one user's journey be followed in the service logs.
      // Header name is TBC with the service engineers (spec section 1).
      headers.set('X-Request-Id', crypto.randomUUID())
      // TODO(auth): set the Authorization header once the auth approach is agreed.
      return headers
    },
  }),
  tagTypes: ['Listing', 'Request'],
  endpoints: () => ({}),
})
