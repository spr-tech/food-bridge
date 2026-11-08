// The administrator's dashboard over the simulated store: the summary, today's
// distribution (the daily fairness rule's progress) and recent activity, each loading on
// its own. The Requests waiting and Expired cards open the views they count.
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/utilities/constants/routes'
import * as db from '@/mocks/db'
import { DashboardPage } from '@/app/pages/DashboardPage'
import { renderRoutes, signInAs } from '@/test/render'

function renderDashboard() {
  return renderRoutes([{ path: ROUTES.admin, element: <DashboardPage /> }], {
    initialEntries: [ROUTES.admin],
  })
}

vi.setConfig({ testTimeout: 15_000 })

const section = (name: string) => screen.getByRole('region', { name })

describe('Admin dashboard', () => {
  it('opens the requests waiting from the Requests waiting card', async () => {
    signInAs('admin')
    const { router } = renderRoutes(
      [
        { path: ROUTES.admin, element: <DashboardPage /> },
        { path: ROUTES.adminRequests, element: <h1>Requests waiting page</h1> },
      ],
      { initialEntries: [ROUTES.admin] },
    )

    const card = await screen.findByRole('link', { name: /Requests waiting/ }, { timeout: 5000 })
    await userEvent.setup().click(card)

    expect(await screen.findByRole('heading', { name: 'Requests waiting page' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(ROUTES.adminRequests)
  })

  it('opens the Expired listings from the Expired card, by keyboard too', async () => {
    signInAs('admin')
    const { router } = renderRoutes(
      [
        { path: ROUTES.admin, element: <DashboardPage /> },
        { path: ROUTES.listings, element: <h1>All listings page</h1> },
      ],
      { initialEntries: [ROUTES.admin] },
    )

    const card = await screen.findByRole('link', { name: /^Expired/ }, { timeout: 5000 })
    card.focus()
    await userEvent.setup().keyboard('{Enter}')

    expect(await screen.findByRole('heading', { name: 'All listings page' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(ROUTES.listings)
    expect(router.state.location.search).toBe('?status=expired')
  })

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
    // Five at a time.
    expect(rows).toHaveLength(5)
    // The newest seeded event: Grace Shelter's request for the loaves, half an hour ago.
    expect(rows[0]).toHaveTextContent('Grace Shelter requested food: Wholewheat bread loaves')
    expect(within(rows[0]).getByRole('link', { name: 'Wholewheat bread loaves' })).toHaveAttribute(
      'href',
      '/listings/lst-01',
    )
  })

  it('shows five more entries at a time, then back to five with Show less', async () => {
    signInAs('admin')
    const user = userEvent.setup()
    renderDashboard()

    const activity = await screen.findByRole('region', { name: 'Recent activity' })
    await within(activity).findAllByRole('listitem')
    const total = Number(within(activity).getByText(/^Showing 5 of \d+$/).textContent?.match(/of (\d+)/)?.[1])
    expect(total).toBeGreaterThan(10)
    expect(within(activity).queryByRole('button', { name: 'Show less' })).not.toBeInTheDocument()

    await user.click(within(activity).getByRole('button', { name: 'Show more' }))
    expect(within(activity).getAllByRole('listitem')).toHaveLength(10)
    expect(within(activity).getByText(`Showing 10 of ${total}`)).toBeInTheDocument()

    await user.click(within(activity).getByRole('button', { name: 'Show less' }))
    expect(within(activity).getAllByRole('listitem')).toHaveLength(5)
    // Focus moves to Show more, which stays, rather than being lost with Show less.
    expect(within(activity).getByRole('button', { name: 'Show more' })).toHaveFocus()
  })

  it('stops at the last entry: Show more is marked unavailable', async () => {
    signInAs('admin')
    const user = userEvent.setup()
    renderDashboard()

    const activity = await screen.findByRole('region', { name: 'Recent activity' })
    await within(activity).findAllByRole('listitem')
    const showMore = within(activity).getByRole('button', { name: 'Show more' })
    while (showMore.getAttribute('aria-disabled') !== 'true') await user.click(showMore)

    const total = within(activity).getAllByRole('listitem').length
    expect(within(activity).getByText(`Showing ${total} of ${total}`)).toBeInTheDocument()
    await user.click(showMore)
    expect(within(activity).getAllByRole('listitem')).toHaveLength(total)
  })
})
