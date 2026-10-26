// Find food (spec S3): the five states, filters in the address that combine and clear,
// the announced count, Load more, the card's button states, and requesting from a card,
// including a request refused because the listing expired.
// Signed in as Hope Community Kitchen. Seed: 13 available listings of 19; Hope has
// pending requests on the wholewheat loaves (lst-01) and the jollof rice (lst-06).
import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/constants/routes'
import * as db from '@/mocks/db'
import { BrowsePage } from '@/pages/BrowsePage'
import { findToastAction, renderRoutes, signInAs } from '@/test/render'

// Rendering a dozen cards in jsdom takes a while; allow for a busy test run.
vi.setConfig({ testTimeout: 15_000 })

function renderFindFood(entry: string = ROUTES.listings) {
  return renderRoutes(
    [
      { path: ROUTES.listings, element: <BrowsePage /> },
      { path: ROUTES.listingDetail, element: <h1>Listing page</h1> },
    ],
    { initialEntries: [entry] },
  )
}

const cardNames = () => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
const countMessage = () => screen.getByText(/^\d+ listings?( available)?$/)

async function choose(user: UserEvent, label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

function cardFor(foodName: string): HTMLElement {
  const heading = screen.getByRole('heading', { level: 2, name: foodName })
  const card = heading.closest('li')
  if (!card) throw new Error(`No card for ${foodName}`)
  return card
}

// Changes a listing's deadline in the simulated store, as if time had passed.
function moveDeadline(listingId: string, iso: string) {
  const stored = JSON.parse(sessionStorage.getItem(db.MOCK_DB_STORAGE_KEY) ?? '{}')
  const listing = stored.listings.find((item: { id: string }) => item.id === listingId)
  listing.deadline = iso
  sessionStorage.setItem(db.MOCK_DB_STORAGE_KEY, JSON.stringify(stored))
}

beforeEach(() => {
  signInAs('recipient')
})

describe('Find food: states', () => {
  it('shows skeleton cards while loading, then the first 12 listings', async () => {
    renderFindFood()

    expect(screen.getByText('Loading listings').closest('[aria-busy="true"]')).toBeInTheDocument()

    await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })
    expect(cardNames()).toHaveLength(12)
    expect(screen.getByText('Updated just now')).toBeInTheDocument()
  })

  it('announces the count through a live region', async () => {
    renderFindFood()

    await waitFor(() => expect(countMessage()).toHaveTextContent('13 listings available'))
    expect(countMessage()).toHaveAttribute('aria-live', 'polite')
  })

  it('shows "No food listed yet." when nothing is listed', async () => {
    window.history.replaceState(null, '', '/?simulate=empty')
    renderFindFood()

    expect(await screen.findByRole('heading', { name: 'No food listed yet.' })).toBeInTheDocument()
    expect(screen.getByText('Check back later today. Donors usually list in the afternoon.')).toBeInTheDocument()
  })

  it('shows the error with Try again, which loads the listings once the service is back', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/?simulate=error')
    renderFindFood()

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load listings.")

    window.history.replaceState(null, '', '/')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })).toBeInTheDocument()
  })

  it('loads 12 more with Load more and moves focus to the first new card', async () => {
    const user = userEvent.setup()
    renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })

    await user.click(screen.getByRole('button', { name: 'Load more' }))

    await waitFor(() => expect(cardNames()).toHaveLength(13))
    expect(screen.getByRole('link', { name: 'View listing: Wholemeal rolls' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })
})

describe('Find food: filters', () => {
  it('shows only available listings at first', async () => {
    renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })

    expect(cardNames()).not.toContain('Vegetable stew')
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Available')
  })

  it('combines category and area, and keeps them in the address', async () => {
    const user = userEvent.setup()
    const { router } = renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })

    await choose(user, 'Category', 'Cooked meals')
    await choose(user, 'Pickup area', 'Surulere')

    await waitFor(() => expect(cardNames()).toEqual(['Moi moi and fried plantain', 'Jollof rice and chicken']))
    expect(router.state.location.search).toBe('?category=cooked-meals&area=surulere')
    await waitFor(() => expect(countMessage()).toHaveTextContent('2 listings available'))
  })

  it('searches once typing pauses, alongside the other filters', async () => {
    const user = userEvent.setup()
    const { router } = renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })

    await choose(user, 'Pickup area', 'Ikeja')
    await user.type(screen.getByRole('searchbox', { name: 'Search by food name, donor or area' }), 'rice')

    await waitFor(() => expect(cardNames()).toEqual(['Fried rice and turkey']))
    expect(router.state.location.search).toBe('?area=ikeja&q=rice')
  })

  it('shows every status with "All statuses", stored as status=all', async () => {
    const user = userEvent.setup()
    const { router } = renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })

    await choose(user, 'Status', 'All statuses')

    await waitFor(() => expect(countMessage()).toHaveTextContent('19 listings'))
    expect(router.state.location.search).toBe('?status=all')
  })

  it('restores the filters from the address, as after a refresh', async () => {
    renderFindFood(`${ROUTES.listings}?category=bakery&status=all`)

    await waitFor(() =>
      expect(cardNames()).toEqual(['Wholewheat bread loaves', 'Coconut bread', 'Wholemeal rolls', 'Agege bread']),
    )
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Bakery')
  })

  it('clears every filter with Clear all', async () => {
    const user = userEvent.setup()
    const { router } = renderFindFood(`${ROUTES.listings}?category=bakery&area=yaba&status=all`)
    await screen.findByRole('heading', { level: 2, name: 'Agege bread' })

    await user.click(screen.getByRole('button', { name: 'Clear all' }))

    await waitFor(() => expect(router.state.location.search).toBe(''))
    await waitFor(() => expect(countMessage()).toHaveTextContent('13 listings available'))
  })

  it('offers Clear filters when nothing matches', async () => {
    const user = userEvent.setup()
    renderFindFood(`${ROUTES.listings}?q=zzz`)

    expect(await screen.findByRole('heading', { name: 'No listings match your filters' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Sausage rolls' })).toBeInTheDocument()
  })
})

describe('Find food: cards', () => {
  it('shows the details the design asks for', async () => {
    renderFindFood()
    const card = cardFor(await screen.findByRole('heading', { level: 2, name: 'Coconut bread' }).then((h) => h.textContent ?? ''))

    expect(within(card).getByText('Bakery · Surulere Bakehouse')).toBeInTheDocument()
    expect(within(card).getByText('16 loaves')).toBeInTheDocument()
    expect(within(card).getByText(/^Pickup by /)).toBeInTheDocument()
    expect(within(card).getByText('Surulere, Lagos')).toBeInTheDocument()
    expect(within(card).getByText('Available')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'View listing: Coconut bread' })).toHaveAttribute('href', '/listings/lst-13')
  })

  it('shows Request food, Requested, Reserved and Expired by situation', async () => {
    // Cooked meals in every status: six listings, one of each situation.
    renderFindFood(`${ROUTES.listings}?status=all&category=cooked-meals`)
    await screen.findByRole('heading', { level: 2, name: 'Moi moi and fried plantain' })

    expect(within(cardFor('Moi moi and fried plantain')).getByRole('button', { name: 'Request food: Moi moi and fried plantain' })).toBeEnabled()

    const requested = cardFor('Jollof rice and chicken')
    expect(within(requested).getByRole('button', { name: /^Requested/ })).toBeDisabled()
    expect(within(requested).getByText('Requested · waiting for donor')).toBeInTheDocument()

    expect(within(cardFor('Vegetable stew')).getByRole('button', { name: /^Reserved/ })).toBeDisabled()
    expect(within(cardFor('Akara and pap')).getByRole('button', { name: /^Expired/ })).toBeDisabled()
  })

  it('sends a request from the card, which then shows Requested', async () => {
    const user = userEvent.setup()
    renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Coconut bread' })

    await user.click(screen.getByRole('button', { name: 'Request food: Coconut bread' }))

    expect(await screen.findByText('Request sent')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(cardFor('Coconut bread')).getByText('Requested · waiting for donor')).toBeInTheDocument(),
    )
  })

  it('refuses a request on a listing that has expired, and the card turns to Expired', async () => {
    const user = userEvent.setup()
    // Produce in every status, so the card stays on screen once it has expired.
    renderFindFood(`${ROUTES.listings}?status=all&category=produce`)
    await screen.findByRole('heading', { level: 2, name: 'Ripe plantain' })
    moveDeadline('lst-15', new Date(Date.now() - 60_000).toISOString())

    await user.click(screen.getByRole('button', { name: 'Request food: Ripe plantain' }))

    expect(await screen.findByText('This listing expired before your request was saved.')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(cardFor('Ripe plantain')).getByRole('button', { name: /^Expired/ })).toBeDisabled(),
    )
    expect(db.listMyRequests(signInAs('recipient')).some((r) => r.listingId === 'lst-15')).toBe(false)
  })

  it('says the request was not sent when the service fails, and Try again sends it once', async () => {
    const user = userEvent.setup()
    renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Coconut bread' })
    window.history.replaceState(null, '', '/?simulate=error')

    await user.click(screen.getByRole('button', { name: 'Request food: Coconut bread' }))
    const tryAgain = await findToastAction("Your request wasn't sent. Try again.", 'Try again')

    window.history.replaceState(null, '', '/')
    await user.click(tryAgain)

    expect(await screen.findByText('Request sent')).toBeInTheDocument()
    expect(db.listMyRequests(signInAs('recipient')).filter((r) => r.listingId === 'lst-13')).toHaveLength(1)
  })

  it('offers Request food again after the recipient cancelled their request', async () => {
    // Seed: Hope Community Kitchen cancelled its request on the fried rice (req-11).
    renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Fried rice and turkey' })

    const card = cardFor('Fried rice and turkey')
    expect(within(card).getByRole('button', { name: 'Request food: Fried rice and turkey' })).toBeEnabled()
    expect(within(card).queryByText('Requested · waiting for donor')).not.toBeInTheDocument()
  })

  it('gives administrators View listing only', async () => {
    signInAs('admin')
    renderFindFood()
    await screen.findByRole('heading', { level: 2, name: 'Coconut bread' })

    expect(screen.queryByRole('button', { name: /^Request food/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^View listing/ })).toHaveLength(12)
  })
})
