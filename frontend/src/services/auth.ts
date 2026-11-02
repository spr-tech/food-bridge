// Signing in, and checking a stored session is still accepted. Screens use useSignIn;
// RequireSession uses useCurrentAccount (through useSessionCheck).
import * as db from '@/mocks/db'
import { simulate } from '@/mocks/simulate'
import { api } from '@/services/api'
import { env } from '@/config/env'
import type { Account, BackendLoginResponse, BackendMeResponse, Session } from '@/types/api'
import type { Role } from '@/types/role'

export const SIGN_IN_TIMEOUT_MS = 90_000

function mapRole(role: string): Role | null {
  const normalized = role.toUpperCase()
  if (normalized === 'DONOR') return 'donor'
  if (normalized === 'RECIPIENT') return 'recipient'
  if (normalized === 'ADMIN') return 'admin'
  return null
}

const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    signIn: build.mutation<Session, { email: string; password: string }>({
      queryFn: async ({ email, password }, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) return simulate(() => db.signIn(email, password))

        const result = await baseQuery({
          url: '/api/auth/login',
          method: 'POST',
          body: { email, password },
          // Longer than other calls: a sleeping service can take up to a minute to wake.
          timeout: SIGN_IN_TIMEOUT_MS,
        })
        if (result.error) return { error: result.error }

        const response = result.data as BackendLoginResponse
        const role = mapRole(response.role)
        if (!response.token || !response.id || !role) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'The login response is missing a token, account ID, or supported role.',
            },
          }
        }

        return {
          data: {
            token: response.token,
            accountId: response.id,
            role,
            organisationName: response.organisationName || response.name || email,
            // The service now returns the email; fall back to what was typed.
            email: response.email ?? email,
          },
        }
      },
    }),

    // GET /api/auth/me with the stored Bearer token. A 401 means the token has expired or
    // was never valid. The argument is the stored account id: it only keys the cache, so
    // each signed-in account is checked once, not on every page.
    getMe: build.query<Account, string>({
      queryFn: async (_accountId, _api, _extraOptions, baseQuery) => {
        if (env.useMocks) return simulate((actor) => db.getMe(actor))

        const result = await baseQuery({ url: '/api/auth/me' })
        if (result.error) return { error: result.error }

        const response = result.data as BackendMeResponse
        const role = mapRole(response.role ?? '')
        if (!response.id || !role) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'The account response is missing an account ID or supported role.',
            },
          }
        }

        return {
          data: {
            accountId: response.id,
            role,
            organisationName: response.organisationName || response.name || response.email || '',
            email: response.email ?? '',
          },
        }
      },
      // The answer only changes with a new sign-in, which resets the cache anyway.
      keepUnusedDataFor: 3600,
    }),
  }),
})

export const useSignIn = authApi.useSignInMutation

export function useCurrentAccount(accountId: string | undefined) {
  return authApi.useGetMeQuery(accountId ?? '', { skip: !accountId })
}

// ---------------------------------------------------------------------------
// Explanation
// - Sends { email, password } to POST /api/auth/login, as the updated contract says.
// - Turns the reply (token, id, role, organisationName, email) into your Session shape.
// - In mock mode it still uses the simulated sign-in.