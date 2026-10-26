// The one RTK Query API for the app. Each resource adds its endpoints in its own
// file with api.injectEndpoints, e.g. services/listings.ts. Never create a second createApi.
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getSession } from '@/app/session'
import { env } from '@/config/env'

// TEMPORARY: true while every endpoint is simulated (src/mocks/). The demo line says
// "(simulated)" while it is. Set to false once the endpoints call the service.
export const DATA_IS_SIMULATED = true

// Caching plan (keepUnusedDataFor stays at the 60s default):
// - list endpoints use refetchOnMountOrArgChange: 30 and refetchOnReconnect: true
// - listing cards prefetch their detail with usePrefetch on hover and focus (ifOlderThan: 30)
export const LIST_QUERY_OPTIONS = { refetchOnMountOrArgChange: 30, refetchOnReconnect: true } as const

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiUrl,
    prepareHeaders: (headers) => {
      // A fresh ID per request lets one user's journey be followed in the service logs.
      // Header name is TBC with the service engineers (spec section 1).
      headers.set('X-Request-Id', crypto.randomUUID())
      // TODO(auth): the header's form is TBC with the auth approach (docs/decisions.md).
      const token = getSession()?.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Listing', 'Request'],
  endpoints: () => ({}),
})
