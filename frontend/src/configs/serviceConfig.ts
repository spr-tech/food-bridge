// The one RTK Query API for the app. Each resource adds its endpoints in its own
// file with api.injectEndpoints, e.g. services/listings.ts. Never create a second createApi.
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react'
import { expireSession, getSession } from '@/stores/sessionStore'
import { env } from '@/configs/env'

// TEMPORARY: true while every endpoint is simulated (src/mocks/). The demo line says
// "(simulated)" while it is. Set to false once the endpoints call the service.
export const DATA_IS_SIMULATED = env.useMocks
// Caching plan (keepUnusedDataFor stays at the 60s default):
// - list endpoints use refetchOnMountOrArgChange: 30 and refetchOnReconnect: true
// - listing cards prefetch their detail with usePrefetch on hover and focus (ifOlderThan: 30)
export const LIST_QUERY_OPTIONS = { refetchOnMountOrArgChange: 30, refetchOnReconnect: true } as const

// A 401 on sign-in means wrong details, not an ended session.
const SIGN_IN_URL = '/api/auth/login'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  timeout: 45000,
  prepareHeaders: (headers) => {
    // A fresh ID per request lets one user's journey be followed in the service logs.
    // Header name is TBC with the service engineers (spec section 1).
    headers.set('X-Request-Id', crypto.randomUUID())
    // TODO(auth): the header's form is TBC with the auth approach (docs/decisions.md).
    const token = getSession()?.token
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

// Every call goes through here. A 401 means the service no longer accepts the token (it
// lasts 30 minutes and is lost when the service restarts), so the session ends wherever
// it happened, and RequireSession sends the user to sign in with ?next= to come back.
// Only when the refused token is still the stored one: a slow reply from an earlier
// account never ends a newer session. Screens may still call useSessionEnded themselves.
export const baseQueryWithSessionEnd: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (
  args,
  baseApi,
  extraOptions,
) => {
  const tokenSent = getSession()?.token
  const result = await rawBaseQuery(args, baseApi, extraOptions)
  const url = typeof args === 'string' ? args : args.url

  if (
    result.error?.status === 401 &&
    url !== SIGN_IN_URL &&
    tokenSent !== undefined &&
    getSession()?.token === tokenSent
  ) {
    expireSession()
  }
  return result
}

// The service sleeps when idle (Render's free tier) and takes up to about a minute to
// wake. Sign in calls this as it opens, so the service is waking while the user types: a
// cheap public read whose answer is ignored. Once per page load.
let wakeSent = false
export function wakeService() {
  if (env.useMocks || wakeSent) return
  wakeSent = true
  fetch(`${env.apiUrl}/api/listings?limit=1`).catch(() => {
    // Only a nudge; sign-in reports its own failure.
  })
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithSessionEnd,
  tagTypes: ['Listing', 'Request'],
  endpoints: () => ({}),
})
