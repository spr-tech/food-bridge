// Signing in. Screens use useSignIn only.
import * as db from '@/mocks/db'
import { simulate } from '@/mocks/simulate'
import { api } from '@/services/api'
import type { Session } from '@/types/api'

const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    signIn: build.mutation<Session, { email: string; password: string }>({
      // TEMPORARY: simulated until the API exists. Replace the inside with an
      // injectEndpoints endpoint; the screen must not change.
      queryFn: ({ email, password }) => simulate(() => db.signIn(email, password)),
    }),
  }),
})

// TEMPORARY: simulated until the API exists. Replace the inside with an injectEndpoints
// endpoint; the screen must not change.
export const useSignIn = authApi.useSignInMutation
