// Delete listing on the donor's Your listings rows and on Listing details: who is offered
// it, the confirmation (Cancel deletes nothing), a confirmed delete (the listing leaves the
// screen and the store, and the page goes back to that role's list), a refused one (the
// dialog says so and the listing stays) and a 401 (the session ends).
// Seed, signed in as Mama's Oven: the wholewheat loaves (lst-01) and sausage rolls (lst-05)
// are Available, the pastries (lst-02) Reserved, the meat pies (lst-03) Collected and the
// Agege bread (lst-04) Expired; the jollof rice (lst-06) is Eko Caterers'.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/app/session'
import { listingDetailPath, ROUTES } from '@/constants/routes'
import * as db from '@/mocks/db'
import { ListingDetailPage } from '@/pages/ListingDetailPage'
import { YourListingsPage } from '@/pages/YourListingsPage'
import { renderRoutes, signInAs } from '@/test/render'
import type { Session } from '@/types/api'

// When set, the store refuses every delete with this status.
const refusal = vi.hoisted(() => ({ status: null as null | number }))

vi.mock('@/mocks/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/mocks/db')>()
  return {
    ...actual,
    deleteListing: (...args: Parameters<typeof actual.deleteListing>) => {
      if (refusal.status) throw new actual.MockApiError(refusal.status, 'REFUSED', 'Refused for the test.')
      return actual.deleteListing(...args)
    },
  }
})

vi.setConfig({ testTimeout: 15_000 })

const ROUTES_UNDER_TEST = [
  { path: ROUTES.listingDetail, element: <ListingDetailPage /> },
  { path: ROUTES.yourListings, element: <YourListingsPage /> },
  { path: ROUTES.listings, element: <h1>All listings page</h1> },
  { path: ROUTES.signIn, element: <h1>Sign in page</h1> },
]

// Reads the store as the administrator without changing who is signed in.
const ADMIN: Session = { token: 't', accountId: 'acc-admin', role: 'admin', organisationName: '', email: '' }
const stored = () => db.listListings(ADMIN, { status: 'all' }).items.map((listing) => listing.id)

const deleteButton = (foodName: string) => screen.queryByRole('button', { name: `Delete listing: ${foodName}` })
// hidden: the open dialog hides the page behind it from assistive technology.
const rowLink = (foodName: string) => screen.queryByRole('link', { name: foodName, hidden: true })

async function confirmDelete(user: UserEvent, foodName: string) {
  await user.click(deleteButton(foodName)!)
  const dialog = await screen.findByRole('dialog', { name: 'Delete this listing?' })
  await user.click(within(dialog).getByRole('button', { name: 'Delete listing' }))
  return dialog
}

async function openDetails(who: 'donor' | 'recipient' | 'admin', id: string, foodName: string) {
  signInAs(who)
  const view = renderRoutes(ROUTES_UNDER_TEST, { initialEntries: [listingDetailPath(id)] })
  await screen.findByRole('heading', { level: 1, name: foodName })
  return view
}

beforeEach(() => {
  refusal.status = null
})

describe('Your listings rows', () => {
  beforeEach(async () => {
    signInAs('donor')
    renderRoutes(ROUTES_UNDER_TEST, { initialEntries: [ROUTES.yourListings] })
    await screen.findByRole('link', { name: 'Sausage rolls' })
  })

  it("offers delete on the donor's Available and Expired listings", () => {
    expect(deleteButton('Wholewheat bread loaves')).toBeInTheDocument()
    expect(deleteButton('Sausage rolls')).toBeInTheDocument()
    expect(deleteButton('Agege bread')).toBeInTheDocument()
  })

  it('does not offer it on Reserved or Collected listings', () => {
    expect(deleteButton('Assorted pastries')).not.toBeInTheDocument()
    expect(deleteButton('Meat pies')).not.toBeInTheDocument()
  })

  it('asks first, with Cancel focused, and Cancel deletes nothing', async () => {
    const user = userEvent.setup()
    await user.click(deleteButton('Sausage rolls')!)

    const dialog = await screen.findByRole('dialog', { name: 'Delete this listing?' })
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' })
    expect(cancel).toHaveFocus()

    await user.click(cancel)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deleteButton('Sausage rolls')).toHaveFocus()
    expect(rowLink('Sausage rolls')).toBeInTheDocument()
    expect(stored()).toContain('lst-05')
  })

  it('closes on Escape and deletes nothing', async () => {
    const user = userEvent.setup()
    await user.click(deleteButton('Sausage rolls')!)
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(stored()).toContain('lst-05')
  })

  it('removes the row once the service confirms, and says so', async () => {
    const user = userEvent.setup()
    await confirmDelete(user, 'Sausage rolls')

    expect(await screen.findByText('Listing deleted')).toBeInTheDocument()
    await waitFor(() => expect(rowLink('Sausage rolls')).not.toBeInTheDocument())
    expect(stored()).not.toContain('lst-05')
  })

  it('keeps the listing and says why when the delete is refused', async () => {
    refusal.status = 500
    const user = userEvent.setup()
    const dialog = await confirmDelete(user, 'Sausage rolls')

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      "The listing wasn't deleted. Check your connection and try again.",
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(rowLink('Sausage rolls')).toBeInTheDocument()
    expect(stored()).toContain('lst-05')
  })

  it('explains a 409 (the listing changed meanwhile)', async () => {
    refusal.status = 409
    const user = userEvent.setup()
    const dialog = await confirmDelete(user, 'Sausage rolls')

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('This listing can no longer be deleted.')
    expect(stored()).toContain('lst-05')
  })

  it('ends the session on a 401', async () => {
    refusal.status = 401
    const user = userEvent.setup()
    await confirmDelete(user, 'Sausage rolls')

    expect(await screen.findByRole('heading', { name: 'Sign in page' })).toBeInTheDocument()
    expect(getSession()).toBeNull()
    expect(stored()).toContain('lst-05')
  })
})

describe('Listing details', () => {
  it.each([
    ['lst-01', 'Wholewheat bread loaves'],
    ['lst-04', 'Agege bread'],
  ])('offers delete to the donor who owns an Available or Expired listing (%s)', async (id, foodName) => {
    await openDetails('donor', id, foodName)
    expect(deleteButton(foodName)).toBeInTheDocument()
  })

  it.each([
    ['lst-02', 'Assorted pastries'],
    ['lst-03', 'Meat pies'],
  ])("does not offer it on the donor's Reserved or Collected listing (%s)", async (id, foodName) => {
    await openDetails('donor', id, foodName)
    expect(deleteButton(foodName)).not.toBeInTheDocument()
  })

  it("does not offer it on another donor's listing", async () => {
    await openDetails('donor', 'lst-06', 'Jollof rice and chicken')
    expect(deleteButton('Jollof rice and chicken')).not.toBeInTheDocument()
  })

  it('does not offer it to a recipient', async () => {
    await openDetails('recipient', 'lst-05', 'Sausage rolls')
    expect(deleteButton('Sausage rolls')).not.toBeInTheDocument()
  })

  it.each([
    ['lst-06', 'Jollof rice and chicken'],
    ['lst-02', 'Assorted pastries'],
    ['lst-03', 'Meat pies'],
  ])('offers it to an administrator on any listing (%s)', async (id, foodName) => {
    await openDetails('admin', id, foodName)
    expect(deleteButton(foodName)).toBeInTheDocument()
  })

  it('takes the donor back to Your listings after deleting', async () => {
    const { router } = await openDetails('donor', 'lst-05', 'Sausage rolls')
    await confirmDelete(userEvent.setup(), 'Sausage rolls')

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.yourListings))
    expect(stored()).not.toContain('lst-05')
  })

  it('takes an administrator back to All listings after deleting', async () => {
    const { router } = await openDetails('admin', 'lst-06', 'Jollof rice and chicken')
    await confirmDelete(userEvent.setup(), 'Jollof rice and chicken')

    await waitFor(() => expect(router.state.location.pathname).toBe(ROUTES.listings))
    expect(stored()).not.toContain('lst-06')
  })

  it('stays on the listing when the delete is refused', async () => {
    refusal.status = 500
    const { router } = await openDetails('donor', 'lst-05', 'Sausage rolls')
    const dialog = await confirmDelete(userEvent.setup(), 'Sausage rolls')

    expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(listingDetailPath('lst-05'))
    expect(stored()).toContain('lst-05')
  })
})
