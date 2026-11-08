// The administrator's endpoints against the live service (mocks off, fetch stubbed):
// GET /api/admin/distribution/today, GET /api/admin/requests and GET /api/activity, each
// with the session's bearer token and the contract's query parameters.
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/configs/storeConfig'
import {
  useAdminRequests,
  useCompletedHandovers,
  useDistributionToday,
  useRecentActivity,
} from '@/services/admin'
import { errorStatus } from '@/services/errors'
import { signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const LISTING_ID = '3f2b8c1a-9d4e-4b7f-a6c2-1e5d7f9a0b34'

const fetchMock = vi.fn<typeof fetch>()
const calls = () => fetchMock.mock.calls.map(([input]) => input as Request)

function wrapper() {
  const store = makeStore()
  return ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  signInAs('admin')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useDistributionToday (live service)', () => {
  it('reads GET /api/admin/distribution/today with the bearer token', async () => {
    const summary = {
      totalRecipients: 3,
      availableListings: 5,
      approvedListingsToday: 2,
      recipientsServedToday: 2,
      recipientsWaitingToday: 1,
      firstRoundInProgress: true,
    }
    fetchMock.mockResolvedValue(Response.json(summary))
    const { result } = renderHook(() => useDistributionToday(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.data).toEqual(summary))
    const [request] = calls()
    expect(request.method).toBe('GET')
    expect(request.url).toBe('https://api.test/api/admin/distribution/today')
    expect(request.headers.get('Authorization')).toBe('Bearer test-token-admin')
  })

  it('passes a 403 on with its status', async () => {
    fetchMock.mockResolvedValue(Response.json({ code: 'FORBIDDEN', message: 'No.' }, { status: 403 }))
    const { result } = renderHook(() => useDistributionToday(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(errorStatus(result.current.error)).toBe(403)
  })
})

describe('useAdminRequests (live service)', () => {
  const row = {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    listingId: LISTING_ID,
    recipientId: 'acc-recipient',
    recipientName: 'Hope Community Kitchen',
    status: 'PENDING',
    createdAt: '2030-01-01T10:00:00Z',
  }

  it('sends offset 0 and limit 50 by default, and reads the total from X-Total-Count', async () => {
    fetchMock.mockResolvedValue(Response.json([row], { headers: { 'X-Total-Count': '7' } }))
    const { result } = renderHook(() => useAdminRequests(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.data?.total).toBe(7))
    const url = new URL(calls()[0].url)
    expect(url.pathname).toBe('/api/admin/requests')
    expect(Object.fromEntries(url.searchParams)).toEqual({ offset: '0', limit: '50' })
    expect(calls()[0].headers.get('Authorization')).toBe('Bearer test-token-admin')
    expect(result.current.data?.items).toEqual([
      expect.objectContaining({ id: row.id, listingId: LISTING_ID, recipientName: 'Hope Community Kitchen', status: 'PENDING' }),
    ])
  })

  it('sends the status, offset and limit it is given', async () => {
    fetchMock.mockResolvedValue(Response.json([]))
    const { result } = renderHook(() => useAdminRequests({ status: 'APPROVED', offset: 50, limit: 25 }), {
      wrapper: wrapper(),
    })

    await waitFor(() => expect(result.current.data).toEqual({ items: [], total: 0 }))
    expect(Object.fromEntries(new URL(calls()[0].url).searchParams)).toEqual({
      status: 'APPROVED',
      offset: '50',
      limit: '25',
    })
  })
})

describe('useRecentActivity (live service)', () => {
  it('sends limit 20 by default and maps each row', async () => {
    fetchMock.mockResolvedValue(
      Response.json([
        {
          id: 'e0000000-0000-4000-8000-000000000001',
          actorName: "Mama's Oven",
          type: 'LISTING_CREATED',
          listingId: LISTING_ID,
          listingTitle: 'Sausage rolls',
          details: '{}',
          createdAt: '2030-01-01T10:00:00Z',
        },
        {
          id: 'e0000000-0000-4000-8000-000000000002',
          actorName: null,
          type: 'request_cancelled',
          listingId: null,
          listingTitle: null,
          details: null,
          createdAt: '2030-01-01T09:00:00Z',
        },
      ]),
    )
    const { result } = renderHook(() => useRecentActivity(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.data).toHaveLength(2))
    const url = new URL(calls()[0].url)
    expect(url.pathname).toBe('/api/activity')
    expect(url.searchParams.get('limit')).toBe('20')
    expect(calls()[0].headers.get('Authorization')).toBe('Bearer test-token-admin')
    expect(result.current.data?.[0]).toEqual({
      id: 'e0000000-0000-4000-8000-000000000001',
      actorName: "Mama's Oven",
      type: 'LISTING_CREATED',
      listingId: LISTING_ID,
      listingTitle: 'Sausage rolls',
      details: '{}',
      createdAt: '2030-01-01T10:00:00Z',
    })
    // An unnamed actor and a lower-case type are tidied up.
    expect(result.current.data?.[1]).toMatchObject({ actorName: 'Someone', type: 'REQUEST_CANCELLED', listingId: null })
  })

  it('sends the limit it is given', async () => {
    fetchMock.mockResolvedValue(Response.json([]))
    const { result } = renderHook(() => useRecentActivity(10), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.data).toEqual([]))
    expect(new URL(calls()[0].url).searchParams.get('limit')).toBe('10')
  })
})

describe('useCompletedHandovers (live service)', () => {
  const OTHER_ID = '3f2b8c1a-9d4e-4b7f-a6c2-1e5d7f9a0b35'
  const listing = (id: string, foodName: string, status = 'COLLECTED') => ({
    id,
    foodName,
    description: 'Fresh.',
    category: 'BAKERY',
    quantity: 40,
    unit: 'ITEMS',
    imageReference: null,
    pickupArea: 'Yaba',
    collectionDeadline: '2030-01-01T18:00:00Z',
    status,
    donorId: 'acc-donor',
    donorName: "Mama's Oven",
    createdAt: '2030-01-01T08:00:00Z',
    pendingRequestCount: 0,
  })
  const request = (id: string, listingId: string, recipientName: string, status: string) => ({
    id,
    listingId,
    recipientId: `acc-${id}`,
    recipientName,
    status,
    createdAt: '2030-01-01T09:00:00Z',
  })

  function answer(routes: Record<string, unknown>) {
    fetchMock.mockImplementation(async (input) => {
      const path = new URL((input as Request).url).pathname
      if (!(path in routes)) return Response.json({ code: 'NOT_FOUND', message: 'No.' }, { status: 404 })
      const body = routes[path]
      return body instanceof Response ? body : Response.json(body)
    })
  }

  it('joins collected listings with their approved request and COLLECTED activity', async () => {
    answer({
      '/api/listings': [listing(LISTING_ID, 'Bread loaves'), listing(OTHER_ID, 'Rice', 'AVAILABLE')],
      '/api/admin/requests': [
        request('r1', LISTING_ID, 'Grace Shelter', 'PENDING'),
        request('r2', LISTING_ID, 'Hope Community Kitchen', 'COLLECTED'),
      ],
      '/api/activity': [
        {
          id: 'e1',
          actorName: "Mama's Oven",
          type: 'COLLECTED',
          listingId: LISTING_ID,
          listingTitle: 'Bread loaves',
          details: '{}',
          createdAt: '2030-01-01T17:00:00Z',
        },
      ],
    })
    const { result } = renderHook(() => useCompletedHandovers(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.data).toBeDefined())
    // Only the Collected listing, even if the service's filter let another through.
    expect(result.current.data).toEqual([
      expect.objectContaining({
        listingId: LISTING_ID,
        foodName: 'Bread loaves',
        donorName: "Mama's Oven",
        recipientName: 'Hope Community Kitchen',
        quantity: 40,
        collectedAt: '2030-01-01T17:00:00Z',
      }),
    ])

    const listingsCall = new URL(calls()[0].url)
    expect(listingsCall.pathname).toBe('/api/listings')
    expect(Object.fromEntries(listingsCall.searchParams)).toEqual({
      availability: 'COLLECTED',
      offset: '0',
      limit: '100',
    })
    expect(Object.fromEntries(new URL(calls()[1].url).searchParams)).toEqual({ offset: '0', limit: '100' })
    expect(new URL(calls()[2].url).searchParams.get('limit')).toBe('100')
    expect(calls().every((call) => call.headers.get('Authorization') === 'Bearer test-token-admin')).toBe(true)
  })

  it('leaves the recipient and time unrecorded rather than guessing, and survives an activity failure', async () => {
    answer({
      '/api/listings': [listing(LISTING_ID, 'Bread loaves')],
      '/api/admin/requests': [request('r1', LISTING_ID, 'Grace Shelter', 'DECLINED')],
      '/api/activity': Response.json({ code: 'SERVER_ERROR', message: 'No.' }, { status: 500 }),
    })
    const { result } = renderHook(() => useCompletedHandovers(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(result.current.data?.[0]).toMatchObject({ recipientName: null, collectedAt: null })
  })

  it('asks for nothing more when no listing is collected', async () => {
    answer({ '/api/listings': [] })
    const { result } = renderHook(() => useCompletedHandovers(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.data).toEqual([]))
    expect(calls()).toHaveLength(1)
  })

  it('passes a 403 from the requests list on with its status', async () => {
    answer({
      '/api/listings': [listing(LISTING_ID, 'Bread loaves')],
      '/api/admin/requests': Response.json({ code: 'FORBIDDEN', message: 'No.' }, { status: 403 }),
    })
    const { result } = renderHook(() => useCompletedHandovers(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(errorStatus(result.current.error)).toBe(403)
  })
})
