// Completed handovers over the simulated store: the seeded collected listing (Meat pies,
// Mama's Oven to Grace Shelter), opened from the dashboard card, plus its empty and
// error states. The simulated store keeps no collection times.
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ROUTES } from '@/constants/routes'
import * as db from '@/mocks/db'
import { CompletedHandoversPage } from '@/pages/CompletedHandoversPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { renderRoutes, signInAs } from '@/test/render'

const originalMatchMedia = window.matchMedia

function setDesktop() {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

function renderHandovers(path: string = ROUTES.completedHandovers) {
  return renderRoutes(
    [
      { path: ROUTES.admin, element: <DashboardPage /> },
      { path: ROUTES.completedHandovers, element: <CompletedHandoversPage /> },
    ],
    { initialEntries: [path] },
  )
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
  window.history.replaceState(null, '', '/')
})

describe('Completed handovers', () => {
  it('opens from the Completed handovers card on the dashboard', async () => {
    signInAs('admin')
    const user = userEvent.setup()
    renderHandovers(ROUTES.admin)

    // The dashboard loads several parts at once, which can be slow on a busy test run.
    const card = await screen.findByRole('link', { name: /Completed handovers/ }, { timeout: 5000 })
    expect(card).toHaveAttribute('href', ROUTES.completedHandovers)

    await user.click(card)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Completed handovers' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('lists each collected listing with its donor, recipient, quantity and status (desktop table)', async () => {
    setDesktop()
    signInAs('admin')
    renderHandovers()

    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(2)

    const cells = within(rows[1]).getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('Meat pies')
    expect(within(cells[0]).getByRole('link', { name: 'Meat pies' })).toHaveAttribute('href', '/listings/lst-03')
    expect(cells[1]).toHaveTextContent("Mama's Oven")
    expect(cells[2]).toHaveTextContent('Grace Shelter')
    expect(cells[3]).toHaveTextContent('30 pieces')
    // The simulated store records no collection time, so none is invented.
    expect(cells[4]).toHaveTextContent('Not recorded')
    expect(cells[5]).toHaveTextContent('Collected')
  })

  it('shows the same record as a card on a phone, with summary figures', async () => {
    signInAs('admin')
    renderHandovers()

    const summary = await screen.findByRole('list', { name: 'Handovers at a glance' })
    expect(within(summary).getByText('Handovers').nextElementSibling).toHaveTextContent('1')
    expect(within(summary).getByText('Recipient organisations').nextElementSibling).toHaveTextContent('1')

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    const records = screen.getByRole('region', { name: 'Handover records' })
    expect(within(records).getByText('Recipient').nextElementSibling).toHaveTextContent('Grace Shelter')
    expect(within(records).getByText('Quantity').nextElementSibling).toHaveTextContent('30 pieces')
  })

  it('adds a handover once a donor marks an approved request as collected', async () => {
    const donor = signInAs('donor')
    // req-04 is Hope Community Kitchen's approved request for Assorted pastries.
    db.markCollected(donor, { requestId: 'req-04' })
    signInAs('admin')
    renderHandovers()

    const records = await screen.findByRole('region', { name: 'Handover records' })
    expect(within(records).getByRole('link', { name: 'Assorted pastries' })).toBeInTheDocument()
    expect(within(records).getByText('Hope Community Kitchen')).toBeInTheDocument()
  })

  it('invites the administrator to browse listings when nothing has been collected', async () => {
    window.history.replaceState(null, '', '/?simulate=empty')
    signInAs('admin')
    renderHandovers()

    expect(await screen.findByRole('heading', { name: 'No completed handovers yet' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Browse all listings' })).toBeInTheDocument()
  })

  it('offers Try again when the handovers fail to load', async () => {
    window.history.replaceState(null, '', '/?simulate=error')
    signInAs('admin')
    renderHandovers()

    expect(await screen.findByRole('heading', { name: "We couldn't load completed handovers." })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
  })
})
