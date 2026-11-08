// useNavCounts against the live service (mocks off, fetch stubbed): the service can still
// count Pending requests on a reserved or collected listing, and those don't wait for a
// decision, so the donor's Requests count leaves them out.
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/configs/storeConfig'
import { ROUTES } from '@/utilities/constants/routes'
import { useNavCounts } from '@/utilities/hooks/useNavCounts'
import { signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const listing = (id: string, status: string, pendingRequestCount: number) => ({
  id,
  foodName: `Listing ${id}`,
  description: '',
  category: 'BAKERY',
  quantity: 4,
  unit: 'BOXES',
  imageReference: null,
  pickupArea: 'yaba',
  collectionDeadline: '2030-01-01T12:00:00Z',
  status,
  donorId: 'acc-donor',
  donorName: "Mama's Oven",
  createdAt: '2029-12-31T12:00:00Z',
  pendingRequestCount,
})

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  signInAs('donor')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useNavCounts (live service)', () => {
  it('counts pending requests on Available listings only', async () => {
    fetchMock.mockImplementation(async () =>
      Response.json([
        listing('11111111-1111-4111-8111-111111111111', 'AVAILABLE', 2),
        listing('22222222-2222-4222-8222-222222222222', 'RESERVED', 3),
        listing('33333333-3333-4333-8333-333333333333', 'COLLECTED', 1),
      ]),
    )
    const store = makeStore()
    const { result } = renderHook(() => useNavCounts(), {
      wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
    })

    await waitFor(() => expect(result.current).toEqual({ [ROUTES.requests]: 2 }))
  })
})
