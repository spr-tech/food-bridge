
// Listing details, donor view (spec S5): the requests panel's five states; its rules (one
// approved request, first, the others Declined; Expired on an expired listing; no panel
// for any other donor); the optimistic Approve with both rollbacks (409 and a dropped
// connection) and the focus move; Decline; and the navigation count after approving.
// Signed in as Mama's Oven. Seed: the wholewheat loaves (lst-01) have three Pending
// requests, from Hope Community Kitchen, Ajegunle Food Bank and Grace Shelter, in that
// order; the assorted pastries (lst-02) are reserved for Hope, Ajegunle declined; the
// Agege bread (lst-04) expired with Hope's request pending; the sausage rolls (lst-05)
// have none; the jollof rice (lst-06) is Eko Caterers'.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireSession } from '@/components/layouts/RequireSession'
import { listingDetailPath, ROUTES } from '@/utilities/constants/routes'
import * as db from '@/mocks/db'
import { ListingDetailPage } from '@/app/pages/ListingDetailPage'
import { moveDeadline } from '@/test/mockDb'
import { findToastAction, renderRoutes, signInAs } from '@/test/render'

// When set, the store refuses to list a listing's requests with this status; refuses
// every approval with this 409 code; or, like the live service, still returns the
// declined request on the reserved pastries (req-05) as PENDING. requestLists counts
// the times a listing's requests were asked for.
const refusal = vi.hoisted(() => ({
  requests: null as null | number,
  approve: null as null | string,
  stalePending: false,
  requestLists: 0,
}))

vi.mock('@/mocks/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/mocks/db')>()
  return {
    ...actual,
    listListingRequests: (...args: Parameters<typeof actual.listListingRequests>) => {
      refusal.requestLists += 1
      if (refusal.requests) throw new actual.MockApiError(refusal.requests, 'SERVER_ERROR', 'Refused for the test.')
      const rows = actual.listListingRequests(...args)
      return refusal.stalePending
        ? rows.map((row) => (row.id === 'req-05' ? { ...row, status: 'PENDING' as const } : row))
        : rows
    },
    decideRequest: (...args: Parameters<typeof actual.decideRequest>) => {
      if (refusal.approve && args[1].decision === 'APPROVED') {
        throw new actual.MockApiError(409, refusal.approve, 'Refused for the test.')
      }
      return actual.decideRequest(...args)
    },
  }
})

vi.setConfig({ testTimeout: 15_000 })

const ROUTES_UNDER_TEST = [
  { path: ROUTES.listingDetail, element: <ListingDetailPage /> },
  { path: ROUTES.listings, element: <h1>Find food page</h1> },
  { path: ROUTES.yourListings, element: <h1>Your listings page</h1> },
  { path: ROUTES.signIn, element: <h1>Sign in page</h1> },
]

function renderDetails(id: string) {
  return renderRoutes(ROUTES_UNDER_TEST, { initialEntries: [listingDetailPath(id)] })
}

// Inside the app frame, so the navigation counts show (phone tab bar in jsdom).
function renderInLayout(id: string) {
  return renderRoutes([{ element: <RequireSession />, children: ROUTES_UNDER_TEST }], {
    initialEntries: [listingDetailPath(id)],
  })
}

const HOPE = 'Hope Community Kitchen'
const AJEGUNLE = 'Ajegunle Food Bank'
const GRACE = 'Grace Shelter'

// A request's card in the panel, found by its organisation's heading.
function rowFor(name: string): HTMLElement {
  const row = screen.getByRole('heading', { level: 3, name }).closest<HTMLElement>('[tabindex="-1"]')
  if (!row) throw new Error(`No request row for ${name}`)
  return row
}

const statusOf = (name: string) => rowFor(name).querySelector('[data-status]')?.textContent
const rowNames = () => screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
const storedStatus = (id: string) => db.listListingRequests(signInAs('donor'), 'lst-01').find((r) => r.id === id)?.status

async function openLoaves() {
  renderDetails('lst-01')
  await screen.findByRole('heading', { level: 3, name: HOPE })
}

async function approve(user: UserEvent, name: string) {
  await user.click(within(rowFor(name)).getByRole('button', { name: `Approve: ${name}` }))
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve request' }))
}

beforeEach(() => {
  refusal.requests = null
  refusal.approve = null
  refusal.stalePending = false
  refusal.requestLists = 0
  signInAs('donor')
})

describe('Listing details (donor): states', () => {
  it('shows skeletons for the panel, then every request with its details and buttons', async () => {
    // Two seconds per call, so the panel's loading state can't be missed.
    window.history.replaceState(null, '', '/?simulate=slow')
    renderDetails('lst-01')
    await screen.findByRole('heading', { level: 1, name: 'Wholewheat bread loaves' }, { timeout: 4000 })
    expect(screen.getByText('Loading requests').closest('[aria-busy="true"]')).toBeInTheDocument()

    await screen.findByRole('heading', { level: 3, name: HOPE }, { timeout: 4000 })
    expect(screen.getByRole('heading', { level: 2, name: 'Requests' })).toBeInTheDocument()
    expect(rowNames()).toEqual([HOPE, AJEGUNLE, GRACE])
    const hope = rowFor(HOPE)
    expect(within(hope).getByText(/^Yaba, Lagos · Requested /)).toBeInTheDocument()
    expect(within(hope).getByText('“We need this for our weekend feeding programme. Thank you!”')).toBeInTheDocument()
    expect(statusOf(HOPE)).toBe('Pending')
    expect(within(hope).getByRole('button', { name: `Approve: ${HOPE}` })).toBeInTheDocument()
    expect(within(hope).getByRole('button', { name: `Decline: ${HOPE}` })).toBeInTheDocument()
    expect(screen.getByText('Updated just now')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Your listings' })).toHaveAttribute('href', ROUTES.yourListings)
  })

  it('says no one has asked yet, and until when recipients can see it', async () => {
    renderDetails('lst-05')

    expect(await screen.findByRole('heading', { name: 'No requests yet.' })).toBeInTheDocument()
    expect(
      screen.getByText(/^Recipients nearby can see this listing until .+, \d{1,2}:\d{2} (AM|PM)\.$/),
    ).toBeInTheDocument()
  })

  it('shows the error with Try again, which loads the requests once the service is back', async () => {
    const user = userEvent.setup()
    refusal.requests = 500
    renderDetails('lst-01')

    expect(await screen.findByRole('heading', { name: "We couldn't load requests." })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Wholewheat bread loaves' })).toBeInTheDocument()

    refusal.requests = null
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 3, name: HOPE })).toBeInTheDocument()
  })
})

describe('Listing details (donor): rules on screen', () => {
  it('shows the approved request first and the others Declined, with no buttons', async () => {
    renderDetails('lst-02')
    await screen.findByRole('heading', { level: 3, name: HOPE })

    expect(rowNames()).toEqual([HOPE, AJEGUNLE])
    expect(statusOf(HOPE)).toBe('Approved')
    expect(statusOf(AJEGUNLE)).toBe('Declined')
    expect(screen.queryByRole('button', { name: /^(Approve|Decline):/ })).not.toBeInTheDocument()
  })

  it("shows an expired listing's requests as Expired, with no buttons", async () => {
    renderDetails('lst-04')
    await screen.findByRole('heading', { level: 3, name: HOPE })

    expect(statusOf(HOPE)).toBe('Expired')
    expect(screen.queryByRole('button', { name: /^(Approve|Decline):/ })).not.toBeInTheDocument()
  })

  it("gives another donor's listing the listing only, without the panel", async () => {
    renderDetails('lst-06')
    await screen.findByRole('heading', { level: 1, name: 'Jollof rice and chicken' })

    expect(screen.queryByRole('heading', { level: 2, name: 'Requests' })).not.toBeInTheDocument()
    expect(screen.queryByText('Loading requests')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(Approve|Decline|Request)/ })).not.toBeInTheDocument()
  })
})

describe("Listing details: the listing's own actions", () => {
  const editLink = (foodName: string) => screen.queryByRole('link', { name: `Edit listing: ${foodName}` })
  const deleteButton = (foodName: string) => screen.queryByRole('button', { name: `Delete listing: ${foodName}` })

  async function open(id: string, foodName: string) {
    const view = renderRoutes(
      [...ROUTES_UNDER_TEST, { path: ROUTES.editListing, element: <h1>Edit listing page</h1> }],
      { initialEntries: [listingDetailPath(id)] },
    )
    await screen.findByRole('heading', { level: 1, name: foodName })
    return view
  }

  it('gives the owner Edit and Delete together, inside the listing card, on a listing just created', async () => {
    const donor = signInAs('donor')
    const created = db.createListing(
      donor,
      {
        foodName: 'Fresh agege loaves',
        description: 'Baked this morning.',
        category: 'bakery',
        quantity: 12,
        unit: 'loaves',
        pickupArea: 'yaba',
        deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        photoUrl: null,
      },
      'key-new-listing',
    )
    const { router } = await open(created.id, 'Fresh agege loaves')

    const edit = editLink('Fresh agege loaves')!
    const remove = deleteButton('Fresh agege loaves')!
    const card = screen.getByRole('article')
    expect(card).toContainElement(edit)
    expect(card).toContainElement(remove)
    // One action row: both share the same parent.
    expect(edit.parentElement).toBe(remove.parentElement)

    await userEvent.setup().click(edit)
    expect(await screen.findByRole('heading', { name: 'Edit listing page' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/listings/${created.id}/edit`)
  })

  it('offers neither Edit nor Delete on a Reserved listing', async () => {
    signInAs('donor')
    await open('lst-02', 'Assorted pastries')
    expect(editLink('Assorted pastries')).not.toBeInTheDocument()
    expect(deleteButton('Assorted pastries')).not.toBeInTheDocument()
  })

  it('offers Delete but not Edit on an Expired listing', async () => {
    signInAs('donor')
    await open('lst-04', 'Agege bread')
    expect(editLink('Agege bread')).not.toBeInTheDocument()
    expect(screen.getByRole('article')).toContainElement(deleteButton('Agege bread'))
    expect(deleteButton('Agege bread')).toBeEnabled()
  })

  it('keeps Delete disabled with the reason, and no Edit, on a Collected listing', async () => {
    signInAs('donor')
    await open('lst-03', 'Meat pies')
    expect(editLink('Meat pies')).not.toBeInTheDocument()
    expect(deleteButton('Meat pies')).toBeDisabled()
  })

  it.each(['recipient', 'admin'] as const)('never offers Edit to %s', async (who) => {
    signInAs(who)
    await open('lst-05', 'Sausage rolls')
    expect(editLink('Sausage rolls')).not.toBeInTheDocument()
  })

  it("offers nothing on another donor's listing", async () => {
    signInAs('donor')
    await open('lst-06', 'Jollof rice and chicken')
    expect(editLink('Jollof rice and chicken')).not.toBeInTheDocument()
    expect(deleteButton('Jollof rice and chicken')).not.toBeInTheDocument()
  })
})

describe('Listing details (donor): approving', () => {
  it('asks first, naming who gets the food and how many others are declined', async () => {
    const user = userEvent.setup()
    await openLoaves()

    await user.click(within(rowFor(HOPE)).getByRole('button', { name: `Approve: ${HOPE}` }))
    const dialog = screen.getByRole('dialog', { name: 'Approve this request?' })
    expect(dialog).toHaveAccessibleDescription(
      `${HOPE} will be the only recipient for Wholewheat bread loaves (40 loaves). The other 2 pending requests will be declined.`,
    )
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(statusOf(HOPE)).toBe('Pending')
    expect(storedStatus('req-01')).toBe('PENDING')
  })

  it('updates the panel at once, before the service answers, then says "Request approved"', async () => {
    const user = userEvent.setup()
    await openLoaves()
    window.history.replaceState(null, '', '/?simulate=slow')

    await approve(user, HOPE)

    // The service takes two seconds to answer. Well inside that window (1.5 seconds at
    // most, for a slow test machine), the screen already shows the result...
    await waitFor(
      () => {
        expect(statusOf(HOPE)).toBe('Approved')
        expect(statusOf(AJEGUNLE)).toBe('Declined')
        expect(statusOf(GRACE)).toBe('Declined')
        expect(screen.queryByRole('button', { name: /^(Approve|Decline):/ })).not.toBeInTheDocument()
        expect(screen.getByText('Reserved')).toBeInTheDocument()
        expect(rowFor(HOPE)).toHaveFocus()
      },
      { timeout: 1500 },
    )
    // ...while the service still hasn't recorded it.
    expect(storedStatus('req-01')).toBe('PENDING')

    expect(await screen.findByText('Request approved', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(storedStatus('req-01')).toBe('APPROVED')
    expect(storedStatus('req-02')).toBe('DECLINED')
  })

  it('rolls back on 409, says why, and moves focus to the request that is actually approved', async () => {
    const user = userEvent.setup()
    await openLoaves()
    // Another approval (Hope's, the first other pending request) lands just before this one.
    window.history.replaceState(null, '', '/?simulate=conflict')

    await approve(user, AJEGUNLE)

    expect(await screen.findByText('This listing already has an approved request. Your approval was not saved.')).toBeInTheDocument()
    await waitFor(() => expect(statusOf(HOPE)).toBe('Approved'))
    expect(statusOf(AJEGUNLE)).toBe('Declined')
    expect(rowNames()[0]).toBe(HOPE)
    await waitFor(() => expect(rowFor(HOPE)).toHaveFocus())
    expect(screen.queryByText('Request approved')).not.toBeInTheDocument()
  })

  it('rolls back when the connection drops, and Try again approves it', async () => {
    const user = userEvent.setup()
    await openLoaves()
    window.history.replaceState(null, '', '/?simulate=offline')

    await approve(user, HOPE)

    const tryAgain = await findToastAction("Your approval wasn't saved because the connection dropped. Try again.", 'Try again')
    expect(statusOf(HOPE)).toBe('Pending')
    expect(statusOf(AJEGUNLE)).toBe('Pending')
    expect(within(rowFor(HOPE)).getByRole('button', { name: `Approve: ${HOPE}` })).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(storedStatus('req-01')).toBe('PENDING')

    window.history.replaceState(null, '', '/')
    await user.click(tryAgain)

    expect(await screen.findByText('Request approved')).toBeInTheDocument()
    expect(storedStatus('req-01')).toBe('APPROVED')
  })

  it('says the listing expired before the approval was saved, and shows the requests as Expired', async () => {
    const user = userEvent.setup()
    await openLoaves()
    moveDeadline('lst-01', new Date(Date.now() - 60_000).toISOString())

    await approve(user, HOPE)

    expect(await screen.findByText('This listing expired before your approval was saved.')).toBeInTheDocument()
    await waitFor(() => expect(statusOf(HOPE)).toBe('Expired'))
    expect(statusOf(GRACE)).toBe('Expired')
  })

  it('lowers the Requests count once the approval is saved', async () => {
    const user = userEvent.setup()
    renderInLayout('lst-01')
    await screen.findByRole('heading', { level: 3, name: HOPE })
    expect(await screen.findByRole('link', { name: 'Requests · 3' })).toBeInTheDocument()

    await approve(user, HOPE)

    expect(await screen.findByRole('link', { name: 'Requests · 0' })).toBeInTheDocument()
  })

  it('puts the panel back itself, even when the refresh after a dropped connection fails too', async () => {
    const user = userEvent.setup()
    await openLoaves()
    window.history.replaceState(null, '', '/?simulate=offline')
    refusal.requests = 500

    await approve(user, HOPE)

    await findToastAction("Your approval wasn't saved because the connection dropped. Try again.", 'Try again')
    await waitFor(() => expect(statusOf(HOPE)).toBe('Pending'))
    expect(statusOf(AJEGUNLE)).toBe('Pending')
    expect(screen.queryByRole('heading', { name: "We couldn't load requests." })).not.toBeInTheDocument()
  })
})

describe('Listing details (donor): declining', () => {
  it('asks first, then declines that one request only: "Request declined"', async () => {
    const user = userEvent.setup()
    await openLoaves()

    await user.click(within(rowFor(AJEGUNLE)).getByRole('button', { name: `Decline: ${AJEGUNLE}` }))
    const dialog = screen.getByRole('dialog', { name: 'Decline this request?' })
    expect(dialog).toHaveAccessibleDescription(`${AJEGUNLE} will be told their request was declined.`)
    await user.click(within(dialog).getByRole('button', { name: 'Decline request' }))

    expect(await screen.findByText('Request declined')).toBeInTheDocument()
    await waitFor(() => expect(statusOf(AJEGUNLE)).toBe('Declined'))
    expect(statusOf(HOPE)).toBe('Pending')
    expect(statusOf(GRACE)).toBe('Pending')
    await waitFor(() => expect(rowFor(AJEGUNLE)).toHaveFocus())
  })

  it('says the decline was not saved when the connection drops, and changes nothing', async () => {
    const user = userEvent.setup()
    await openLoaves()
    window.history.replaceState(null, '', '/?simulate=offline')

    await user.click(within(rowFor(AJEGUNLE)).getByRole('button', { name: `Decline: ${AJEGUNLE}` }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Decline request' }))

    expect(await findToastAction("Your decline wasn't saved. Try again.", 'Try again')).toBeInTheDocument()
    expect(statusOf(AJEGUNLE)).toBe('Pending')
    expect(storedStatus('req-02')).toBe('PENDING')
  })
})

describe('Listing details (donor): the daily fairness rule', () => {
  it('says why the service refused the approval, rolls back and refreshes the requests', async () => {
    refusal.approve = 'DAILY_DISTRIBUTION_PRIORITY'
    const user = userEvent.setup()
    await openLoaves()
    const listsBefore = refusal.requestLists

    await approve(user, AJEGUNLE)

    expect(await screen.findByText("This request can't be approved yet.")).toBeInTheDocument()
    expect(
      screen.getByText(
        `${AJEGUNLE} has already received food today. Every organisation must get its first food today before anyone gets a second, so this approval was not saved. You can approve another organisation's request or decline this one.`,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Request approved')).not.toBeInTheDocument()
    expect(screen.queryByText("Your approval wasn't saved. Try again.")).not.toBeInTheDocument()
    await waitFor(() => expect(statusOf(AJEGUNLE)).toBe('Pending'))
    expect(statusOf(HOPE)).toBe('Pending')
    expect(storedStatus('req-02')).toBe('PENDING')
    await waitFor(() => expect(refusal.requestLists).toBeGreaterThan(listsBefore))
  })

  it("then shows that organisation's Approve disabled with the reason, keeps Decline, and leaves the others' Approve on", async () => {
    refusal.approve = 'DAILY_DISTRIBUTION_PRIORITY'
    const user = userEvent.setup()
    await openLoaves()

    await approve(user, AJEGUNLE)
    await screen.findByText("This request can't be approved yet.")

    const held = within(rowFor(AJEGUNLE)).getByRole('button', { name: `Approve: ${AJEGUNLE}` })
    await waitFor(() => expect(held).toBeDisabled())
    expect(held).toHaveAccessibleDescription(
      "Can't be approved yet: this organisation has already received food today and others are still waiting for their first.",
    )
    expect(within(rowFor(AJEGUNLE)).getByRole('button', { name: `Decline: ${AJEGUNLE}` })).toBeEnabled()
    expect(within(rowFor(HOPE)).getByRole('button', { name: `Approve: ${HOPE}` })).toBeEnabled()
    await waitFor(() => expect(rowFor(AJEGUNLE)).toHaveFocus())
  })

  it('still approves an eligible request', async () => {
    const user = userEvent.setup()
    await openLoaves()

    await approve(user, HOPE)

    expect(await screen.findByText('Request approved')).toBeInTheDocument()
    expect(storedStatus('req-01')).toBe('APPROVED')
  })
})

describe('Listing details (donor): a request the service still stores as Pending on a reserved listing', () => {
  it('shows it Declined, with no Approve or Decline', async () => {
    refusal.stalePending = true
    renderDetails('lst-02')
    await screen.findByRole('heading', { level: 3, name: AJEGUNLE })

    expect(statusOf(AJEGUNLE)).toBe('Declined')
    expect(screen.queryByRole('button', { name: /^Approve/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Decline/ })).not.toBeInTheDocument()
    expect(within(rowFor(HOPE)).getByRole('button', { name: `Mark as collected: ${HOPE}` })).toBeEnabled()
  })
})
