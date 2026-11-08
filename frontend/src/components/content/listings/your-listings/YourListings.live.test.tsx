// Your listings against the live service (mocks off, fetch stubbed): each listing is
// placed by the status the service sends. The service leaves deleted listings out of
// GET /api/listings?mine=true today; if one came back, it would go to Listing history,
// never the current listings, and offer neither Edit nor Delete. An Expired listing, its
// deadline past, stays in Listing history, marked Expired, with Delete and without Edit.
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/utilities/constants/routes'
import { YourListingsPage } from '@/app/pages/YourListingsPage'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const listing = (id: string, foodName: string, status: string, hoursAgo: number, deadline = '2030-01-01T12:00:00Z') => ({
  id,
  foodName,
  description: '',
  category: 'BAKERY',
  quantity: 4,
  unit: 'BOXES',
  imageReference: null,
  pickupArea: 'yaba',
  collectionDeadline: deadline,
  status,
  donorId: 'acc-donor',
  donorName: "Mama's Oven",
  createdAt: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  pendingRequestCount: 0,
})

const MINE = [
  listing('11111111-1111-4111-8111-111111111111', 'Fresh loaves', 'AVAILABLE', 1),
  listing('22222222-2222-4222-8222-222222222222', 'Old cakes', 'DELETED', 2),
  listing('33333333-3333-4333-8333-333333333333', 'Spare yams', 'COLLECTED', 3),
  listing('44444444-4444-4444-8444-444444444444', 'Leftover rice', 'EXPIRED', 4, '2026-01-01T12:00:00Z'),
]

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => Response.json(MINE))
  vi.stubGlobal('fetch', fetchMock)
  signInAs('donor')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Your listings (live service)', () => {
  it('never shows a Deleted listing among the current listings', async () => {
    renderRoutes([{ path: ROUTES.yourListings, element: <YourListingsPage /> }], {
      initialEntries: [ROUTES.yourListings],
    })
    await screen.findByRole('link', { name: 'Fresh loaves' })

    expect(screen.queryByRole('link', { name: 'Old cakes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Spare yams' })).not.toBeInTheDocument()
  })

  it('puts it in Listing history with its status, and offers neither Edit nor Delete', async () => {
    renderRoutes([{ path: ROUTES.yourListings, element: <YourListingsPage /> }], {
      initialEntries: [ROUTES.yourListings],
    })
    await screen.findByRole('link', { name: 'Fresh loaves' })
    await userEvent.setup().click(screen.getByRole('tab', { name: /Listing history/ }))

    const deleted = (await screen.findByRole('link', { name: 'Old cakes' })).closest('article')!
    expect(within(deleted).getByText('Deleted')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit Old cakes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete listing: Old cakes' })).not.toBeInTheDocument()
    // A Collected one shows Delete disabled, with the reason.
    expect(screen.getByRole('button', { name: 'Delete listing: Spare yams' })).toBeDisabled()
  })

  it('keeps an Expired listing in Listing history, marked Expired, with Delete and without Edit', async () => {
    renderRoutes([{ path: ROUTES.yourListings, element: <YourListingsPage /> }], {
      initialEntries: [ROUTES.yourListings],
    })
    await screen.findByRole('link', { name: 'Fresh loaves' })
    expect(screen.queryByRole('link', { name: 'Leftover rice' })).not.toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('tab', { name: /Listing history/ }))

    const expired = (await screen.findByRole('link', { name: 'Leftover rice' })).closest('article')!
    expect(within(expired).getByText('Expired')).toBeInTheDocument()
    expect(within(expired).queryByRole('link', { name: 'Edit Leftover rice' })).not.toBeInTheDocument()
    expect(within(expired).getByRole('button', { name: 'Delete listing: Leftover rice' })).toBeEnabled()
  })
})
