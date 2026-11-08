// Find food's Expired and Deleted statuses against the live service (mocks off, fetch
// stubbed). The stub copies what the deployed service did on 2 November 2026:
// - availability=EXPIRED returned the expired listing and every deleted one (status DELETED,
//   deleted true), a backend defect
// - availability=DELETED was refused, 400 INVALID_LISTING
// - with no availability, an administrator gets deleted listings too; a recipient never does
// The page keeps each listing by the status it carries, says how many deleted listings came
// back for Expired, and offers administrators a Deleted status of its own.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/utilities/constants/routes'
import { BrowsePage } from '@/app/pages/BrowsePage'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

vi.setConfig({ testTimeout: 15_000 })

let n = 0
const row = (foodName: string, status: string, deleted = false) => ({
  id: `7e000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
  foodName,
  description: 'Freshly made',
  category: 'BAKERY',
  quantity: 4,
  unit: 'BOXES',
  imageReference: null,
  pickupArea: 'yaba',
  // Past, like the deleted listings whose deadline had also gone by.
  collectionDeadline: '2026-01-01T12:00:00Z',
  status,
  donorId: 'acc-donor',
  donorName: 'Eko Caterers',
  createdAt: new Date(Date.now() - n * 60_000).toISOString(),
  pendingRequestCount: 0,
  deleted,
  deletedAt: deleted ? '2026-01-01T13:00:00Z' : null,
})

const ROWS = [
  row('Fresh bread', 'AVAILABLE'),
  row('Old pastries', 'EXPIRED'),
  row('Removed rolls', 'DELETED', true),
  row('Removed buns', 'DELETED', true),
]

let viewer: 'admin' | 'recipient' = 'admin'

function serve(url: URL) {
  const availability = url.searchParams.get('availability')
  if (availability === 'DELETED') {
    return Response.json({ code: 'INVALID_LISTING', message: 'INVALID_LISTING' }, { status: 400 })
  }
  const visible = viewer === 'admin' ? ROWS : ROWS.filter((r) => !r.deleted)
  const matches = visible.filter(
    (r) => !availability || r.status === availability || (availability === 'EXPIRED' && r.deleted),
  )
  return Response.json(matches, { headers: { 'X-Total-Count': String(matches.length) } })
}

const fetchMock = vi.fn<typeof fetch>()
const availabilityAsked = () =>
  fetchMock.mock.calls
    .map(([input]) => new URL((input as Request).url))
    .filter((url) => url.pathname === '/api/listings')
    .map((url) => url.searchParams.get('availability'))

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input) => {
    const url = new URL((input as Request).url)
    if (url.pathname === '/api/listings') return serve(url)
    if (url.pathname === '/api/requests') return Response.json([])
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderBrowse(who: 'admin' | 'recipient', search = '') {
  viewer = who
  signInAs(who)
  return renderRoutes([{ path: ROUTES.listings, element: <BrowsePage /> }], {
    initialEntries: [`${ROUTES.listings}${search}`],
  })
}

async function choose(user: UserEvent, label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

const cardFor = (foodName: string) => screen.getByRole('heading', { level: 2, name: foodName }).closest('li')!

describe('Find food statuses (live service)', () => {
  it('shows an administrator only expired listings under Expired, and says deleted ones came back too', async () => {
    renderBrowse('admin', '?status=expired')

    expect(await screen.findByRole('heading', { level: 2, name: 'Old pastries' })).toBeInTheDocument()
    expect(within(cardFor('Old pastries')).getByText('Expired')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Removed rolls' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Removed buns' })).not.toBeInTheDocument()
    expect(screen.getByText('1 listing')).toBeInTheDocument()
    expect(
      screen.getByText(/The service also returned 2 deleted listings for this filter\. Deleted listings aren't expired/),
    ).toBeInTheDocument()
  })

  it('gives an administrator a Deleted status, read without the refused availability=DELETED', async () => {
    const user = userEvent.setup()
    const { router } = renderBrowse('admin', '?status=expired')

    await user.click(await screen.findByRole('button', { name: 'Show deleted listings' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Removed rolls' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Removed buns' })).toBeInTheDocument()
    expect(within(cardFor('Removed rolls')).getByText('Deleted')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: 'Old pastries' })).not.toBeInTheDocument()
    expect(screen.getByText('2 listings')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?status=deleted')
    expect(availabilityAsked()).not.toContain('DELETED')

    // The same status from the menu.
    await choose(user, 'Status', 'Expired')
    await choose(user, 'Status', 'Deleted')
    expect(await screen.findByRole('heading', { level: 2, name: 'Removed buns' })).toBeInTheDocument()
  })

  it("doesn't offer a recipient the Deleted status, even from the address", async () => {
    const user = userEvent.setup()
    renderBrowse('recipient', '?status=deleted')

    // Falls back to Available.
    expect(await screen.findByRole('heading', { level: 2, name: 'Fresh bread' })).toBeInTheDocument()
    expect(availabilityAsked()).toEqual(['AVAILABLE'])

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(await screen.findByRole('option', { name: 'Expired' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Deleted' })).not.toBeInTheDocument()
  })

  it("never lists expired food as available, and an expired listing can't be requested", async () => {
    const user = userEvent.setup()
    renderBrowse('recipient')

    await screen.findByRole('heading', { level: 2, name: 'Fresh bread' })
    expect(screen.queryByRole('heading', { level: 2, name: 'Old pastries' })).not.toBeInTheDocument()

    await choose(user, 'Status', 'Expired')
    await screen.findByRole('heading', { level: 2, name: 'Old pastries' })
    const card = cardFor('Old pastries')
    expect(within(card).getByRole('button', { name: 'Expired: Old pastries' })).toBeDisabled()
    expect(within(card).queryByRole('button', { name: /Request food/ })).not.toBeInTheDocument()
    // A recipient's Expired view doesn't mention deleted listings: the service sends them none.
    await waitFor(() => expect(screen.getByText('1 listing')).toBeInTheDocument())
    expect(screen.queryByText(/deleted listings/)).not.toBeInTheDocument()
  })
})
