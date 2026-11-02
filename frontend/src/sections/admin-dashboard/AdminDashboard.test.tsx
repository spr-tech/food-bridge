// The administrator's dashboard over the simulated store: the summary, today's
// distribution (the daily fairness rule's progress) and recent activity, each loading on
// its own.
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/constants/routes'
import * as db from '@/mocks/db'
import { DashboardPage } from '@/pages/DashboardPage'
import { renderRoutes, signInAs } from '@/test/render'

function renderDashboard() {
  return renderRoutes([{ path: ROUTES.admin, element: <DashboardPage /> }], {
    initialEntries: [ROUTES.admin],
  })
}

const section = (name: string) => screen.getByRole('region', { name })

describe('Admin dashboard', () => {
  it("shows today's distribution: nobody served yet, so the first round is in progress", async () => {
    signInAs('admin')
    renderDashboard()

    await screen.findByText(/First round in progress/)
    const today = section('Today’s distribution')
    // The seed has three recipient organisations and no approvals today.
    expect(within(today).getByText('0 of 3')).toBeInTheDocument()
    expect(within(today).getByText('Still waiting').nextElementSibling).toHaveTextContent('3')
    expect(within(today).getByText('Approved today').nextElementSibling).toHaveTextContent('0')
  })

  it('counts an approval made today', async () => {
    const donor = signInAs('donor')
    db.decideRequest(donor, { requestId: 'req-01', decision: 'APPROVED' })
    signInAs('admin')
    renderDashboard()

    await screen.findByText(/First round in progress/)
    const today = section('Today’s distribution')
    expect(within(today).getByText('1 of 3')).toBeInTheDocument()
    expect(within(today).getByText('Still waiting').nextElementSibling).toHaveTextContent('2')
    expect(within(today).getByText('Approved today').nextElementSibling).toHaveTextContent('1')
  })

  it('lists recent activity, newest first, linking to the listing', async () => {
    signInAs('admin')
    renderDashboard()

    const activity = await screen.findByRole('region', { name: 'Recent activity' })
    const rows = await within(activity).findAllByRole('listitem')
    expect(rows).toHaveLength(10)
    // The newest seeded event: Grace Shelter's request for the loaves, half an hour ago.
    expect(rows[0]).toHaveTextContent('Grace Shelter requested food: Wholewheat bread loaves')
    expect(within(rows[0]).getByRole('link', { name: 'Wholewheat bread loaves' })).toHaveAttribute(
      'href',
      '/listings/lst-01',
    )
  })
})
