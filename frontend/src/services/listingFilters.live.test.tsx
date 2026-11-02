// useListings against the live service (mocks off, fetch stubbed), filtering the way Find
// food does. The stub behaves like the deployed service: its area filter matches only the
// exact stored text and its keyword search looks only at the name and description, and it
// returns at most 100 listings a call. So with an area or a search the app asks for
// status and category only, reads every page, and matches area and search itself.
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/app/store'
import { pickupAreaValue } from '@/constants/listingOptions'
import { useListings } from '@/services/listings'
import { signInAs } from '@/test/render'
import type { ListingFilters } from '@/types/api'

vi.mock('@/config/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const SEED_AREA = 'Surulere, Lagos - fictional demo neighbourhood kitchen collection desk'

type Row = { foodName: string; pickupArea: string; donorName: string; status: string; category: string }

let n = 0
const row = ({ foodName, pickupArea, donorName, status, category }: Row) => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
  foodName,
  description: 'Freshly made',
  category,
  quantity: 4,
  unit: 'BOXES',
  imageReference: null,
  pickupArea,
  collectionDeadline: '2030-01-01T12:00:00Z',
  status,
  donorId: 'acc-donor',
  donorName,
  createdAt: new Date(Date.now() - n * 60_000).toISOString(),
  pendingRequestCount: 0,
})

// 120 rows, so a full read needs two calls of 100.
const ROWS = [
  row({ foodName: 'Jollof rice', pickupArea: 'surulere', donorName: 'Eko Caterers', status: 'AVAILABLE', category: 'PREPARED_MEALS' }),
  row({ foodName: 'Amala and ewedu', pickupArea: SEED_AREA, donorName: 'Mama Put', status: 'AVAILABLE', category: 'PREPARED_MEALS' }),
  row({ foodName: 'Garri', pickupArea: SEED_AREA, donorName: 'Mama Put', status: 'RESERVED', category: 'PANTRY' }),
  row({ foodName: 'Bread', pickupArea: 'Yaba, Lagos - community kitchen desk', donorName: 'Eko Caterers', status: 'AVAILABLE', category: 'BAKERY' }),
  ...Array.from({ length: 115 }, (_, i) =>
    row({ foodName: `Filler ${i}`, pickupArea: 'ikeja', donorName: 'Filler Foods', status: 'AVAILABLE', category: 'OTHER' }),
  ),
  row({ foodName: 'Late beans', pickupArea: SEED_AREA, donorName: 'Mama Put', status: 'AVAILABLE', category: 'PANTRY' }),
]

// The deployed service's own filtering (ListingRepository.queryFiltered).
function serve(url: URL) {
  const p = url.searchParams
  const offset = Number(p.get('offset') ?? 0)
  const limit = Number(p.get('limit') ?? 50)
  if (limit > 100) return Response.json({ code: 'INVALID_PAGE' }, { status: 400 })
  const matches = ROWS.filter(
    (r) =>
      (!p.get('availability') || r.status === p.get('availability')) &&
      (!p.get('category') || r.category === p.get('category')) &&
      (!p.get('pickupArea') || r.pickupArea.toUpperCase() === p.get('pickupArea')!.toUpperCase()) &&
      (!p.get('keyword') ||
        `${r.foodName} ${r.description}`.toLowerCase().includes(p.get('keyword')!.toLowerCase())),
  )
  return Response.json(matches.slice(offset, offset + limit), {
    headers: { 'X-Total-Count': String(matches.length) },
  })
}

const fetchMock = vi.fn<typeof fetch>()
const urls = () => fetchMock.mock.calls.map(([input]) => new URL((input as Request).url))

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input) => serve(new URL((input as Request).url)))
  vi.stubGlobal('fetch', fetchMock)
  signInAs('recipient')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function load(filters: ListingFilters) {
  const store = makeStore()
  return renderHook(() => useListings(filters), {
    wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
  })
}

describe('pickupAreaValue', () => {
  it.each([
    ['surulere', 'surulere'],
    ['Surulere', 'surulere'],
    [SEED_AREA, 'surulere'],
    ['Yaba, Lagos - community kitchen desk', 'yaba'],
    ['Lekki, Lagos', 'lekki'],
    ['SIMULATED Lagos pickup', 'SIMULATED Lagos pickup'],
    ['Yabatech gate', 'Yabatech gate'],
  ])('%s is %s', (raw, value) => {
    expect(pickupAreaValue(raw)).toBe(value)
  })
})

describe('Find food filters (live service)', () => {
  it('finds every Available listing in Surulere, however its area was written, across pages', async () => {
    const { result } = load({ area: 'surulere', status: 'AVAILABLE', limit: 12 })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.items.map((l) => l.foodName)).toEqual(['Jollof rice', 'Amala and ewedu', 'Late beans'])
    expect(result.current.data!.total).toBe(3)
    expect(result.current.data!.items.every((l) => l.pickupArea === 'surulere')).toBe(true)
    // Status goes to the service; the area doesn't (it would miss the seeded listings).
    expect(urls().every((u) => u.searchParams.get('availability') === 'AVAILABLE' && !u.searchParams.has('pickupArea'))).toBe(true)
    expect(urls().map((u) => u.searchParams.get('offset'))).toEqual(['0', '100'])
  })

  it('keeps the area and category together', async () => {
    const { result } = load({ area: 'surulere', category: 'PANTRY', status: 'all' })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.items.map((l) => l.foodName)).toEqual(['Garri', 'Late beans'])
  })

  it('searches by donor and by area, as the search box says', async () => {
    const byDonor = load({ q: 'mama put', status: 'AVAILABLE' })
    await waitFor(() => expect(byDonor.result.current.data).toBeDefined())
    expect(byDonor.result.current.data!.items.map((l) => l.foodName)).toEqual(['Amala and ewedu', 'Late beans'])

    const byArea = load({ q: 'Yaba', status: 'AVAILABLE' })
    await waitFor(() => expect(byArea.result.current.data).toBeDefined())
    expect(byArea.result.current.data!.items.map((l) => l.foodName)).toEqual(['Bread'])
  })

  it('still searches by food name', async () => {
    const { result } = load({ q: 'jollof', status: 'AVAILABLE' })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.items.map((l) => l.foodName)).toEqual(['Jollof rice'])
  })

  it('leaves paging to the service when there is no search or area', async () => {
    const { result } = load({ status: 'AVAILABLE', limit: 12 })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.items).toHaveLength(12)
    expect(result.current.data!.total).toBe(119)
    expect(urls()).toHaveLength(1)
    expect(urls()[0].searchParams.get('limit')).toBe('12')
  })

  it('reads "Load more" past 100 listings in pages, never asking for more than 100', async () => {
    // The ninth "Load more" (12 at a time) asks for 108.
    const { result } = load({ status: 'AVAILABLE', limit: 108 })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.isError).toBe(false)
    expect(result.current.data!.items).toHaveLength(108)
    expect(result.current.data!.total).toBe(119)
    expect(urls().map((url) => Object.fromEntries(url.searchParams))).toEqual([
      { availability: 'AVAILABLE', offset: '0', limit: '100' },
      { availability: 'AVAILABLE', offset: '100', limit: '8' },
    ])
  })

  it('shows everything when "Load more" asks for more than there is', async () => {
    const { result } = load({ status: 'all', limit: 132 })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.items).toHaveLength(120)
    expect(result.current.data!.total).toBe(120)
    expect(urls().every((url) => Number(url.searchParams.get('limit')) <= 100)).toBe(true)
  })
})
