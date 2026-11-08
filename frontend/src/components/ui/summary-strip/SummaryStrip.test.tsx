// The summary strips over the simulated store, each from data its page already loads.
// Seed: Mama's Oven has 2 Available listings (3 requests waiting on the loaves), 1
// Reserved, 1 Collected and 1 Expired; Hope Community Kitchen has 2 pending requests,
// 1 approved and 3 finished.
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/utilities/constants/routes'
import * as db from '@/mocks/db'
import { RequestsPage } from '@/pages/RequestsPage'
import { YourListingsPage } from '@/pages/YourListingsPage'
import { YourRequestsPage } from '@/pages/YourRequestsPage'
import { renderRoutes, signInAs } from '@/test/render'

async function figures(label: string) {
  const strip = await screen.findByRole('list', { name: label })
  return Object.fromEntries(
    within(strip)
      .getAllByRole('listitem')
      .map((item) => {
        const [name, value] = item.querySelectorAll('p')
        return [name.textContent, value.textContent]
      }),
  )
}

describe('Summary strips', () => {
  it('Your listings: Available, Reserved and the requests waiting on Available listings', async () => {
    signInAs('donor')
    renderRoutes([{ path: ROUTES.yourListings, element: <YourListingsPage /> }], {
      initialEntries: [ROUTES.yourListings],
    })

    expect(await figures('Your listings at a glance')).toEqual({
      Available: '2',
      Reserved: '1',
      'Requests waiting': '3',
    })
  })

  it('Your listings: an approval moves the listing to Reserved and its other requests stop counting', async () => {
    const donor = signInAs('donor')
    db.decideRequest(donor, { requestId: 'req-01', decision: 'APPROVED' })
    renderRoutes([{ path: ROUTES.yourListings, element: <YourListingsPage /> }], {
      initialEntries: [ROUTES.yourListings],
    })

    expect(await figures('Your listings at a glance')).toEqual({
      Available: '1',
      Reserved: '2',
      'Requests waiting': '0',
    })
  })

  it('Your requests: open requests, the approved ones among them, and history', async () => {
    signInAs('recipient')
    renderRoutes([{ path: ROUTES.yourRequests, element: <YourRequestsPage /> }], {
      initialEntries: [ROUTES.yourRequests],
    })

    const summary = await figures('Your requests at a glance')
    expect(summary).toEqual({ 'Open requests': '3', Approved: '1', History: '3' })
    // The figures agree with the tabs.
    expect(screen.getByRole('tab', { name: /Open Requests/ })).toHaveTextContent('3')
    expect(screen.getByRole('tab', { name: /Request History/ })).toHaveTextContent('3')
  })

  it('Requests: listings with requests to decide and the requests waiting', async () => {
    signInAs('donor')
    renderRoutes([{ path: ROUTES.requests, element: <RequestsPage /> }], {
      initialEntries: [ROUTES.requests],
    })

    expect(await figures('Requests at a glance')).toEqual({
      'Listings with requests': '1',
      'Requests waiting': '3',
    })
  })
})
