// Listing details, recipient view (spec S4): the five states, the action by situation,
// requesting (including the listing expiring while viewing and a dropped connection),
// and cancelling only your own request, only while it is Pending, with its confirmation,
// its 409 and its Try again; the navigation count follows.
// Signed in as Hope Community Kitchen. Seed: Hope's request on the wholewheat loaves
// (lst-01) is Pending, on the assorted pastries (lst-02) Approved, on the Agege bread
// (lst-04) Expired, on the fried rice (lst-12) Cancelled. The moi moi (lst-09) is
// available and unrequested; the vegetable stew (lst-07) is reserved for Ajegunle Food
// Bank; the akara and pap (lst-14) has expired; the meat pies (lst-03) were collected.
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RequireSession } from '@/components/layout/RequireSession'
import { listingDetailPath, ROUTES } from '@/constants/routes'
import * as db from '@/mocks/db'
import { ListingDetailPage } from '@/pages/ListingDetailPage'
import { moveDeadline } from '@/test/mockDb'
import { findToastAction, renderRoutes, signInAs } from '@/test/render'

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

const heading = (name: string) => screen.findByRole('heading', { level: 1, name })
// The recipient's own requests load after the listing; these wait for the action area.
async function findYourRequest(): Promise<HTMLElement> {
  const block = (await screen.findByText('Your request')).closest<HTMLElement>('[tabindex="-1"]')
  if (!block) throw new Error('No "Your request" block')
  return block
}
const yourRequest = () => screen.getByText('Your request').closest<HTMLElement>('[tabindex="-1"]')
const findRequestButton = () => screen.findByRole('button', { name: 'Request this food' })

beforeEach(() => {
  signInAs('recipient')
})

describe('Listing details (recipient): states', () => {
  it('shows skeletons while loading, then the listing', async () => {
    renderDetails('lst-09')

    expect(screen.getByText('Loading listing').closest('[aria-busy="true"]')).toBeInTheDocument()

    expect(await heading('Moi moi and fried plantain')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Cooked meals · Daily Plate Restaurant')).toBeInTheDocument()
    expect(screen.getByText('25 portions')).toBeInTheDocument()
    expect(screen.getByText('Surulere, Lagos')).toBeInTheDocument()
    expect(screen.getByText(/^Listed /)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Description' })).toBeInTheDocument()
    expect(screen.getByText('Wrapped moi moi with dodo on the side.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Food category' })).toBeInTheDocument()
    expect(document.title).toBe('Moi moi and fried plantain · FoodBridge')
  })

  it('shows the placeholder when there is no photo', async () => {
    renderDetails('lst-11')
    await heading('Ugwu and spinach bundles')

    expect(document.querySelector('img')).toBeNull()
  })

  it('links back to Find food', async () => {
    const user = userEvent.setup()
    renderDetails('lst-09')
    await heading('Moi moi and fried plantain')

    await user.click(screen.getByRole('link', { name: 'Back to Find food' }))

    expect(await heading('Find food page')).toBeInTheDocument()
  })

  it('shows the error with Try again, which loads the listing once the service is back', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/?simulate=error')
    renderDetails('lst-09')

    expect(await screen.findByRole('heading', { name: "We couldn't load this listing." })).toBeInTheDocument()

    window.history.replaceState(null, '', '/')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await heading('Moi moi and fried plantain')).toBeInTheDocument()
  })

  it('says a listing that is gone no longer exists, with a link to Find food', async () => {
    renderDetails('lst-nope')

    expect(await heading('This listing no longer exists.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Find food' })).toHaveAttribute('href', ROUTES.listings)
  })
})

describe('Listing details (recipient): the action by situation', () => {
  it('offers Request this food on an available listing not yet requested', async () => {
    renderDetails('lst-09')
    await heading('Moi moi and fried plantain')

    expect(await findRequestButton()).toBeEnabled()
    expect(screen.getByText("The donor approves one request. You'll see the result in Your requests.")).toBeInTheDocument()
  })

  it("shows the recipient's request status in place of the button", async () => {
    renderDetails('lst-01')
    await heading('Wholewheat bread loaves')

    expect(within(await findYourRequest()).getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request this food' })).not.toBeInTheDocument()
  })

  it('says "Already reserved" with no button when someone else was approved', async () => {
    renderDetails('lst-07')
    await heading('Vegetable stew')

    expect(await screen.findByText('Already reserved')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request this food' })).not.toBeInTheDocument()
  })

  it('explains that an expired listing cannot be requested', async () => {
    renderDetails('lst-14')
    await heading('Akara and pap')

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(await screen.findByText("The collection deadline has passed, so this listing can't be requested.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request this food' })).not.toBeInTheDocument()
  })

  it('offers no action on a collected listing', async () => {
    renderDetails('lst-03')
    await heading('Meat pies')
    // The action area's skeleton (the only hidden div in the card here) has gone.
    await waitFor(() => expect(document.querySelector('article div[aria-hidden="true"]')).toBeNull())

    expect(screen.getByText('Collected')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers Request this food again after the recipient cancelled', async () => {
    renderDetails('lst-12')
    await heading('Fried rice and turkey')

    expect(await findRequestButton()).toBeEnabled()
  })
})

describe('Listing details (recipient): requesting', () => {
  it('sends the request: "Request sent", the Pending badge, and focus on it', async () => {
    const user = userEvent.setup()
    renderDetails('lst-09')
    await heading('Moi moi and fried plantain')

    await user.click(await findRequestButton())

    expect(await screen.findByText('Request sent')).toBeInTheDocument()
    await waitFor(() => expect(yourRequest()).toHaveFocus())
    expect(within(yourRequest()!).getByText('Pending')).toBeInTheDocument()
    expect(db.listMyRequests(signInAs('recipient')).filter((r) => r.listingId === 'lst-09')).toHaveLength(1)
  })

  it('says the listing expired before the request was saved, and shows it as Expired', async () => {
    const user = userEvent.setup()
    renderDetails('lst-09')
    await heading('Moi moi and fried plantain')
    moveDeadline('lst-09', new Date(Date.now() - 60_000).toISOString())

    await user.click(await findRequestButton())

    expect(await screen.findByText('This listing expired before your request was saved.')).toBeInTheDocument()
    expect(await screen.findByText("The collection deadline has passed, so this listing can't be requested.")).toBeInTheDocument()
  })

  it('says the request was not sent when the connection drops, and Try again sends it once', async () => {
    const user = userEvent.setup()
    renderDetails('lst-09')
    await heading('Moi moi and fried plantain')
    window.history.replaceState(null, '', '/?simulate=offline')

    await user.click(await findRequestButton())
    const tryAgain = await findToastAction("Your request wasn't sent. Try again.", 'Try again')
    expect(screen.getByRole('button', { name: 'Request this food' })).toBeEnabled()

    window.history.replaceState(null, '', '/')
    await user.click(tryAgain)

    expect(await screen.findByText('Request sent')).toBeInTheDocument()
    expect(db.listMyRequests(signInAs('recipient')).filter((r) => r.listingId === 'lst-09')).toHaveLength(1)
  })
})

describe('Listing details (recipient): cancelling', () => {
  it('asks first, and Keep request leaves it Pending', async () => {
    const user = userEvent.setup()
    renderDetails('lst-01')
    await heading('Wholewheat bread loaves')

    await user.click(await screen.findByRole('button', { name: 'Cancel request: Wholewheat bread loaves' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancel this request?' })
    expect(within(dialog).getByText('The donor will no longer see it.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Keep request' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(yourRequest()!).getByText('Pending')).toBeInTheDocument()
    expect(db.listMyRequests(signInAs('recipient')).find((r) => r.id === 'req-01')?.status).toBe('PENDING')
  })

  it('cancels: "Request cancelled", Request this food is back and has focus', async () => {
    const user = userEvent.setup()
    renderDetails('lst-01')
    await heading('Wholewheat bread loaves')

    await user.click(await screen.findByRole('button', { name: 'Cancel request: Wholewheat bread loaves' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel request' }))

    expect(await screen.findByText('Request cancelled')).toBeInTheDocument()
    const requestButton = await screen.findByRole('button', { name: 'Request this food' })
    await waitFor(() => expect(requestButton).toHaveFocus())
    expect(db.listMyRequests(signInAs('recipient')).find((r) => r.id === 'req-01')?.status).toBe('CANCELLED')
  })

  it('offers Cancel only while the request is Pending', async () => {
    renderDetails('lst-02')
    await heading('Assorted pastries')

    expect(within(await findYourRequest()).getByText('Approved')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Cancel request/ })).not.toBeInTheDocument()
  })

  it('offers no Cancel on an expired request', async () => {
    renderDetails('lst-04')
    await heading('Agege bread')

    expect(within(await findYourRequest()).getByText('Expired')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Cancel request/ })).not.toBeInTheDocument()
  })

  it("never offers Cancel on other recipients' requests", async () => {
    // Ajegunle Food Bank's request on the stew was approved; Hope has none there.
    renderDetails('lst-07')
    await heading('Vegetable stew')
    await screen.findByText('Already reserved')

    expect(screen.queryByText('Your request')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Cancel request/ })).not.toBeInTheDocument()
  })

  it('says it can no longer be cancelled when the donor decided first, and shows the true status', async () => {
    const user = userEvent.setup()
    renderDetails('lst-01')
    await heading('Wholewheat bread loaves')
    db.decideRequest(signInAs('donor'), { requestId: 'req-01', decision: 'DECLINED' })
    signInAs('recipient')

    await user.click(await screen.findByRole('button', { name: 'Cancel request: Wholewheat bread loaves' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel request' }))

    expect(await screen.findByText('This request can no longer be cancelled.')).toBeInTheDocument()
    await waitFor(() => expect(within(yourRequest()!).getByText('Declined')).toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('says it was not cancelled when the connection drops, and Try again cancels it', async () => {
    const user = userEvent.setup()
    renderDetails('lst-01')
    await heading('Wholewheat bread loaves')
    window.history.replaceState(null, '', '/?simulate=offline')

    await user.click(await screen.findByRole('button', { name: 'Cancel request: Wholewheat bread loaves' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel request' }))
    const tryAgain = await findToastAction("Your request wasn't cancelled. Try again.", 'Try again')
    expect(within(yourRequest()!).getByText('Pending')).toBeInTheDocument()

    window.history.replaceState(null, '', '/')
    await user.click(tryAgain)

    expect(await screen.findByText('Request cancelled')).toBeInTheDocument()
    expect(db.listMyRequests(signInAs('recipient')).find((r) => r.id === 'req-01')?.status).toBe('CANCELLED')
  })

  it('lowers the Your requests count after cancelling', async () => {
    const user = userEvent.setup()
    renderInLayout('lst-01')
    await heading('Wholewheat bread loaves')
    expect(await screen.findByRole('link', { name: 'Your requests · 2' })).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Cancel request: Wholewheat bread loaves' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel request' }))

    expect(await screen.findByRole('link', { name: 'Your requests · 1' })).toBeInTheDocument()
  })
})

describe('Listing details: other viewers', () => {
  it('gives administrators the listing with no action', async () => {
    signInAs('admin')
    renderDetails('lst-09')
    await heading('Moi moi and fried plantain')

    expect(screen.queryByRole('button', { name: 'Request this food' })).not.toBeInTheDocument()
  })
})
