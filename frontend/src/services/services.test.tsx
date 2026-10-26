// The hooks screens use: real RTK Query hooks over the simulated store. A write refreshes
// the cached lists it touches, and errors arrive in the shape screens read.
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import { makeStore } from '@/app/store'
import { DEMO_PASSWORD } from '@/mocks/seed'
import { useSignIn } from '@/services/auth'
import { errorCode, errorStatus } from '@/services/errors'
import { useCreateListing, useMyListings } from '@/services/listings'
import { useCancelRequest, useCreateRequest, useMyRequests } from '@/services/requests'
import { signInAs } from '@/test/render'

function wrapper() {
  const store = makeStore()
  return ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
}

const deadline = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()

describe('simulated hooks', () => {
  it('signs in and returns the session', async () => {
    const { result } = renderHook(() => useSignIn(), { wrapper: wrapper() })

    let session: unknown
    await act(async () => {
      session = await result.current[0]({ email: 'admin@foodbridge.test', password: DEMO_PASSWORD }).unwrap()
    })

    expect(session).toMatchObject({ role: 'admin' })
  })

  it("refreshes the donor's listings after creating one", async () => {
    signInAs('donor')
    const { result } = renderHook(() => ({ mine: useMyListings(), create: useCreateListing() }), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.mine.data).toHaveLength(5))

    await act(async () => {
      await result.current.create[0]({
        idempotencyKey: 'key-1',
        input: {
          foodName: 'Puff-puff',
          description: '',
          category: 'pastries',
          quantity: 30,
          unit: 'pieces',
          pickupArea: 'yaba',
          deadline: deadline(),
          photoUrl: null,
        },
      }).unwrap()
    })

    await waitFor(() => expect(result.current.mine.data).toHaveLength(6))
  })

  it("refreshes the recipient's requests after requesting and cancelling", async () => {
    signInAs('recipient')
    const { result } = renderHook(
      () => ({ mine: useMyRequests(), create: useCreateRequest(), cancel: useCancelRequest() }),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.mine.data).toBeDefined())
    const before = result.current.mine.data?.length ?? 0

    let requestId = ''
    await act(async () => {
      requestId = (await result.current.create[0]({ listingId: 'lst-09', idempotencyKey: 'key-1' }).unwrap()).id
    })
    await waitFor(() => expect(result.current.mine.data).toHaveLength(before + 1))

    await act(async () => {
      await result.current.cancel[0]({ requestId, listingId: 'lst-09' }).unwrap()
    })
    await waitFor(() =>
      expect(result.current.mine.data?.find((r) => r.id === requestId)?.status).toBe('CANCELLED'),
    )
  })

  it('reports a refused request with its status and code', async () => {
    signInAs('recipient')
    const { result } = renderHook(() => useCreateRequest(), { wrapper: wrapper() })

    let caught: unknown
    await act(async () => {
      caught = await result.current[0]({ listingId: 'lst-14', idempotencyKey: 'key-1' })
        .unwrap()
        .catch((error: unknown) => error)
    })

    expect(errorStatus(caught)).toBe(409)
    expect(errorCode(caught)).toBe('LISTING_EXPIRED')
  })
})
