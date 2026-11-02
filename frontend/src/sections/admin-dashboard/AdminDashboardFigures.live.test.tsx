// The dashboard's More figures against the live service (mocks off, fetch stubbed): the
// expired count and the estimate of food saved come from GET /api/admin/dashboard
// (expiredListings, estimatedPortionsSaved), no longer shown as "—".
import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboard } from '@/sections/admin-dashboard/AdminDashboard'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/config/env', () => ({
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
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  signInAs('admin')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dashboard More figures (live service)', () => {
  it("shows the service's expired count and portions saved", async () => {
    renderRoutes([{ path: '/', element: <AdminDashboard /> }])

    const panel = (await screen.findByRole('heading', { name: 'More figures' })).closest('section')!
    const expired = (await within(panel).findByText('Expired')).closest('li')!
    const saved = within(panel).getByText('Food saved (estimate)').closest('li')!

    expect(expired).toHaveTextContent('17')
    expect(saved).toHaveTextContent('1,240 portions')
    expect(within(panel).queryByText('—')).not.toBeInTheDocument()
    expect(within(panel).queryByText(/Awaiting the backend/)).not.toBeInTheDocument()
  })
})
