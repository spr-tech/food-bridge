// useDeleteListing against the live service (mocks off, fetch stubbed): DELETE
// /api/listings/{listingId} with the session's bearer token; 204 No Content is success and
// refreshes the cached listing and lists; a refusal comes back with its status.
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/app/store'
import { errorStatus } from '@/services/errors'
import { useDeleteListing, useMyListings } from '@/services/listings'
import { signInAs } from '@/test/render'

vi.mock('@/config/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const LISTING_ID = '3f2b8c1a-9d4e-4b7f-a6c2-1e5d7f9a0b34'

const listingJson = {
  id: LISTING_ID,
  foodName: 'Sausage rolls',
  description: '',
  category: 'BAKERY',
  quantity: 24,
  unit: 'ITEMS',
  imageReference: null,
  pickupArea: 'yaba',
  collectionDeadline: '2030-01-01T12:00:00Z',
  status: 'AVAILABLE',
  donorId: 'acc-donor',
  donorName: "Mama's Oven",
  createdAt: '2029-12-31T12:00:00Z',
  pendingRequestCount: 0,
}

const fetchMock = vi.fn<typeof fetch>()
const calls = () => fetchMock.mock.calls.map(([input]) => input as Request)

function wrapper() {
  const store = makeStore()
  return ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  signInAs('donor')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useDeleteListing (live service)', () => {
  it('sends DELETE /api/listings/{listingId} with the bearer token and treats 204 as success', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { result } = renderHook(() => useDeleteListing(), { wrapper: wrapper() })

    let outcome: Awaited<ReturnType<(typeof result.current)[0]>> | undefined
    await act(async () => {
      outcome = await result.current[0](LISTING_ID)
    })

    expect(calls()).toHaveLength(1)
    const [request] = calls()
    expect(request.method).toBe('DELETE')
    expect(request.url).toBe(`https://api.test/api/listings/${LISTING_ID}`)
    expect(request.headers.get('Authorization')).toBe('Bearer test-token-donor')
    expect(outcome).toEqual({ data: undefined })
  })

  it("refetches the donor's listings once the delete succeeds", async () => {
    let deleted = false
    fetchMock.mockImplementation(async (input) => {
      const request = input as Request
      if (request.method === 'DELETE') {
        deleted = true
        return new Response(null, { status: 204 })
      }
      return Response.json(deleted ? [] : [listingJson])
    })
    const { result } = renderHook(() => ({ mine: useMyListings(), remove: useDeleteListing() }), {
      wrapper: wrapper(),
    })
    await waitFor(() => expect(result.current.mine.data).toHaveLength(1))

    await act(async () => {
      await result.current.remove[0](LISTING_ID).unwrap()
    })

    await waitFor(() => expect(result.current.mine.data).toEqual([]))
    expect(calls().map((request) => request.method)).toEqual(['GET', 'DELETE', 'GET'])
  })

  it.each([401, 403, 404, 409, 500])('passes a %s refusal on with its status', async (status) => {
    fetchMock.mockResolvedValue(Response.json({ code: 'REFUSED', message: 'No.' }, { status }))
    const { result } = renderHook(() => useDeleteListing(), { wrapper: wrapper() })

    let error: unknown
    await act(async () => {
      error = await result.current[0](LISTING_ID).unwrap().catch((caught: unknown) => caught)
    })

    expect(errorStatus(error)).toBe(status)
  })
})
