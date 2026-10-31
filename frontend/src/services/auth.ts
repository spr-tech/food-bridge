// Signing in. Screens use useSignIn only.
import * as db from '@/mocks/db'
import { simulate } from '@/mocks/simulate'
import { api } from '@/services/api'
import { env } from '@/config/env'
import type { BackendLoginResponse, Session } from '@/types/api'
import type { Role } from '@/types/role'

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
  }),
})

export const useSignIn = authApi.useSignInMutation

// ---------------------------------------------------------------------------
// Explanation
// - Sends { email, password } to POST /api/auth/login, as the updated contract says.
// - Turns the reply (token, id, role, organisationName, email) into your Session shape.
// - In mock mode it still uses the simulated sign-in.