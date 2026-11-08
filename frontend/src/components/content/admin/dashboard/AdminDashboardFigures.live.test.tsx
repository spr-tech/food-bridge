// The dashboard's More figures against the live service (mocks off, fetch stubbed): the
// expired count comes from GET /api/admin/dashboard (expiredListings) and links to the
// Expired listings; the food saved totals the quantity listed on each completed handover per
// unit, never adding units together, and leaves out a handover that was reversed.
import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboard } from '@/components/content/admin/dashboard/AdminDashboard'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const DASHBOARD = {
  totalUsers: 6,
  totalDonors: 2,
  totalRecipients: 3,
  totalListings: 52,
  availableListings: 9,
  reservedListings: 4,
  collectedListings: 21,
  expiredListings: 17,
  totalRequests: 80,
  pendingRequests: 5,
  completedHandovers: 21,
  estimatedPortionsSaved: 1240,
}

const listing = (id: string, quantity: number, unit: string, status = 'COLLECTED') => ({
  id,
  foodName: `Food ${id}`,
  description: 'Fresh.',
  category: 'PREPARED_MEALS',
  quantity,
  unit,
  imageReference: null,
  pickupArea: 'Yaba',
  collectionDeadline: '2030-01-01T18:00:00Z',
  status,
  donorId: 'acc-donor',
  donorName: "Mama's Oven",
  createdAt: '2030-01-01T08:00:00Z',
  pendingRequestCount: 0,
})

// Two portion handovers, one in kg, and a reversed one that must not count.
const LISTINGS = [
  listing('3f2b8c1a-0000-4000-8000-000000000001', 30, 'PORTIONS'),
  listing('3f2b8c1a-0000-4000-8000-000000000002', 15, 'PORTIONS'),
  listing('3f2b8c1a-0000-4000-8000-000000000003', 12, 'KG'),
  listing('3f2b8c1a-0000-4000-8000-000000000004', 99, 'PORTIONS', 'REVERSED'),
]

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input) => {
    const url = new URL((input as Request).url)
    if (url.pathname === '/api/admin/dashboard') return Response.json(DASHBOARD)
    if (url.pathname === '/api/admin/distribution/today') {
      return Response.json({
        totalRecipients: 3,
        availableListings: 9,
        approvedListingsToday: 0,
        recipientsServedToday: 0,
        recipientsWaitingToday: 3,
        firstRoundInProgress: true,
      })
    }
    if (url.pathname === '/api/activity') return Response.json([])
    if (url.pathname === '/api/listings') return Response.json(LISTINGS)
    if (url.pathname === '/api/admin/requests') return Response.json([])
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  signInAs('admin')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dashboard More figures (live service)', () => {
  it("shows the service's expired count, linked to the Expired listings", async () => {
    renderRoutes([{ path: '/', element: <AdminDashboard /> }])

    const panel = (await screen.findByRole('heading', { name: 'More figures' })).closest('section')!
    const expired = await within(panel).findByRole('link', { name: /Expired/ })

    expect(expired).toHaveTextContent('17')
    expect(expired).toHaveAttribute('href', '/listings?status=expired')
    expect(expired).toHaveTextContent('Deleted listings aren’t counted.')
  })

  it('shows the food saved as one total per unit, never added together, and explains them', async () => {
    renderRoutes([{ path: '/', element: <AdminDashboard /> }])

    const panel = (await screen.findByRole('heading', { name: 'More figures' })).closest('section')!
    const saved = (await within(panel).findByText('Food saved, by unit')).closest('li')!
    const totals = await within(saved).findByRole('list', { name: 'Food saved by unit' })

    // 30 + 15 portions and 12 kg; the reversed 99 portions are left out.
    expect(within(totals).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '45portions',
      '12kg',
    ])
    expect(saved).toHaveTextContent('From 3 completed handovers, using the quantity each donor listed.')
    expect(saved).toHaveTextContent('Units are kept apart and never converted')
    expect(saved).toHaveTextContent('Reversed handovers aren’t counted.')
    // The service's portions estimate isn't shown until its calculation can be traced.
    expect(saved).not.toHaveTextContent('1,240')
    expect(within(panel).queryByText('—')).not.toBeInTheDocument()
  })
})
