// Your listings (spec S6) with Listing history: current listings (Available, Reserved)
// apart from finished ones (Collected, Expired); Edit only on Available listings; the tab
// kept in the address, so a reload keeps it; and a listing moving to history as soon as
// its status changes, without a reload.
// Seed, signed in as Mama's Oven: the wholewheat loaves (lst-01) and sausage rolls (lst-05)
// are Available, the pastries (lst-02) Reserved for Hope (req-04), the meat pies (lst-03)
// Collected and the Agege bread (lst-04) Expired.
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listingDetailPath, ROUTES } from '@/constants/routes'
import { ListingDetailPage } from '@/pages/ListingDetailPage'
import { YourListingsPage } from '@/pages/YourListingsPage'
import { renderRoutes, signInAs } from '@/test/render'

vi.setConfig({ testTimeout: 15_000 })

const ROUTES_UNDER_TEST = [
  { path: ROUTES.yourListings, element: <YourListingsPage /> },
  { path: ROUTES.listingDetail, element: <ListingDetailPage /> },
  { path: ROUTES.signIn, element: <h1>Sign in page</h1> },
]

const HISTORY = `${ROUTES.yourListings}?view=history`

function renderAt(path: string) {
  return renderRoutes(ROUTES_UNDER_TEST, { initialEntries: [path] })
}

const panel = () => screen.getByRole('tabpanel')
const namesInPanel = () =>
  within(panel())
    .getAllByRole('heading', { level: 2 })
    .slice(1)
    .map((heading) => heading.textContent)
const editLink = (foodName: string) => screen.queryByRole('link', { name: `Edit ${foodName}` })

beforeEach(() => {
  signInAs('donor')
})

describe('Your listings: current and history', () => {
  it('shows Available and Reserved listings, not Collected or Expired ones', async () => {
    renderAt(ROUTES.yourListings)
    await screen.findByRole('link', { name: 'Sausage rolls' })

    expect(screen.getByRole('tab', { name: /Your listings/ })).toHaveAttribute('aria-selected', 'true')
    expect(namesInPanel()).toEqual(['Sausage rolls', 'Wholewheat bread loaves', 'Assorted pastries'])
  })

  it('offers Edit on Available listings only', async () => {
    renderAt(ROUTES.yourListings)
    await screen.findByRole('link', { name: 'Sausage rolls' })

    expect(editLink('Sausage rolls')).toBeInTheDocument()
    expect(editLink('Wholewheat bread loaves')).toBeInTheDocument()
    expect(editLink('Assorted pastries')).not.toBeInTheDocument()
    // No disabled stand-in either: the line under the details says why.
    expect(screen.queryByRole('button', { name: /Editing unavailable/ })).not.toBeInTheDocument()
    expect(screen.getByText('This listing is reserved and can no longer be edited.')).toBeInTheDocument()
  })

  it('lists Collected and Expired listings in Listing history, with their final status and details', async () => {
    const { router } = renderAt(ROUTES.yourListings)
    await screen.findByRole('link', { name: 'Sausage rolls' })

    await userEvent.setup().click(screen.getByRole('tab', { name: /Listing history/ }))

    expect(router.state.location.search).toBe('?view=history')
    expect(namesInPanel()).toEqual(['Agege bread', 'Meat pies'])
    const meatPies = screen.getByRole('link', { name: 'Meat pies' }).closest('article')!
    expect(within(meatPies).getByText('Collected')).toBeInTheDocument()
    expect(within(meatPies).getByText('30 pieces')).toBeInTheDocument()
    expect(within(meatPies).getByText('Yaba, Lagos')).toBeInTheDocument()
    const agege = screen.getByRole('link', { name: 'Agege bread' }).closest('article')!
    expect(within(agege).getByText('Expired')).toBeInTheDocument()
    expect(editLink('Meat pies')).not.toBeInTheDocument()
    expect(editLink('Agege bread')).not.toBeInTheDocument()
  })

  it('opens on Listing history from its address, as after a reload or signing in again', async () => {
    renderAt(HISTORY)
    await screen.findByRole('link', { name: 'Meat pies' })

    expect(screen.getByRole('tab', { name: /Listing history/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('link', { name: 'Sausage rolls' })).not.toBeInTheDocument()
  })

  it('goes back to the current listings with Back', async () => {
    const { router } = renderAt(ROUTES.yourListings)
    await screen.findByRole('link', { name: 'Sausage rolls' })
    await userEvent.setup().click(screen.getByRole('tab', { name: /Listing history/ }))
    await screen.findByRole('link', { name: 'Meat pies' })

    await act(() => router.navigate(-1))

    expect(await screen.findByRole('link', { name: 'Sausage rolls' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Your listings/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('moves a listing into history as soon as it is marked collected, without a reload', async () => {
    const user = userEvent.setup()
    const { router } = renderAt(ROUTES.yourListings)
    await screen.findByRole('link', { name: 'Assorted pastries' })

    await act(() => router.navigate(listingDetailPath('lst-02')))
    await user.click(await screen.findByRole('button', { name: /^Mark as collected/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark as collected' }))
    await screen.findByText('Marked as collected')

    await act(() => router.navigate(ROUTES.yourListings))
    const historyTab = await screen.findByRole('tab', { name: /Listing history/ })
    await vi.waitFor(() => expect(historyTab).toHaveTextContent('3'))
    expect(screen.queryByRole('link', { name: 'Assorted pastries' })).not.toBeInTheDocument()

    await user.click(historyTab)
    const pastries = (await screen.findByRole('link', { name: 'Assorted pastries' })).closest('article')!
    expect(within(pastries).getByText('Collected')).toBeInTheDocument()
  })
})
