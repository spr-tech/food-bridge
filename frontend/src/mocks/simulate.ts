// TEMPORARY: simulated until the API exists.
// Runs one simulated endpoint the way the network would: after a short delay, as the
// signed-in account, returning { data } or an RTK Query { error }.
// Dev builds also read a ?simulate= switch from the page address:
//   ?simulate=error    every call fails (500), to see error states
//   ?simulate=empty    lists come back empty, to see empty states
//   ?simulate=slow     every call takes 2 seconds, to see loading states
// DEMO SWITCH, every build while the data is simulated (dev and the deployed demo), so
// the rollback can be shown live. It goes when this folder does:
//   ?simulate=offline   every save fails as if the connection dropped (reads still work)
//   ?simulate=conflict  the next approval is refused with 409 LISTING_ALREADY_RESERVED, as if
//                       another approval had landed first (once per page load; the listing
//                       needs another pending request)
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { getSession } from '@/app/session'
import { approveRival, MockApiError } from '@/mocks/db'
import type { Session } from '@/types/api'

export type SimulateMode = 'error' | 'empty' | 'slow' | 'offline' | 'conflict'

// Short enough not to annoy, long enough to see the loading state. None in tests.
const DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 400
const SLOW_DELAY_MS = 2000

export function simulateMode(): SimulateMode | null {
  const value = new URLSearchParams(window.location.search).get('simulate')
  if (value === 'offline' || value === 'conflict') return value
  if (!import.meta.env.DEV) return null
  return value === 'error' || value === 'empty' || value === 'slow' ? value : null
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

type Result<T> = { data: T } | { error: FetchBaseQueryError }

export async function simulate<T>(
  run: (actor: Session | null) => T,
  // What a list returns under ?simulate=empty. Leave out for calls that aren't lists.
  empty?: () => T,
): Promise<Result<T>> {
  const mode = simulateMode()
  await wait(mode === 'slow' ? SLOW_DELAY_MS : DELAY_MS)

  if (mode === 'error') {
    return { error: { status: 500, data: { code: 'SIMULATED_ERROR', message: 'Simulated server error.' } } }
  }
  if (mode === 'empty' && empty) return { data: empty() }

  try {
    return { data: run(getSession()) }
  } catch (error) {
    if (error instanceof MockApiError) {
      return {
        error: {
          status: error.status,
          data: { code: error.code, message: error.message, fields: error.fields },
        },
      }
    }
    throw error
  }
}

// A save (create, request, approve, decline, cancel). The same as simulate, except that
// under ?simulate=offline it fails the way fetchBaseQuery does when the connection drops.
export async function simulateWrite<T>(run: (actor: Session | null) => T): Promise<Result<T>> {
  if (simulateMode() === 'offline') {
    await wait(DELAY_MS)
    return { error: { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' } }
  }
  return simulate(run)
}

// DEMO SWITCH ?simulate=conflict: before the next approval, another pending request on the
// listing is approved, so this one meets the service's real 409 and rolls back.
let conflictUsed = false

export function simulateRivalApproval(requestId: string) {
  if (simulateMode() !== 'conflict' || conflictUsed) return
  conflictUsed = true
  approveRival(requestId)
}

// Lets ?simulate=conflict fire again (tests start each one fresh).
export function resetSimulateSwitches() {
  conflictUsed = false
}
