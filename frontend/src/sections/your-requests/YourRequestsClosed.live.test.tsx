// A recipient's requests against the live service (mocks off, fetch stubbed), split into
// Open requests and Request history. The service leaves a request as it was when its
// listing moves on, so the listing decides: a pending request on a deleted listing, and an
// approval whose handover was reversed, are finished and belong in history. Since the
// service now marks a reversed handover's request REVERSED (and reopens the listing), that
// request is history too, never Pending.
import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { YourRequests } from '@/sections/your-requests/YourRequests'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/config/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const listing = (n: number, foodName: string, status: string) => ({
  id: id(n),
  foodName,
  description: 'Freshly made',
  category: 'BAKERY',
  quantity: 4,
  unit: 'BOXES',
  imageReference: null,
  pickupArea: 'surulere',
  collectionDeadline: '2030-01-01T12:00:00Z',
  status,
  donorId: 'acc-donor',
  donorName: "Mama's Oven",
  createdAt: '2026-11-01T09:00:00Z',
  pendingRequestCount: 0,
  deleted: status === 'DELETED',
  deletedAt: null,
})

const LISTINGS = [
  listing(1, 'Fresh bread', 'AVAILABLE'),
  listing(2, 'Moi moi', 'DELETED'),
  listing(3, 'Jollof rice', 'REVERSED'),
  listing(4, 'Plantain', 'AVAILABLE'),
]

const REQUESTS = [
  { id: id(11), listingId: id(1), status: 'PENDING' },
  { id: id(12), listingId: id(2), status: 'PENDING' },
  { id: id(13), listingId: id(3), status: 'APPROVED' },
  { id: id(14), listingId: id(4), status: 'REVERSED' },
].map((request) => ({
  ...request,
  recipientId: 'acc-recipient',
  recipientName: 'Hope Shelter',
  createdAt: '2026-11-01T10:00:00Z',
}))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input) => {
    const url = new URL((input as Request).url)
    if (url.pathname === '/api/requests') return Response.json(REQUESTS)
    const found = LISTINGS.find((row) => url.pathname === `/api/listings/${row.id}`)
    return found ? Response.json(found) : new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  signInAs('recipient')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Your requests: finished requests (live service)', () => {
  it('keeps only the genuinely pending request open; deleted and reversed ones are history', async () => {
    renderRoutes([{ path: '/', element: <YourRequests /> }])

    const open = await screen.findByRole('tab', { name: /Open Requests/ })
    const history = screen.getByRole('tab', { name: /Request History/ })

    expect(await within(open).findByText('1')).toBeInTheDocument()
    expect(within(history).getByText('3')).toBeInTheDocument()
    expect(within(screen.getByRole('tabpanel')).getByText('Fresh bread')).toBeInTheDocument()
    expect(within(screen.getByRole('tabpanel')).queryByText('Moi moi')).not.toBeInTheDocument()
    expect(within(screen.getByRole('tabpanel')).queryByText('Jollof rice')).not.toBeInTheDocument()
    expect(within(screen.getByRole('tabpanel')).queryByText('Plantain')).not.toBeInTheDocument()
  })
})
