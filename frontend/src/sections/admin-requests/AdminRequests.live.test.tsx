// Requests waiting (/admin/requests) against the live service (mocks off, fetch stubbed).
// Only a Pending request on an Available listing waits for a decision. The service also
// leaves requests Pending on listings that have moved on (here Collected and Deleted, as
// observed on 2 November 2026); those are listed apart, without actions, each saying no
// decision is due, and a note explains why the dashboard's figure is higher. Only an
// administrator can open the page.
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canOpen } from '@/app/routes'
import { ROUTES } from '@/constants/routes'
import { AdminRequestsPage } from '@/pages/AdminRequestsPage'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/config/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

vi.setConfig({ testTimeout: 15_000 })

const AVAILABLE_ID = '5a1c0000-0000-4000-8000-000000000001'
const COLLECTED_ID = '5a1c0000-0000-4000-8000-000000000002'
const DELETED_ID = '5a1c0000-0000-4000-8000-000000000003'

const listing = (id: string, foodName: string, status: string, deleted = false) => ({
  id,
  foodName,
  description: 'Fresh.',
  category: 'PREPARED_MEALS',
  quantity: 20,
  unit: 'PORTIONS',
  imageReference: null,
  pickupArea: 'yaba',
  collectionDeadline: '2030-01-01T18:00:00Z',
  status,
  donorId: 'acc-donor',
  donorName: "Mama's Oven",
  createdAt: '2030-01-01T08:00:00Z',
  pendingRequestCount: 0,
  deleted,
  deletedAt: deleted ? '2030-01-01T09:00:00Z' : null,
})

const LISTINGS: Record<string, ReturnType<typeof listing>> = {
  [AVAILABLE_ID]: listing(AVAILABLE_ID, 'Jollof rice', 'AVAILABLE'),
  [COLLECTED_ID]: listing(COLLECTED_ID, 'Meat pies', 'COLLECTED'),
  [DELETED_ID]: listing(DELETED_ID, 'Agege bread', 'DELETED', true),
}

const request = (id: string, listingId: string, recipientName: string) => ({
  id,
  listingId,
  recipientId: `rec-${id}`,
  recipientName,
  status: 'PENDING',
  createdAt: '2030-01-01T10:00:00Z',
})

// Two waiting, two on listings that moved on.
const MIXED = [
  request('r1', AVAILABLE_ID, 'Grace Shelter'),
  request('r2', AVAILABLE_ID, 'Hope Kitchen'),
  request('r3', COLLECTED_ID, 'Ajegunle Youth Centre'),
  request('r4', DELETED_ID, 'Grace Shelter'),
]

// As on 2 November 2026: every pending request is on a Collected or Deleted listing.
const ALL_STALE = [
  request('s1', COLLECTED_ID, 'Grace Shelter'),
  request('s2', COLLECTED_ID, 'Hope Kitchen'),
  request('s3', DELETED_ID, 'Ajegunle Youth Centre'),
]

let PENDING = MIXED

const fetchMock = vi.fn<typeof fetch>()
let failListing = false

beforeEach(() => {
  failListing = false
  PENDING = MIXED
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input) => {
    const url = new URL((input as Request).url)
    if (url.pathname === '/api/admin/requests') {
      expect(url.searchParams.get('status')).toBe('PENDING')
      return Response.json(PENDING, { headers: { 'X-Total-Count': String(PENDING.length) } })
    }
    const match = url.pathname.match(/^\/api\/listings\/(.+)$/)
    if (match) {
      if (failListing) return new Response(null, { status: 500 })
      return Response.json(LISTINGS[match[1]])
    }
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  signInAs('admin')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderPage() {
  return renderRoutes([{ path: ROUTES.adminRequests, element: <AdminRequestsPage /> }], {
    initialEntries: [ROUTES.adminRequests],
  })
}

describe('Requests waiting (live service)', () => {
  it('lists only Pending requests on Available listings as waiting', async () => {
    renderPage()

    const waiting = await screen.findByRole('region', { name: 'Waiting for a decision' })
    const rows = within(waiting).getAllByRole('article')
    expect(rows).toHaveLength(2)
    expect(within(waiting).getAllByRole('link', { name: 'Jollof rice' })).toHaveLength(2)
    expect(within(waiting).getByText('Grace Shelter')).toBeInTheDocument()
    expect(within(waiting).getByText('Hope Kitchen')).toBeInTheDocument()
    expect(within(waiting).queryByText('Meat pies')).not.toBeInTheDocument()

    const glance = screen.getByRole('list', { name: 'Requests at a glance' })
    expect(glance).toHaveTextContent('Requests waiting2For a donor decision')
    expect(glance).toHaveTextContent('Listings1Available, with requests waiting')
  })

  it("lists requests left pending on listings that moved on apart, and says no decision is due", async () => {
    renderPage()

    const apart = await screen.findByRole('region', { name: 'Still marked pending, no decision due' })
    expect(apart).toHaveTextContent('The service still marks 2 requests as pending on listings that are no longer available.')

    await userEvent.setup().click(within(apart).getByText('Show these requests'))
    expect(within(apart).getByRole('link', { name: 'Meat pies' })).toBeVisible()
    expect(within(apart).getByRole('link', { name: 'Agege bread' })).toBeVisible()
    expect(within(apart).getByText('Collected')).toBeInTheDocument()
    expect(within(apart).getByText('Deleted')).toBeInTheDocument()
  })

  it("fails as a whole, with Try again, when a listing can't be read", async () => {
    failListing = true
    renderPage()

    expect(await screen.findByText("We couldn't load the requests.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Waiting for a decision' })).not.toBeInTheDocument()
  })

  it('says nothing is waiting when every pending request is on a listing that moved on, and explains the gap', async () => {
    PENDING = ALL_STALE
    renderPage()

    const waiting = await screen.findByRole('region', { name: 'Waiting for a decision' })
    expect(within(waiting).getByText('No requests waiting')).toBeInTheDocument()
    expect(within(waiting).queryByRole('article')).not.toBeInTheDocument()

    const glance = screen.getByRole('list', { name: 'Requests at a glance' })
    expect(glance).toHaveTextContent('Requests waiting0')
    expect(glance).toHaveTextContent('Listings0')
    expect(glance).toHaveTextContent('No decision due3')

    expect(
      screen.getByText(
        /The service marks 3 requests as pending, and the dashboard's Requests waiting figure counts them all\. None of them is on an available listing/,
      ),
    ).toHaveTextContent('(2 collected and 1 deleted), so no decision is due on them.')
  })

  it("shows requests with no decision due without actions, each saying why", async () => {
    PENDING = ALL_STALE
    const user = userEvent.setup()
    renderPage()

    const apart = await screen.findByRole('region', { name: 'Still marked pending, no decision due' })
    await user.click(within(apart).getByText('Show these requests'))

    const rows = within(apart).getAllByRole('article')
    expect(rows).toHaveLength(3)
    expect(within(apart).getAllByText('No decision due: the listing is collected.')).toHaveLength(2)
    expect(within(apart).getByText('No decision due: the listing is deleted.')).toBeInTheDocument()
    expect(within(apart).queryByRole('button', { name: /Approve|Decline/ })).not.toBeInTheDocument()
  })

  it('shows no note and nothing apart when every pending request is waiting', async () => {
    PENDING = MIXED.slice(0, 2)
    renderPage()

    await screen.findByRole('region', { name: 'Waiting for a decision' })
    expect(screen.queryByRole('region', { name: 'Still marked pending, no decision due' })).not.toBeInTheDocument()
    expect(screen.queryByText(/The service marks/)).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Requests at a glance' })).toHaveTextContent('No decision due0')
  })
})

describe('Requests waiting: who can open it', () => {
  it('is for administrators only', () => {
    expect(canOpen('admin', ROUTES.adminRequests)).toBe(true)
    expect(canOpen('donor', ROUTES.adminRequests)).toBe(false)
    expect(canOpen('recipient', ROUTES.adminRequests)).toBe(false)
  })
})
