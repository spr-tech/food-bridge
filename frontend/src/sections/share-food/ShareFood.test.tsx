// Share food (spec S2): every field message, the deadline rule, publishing once, the
// success and failure paths, the unsaved-changes prompt and the photo checks.
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { Link, Outlet } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/constants/routes'
import { lagosToday } from '@/lib/deadline'
import * as db from '@/mocks/db'
import { CreateListingPage } from '@/pages/CreateListingPage'
import { renderRoutes, signInAs } from '@/test/render'

// Filling the whole form in jsdom takes a few seconds; allow for a busy test run.
vi.setConfig({ testTimeout: 15_000 })

const DAY = 24 * 60 * 60 * 1000

function renderShareFood() {
  return renderRoutes(
    [
      {
        element: (
          <>
            <Link to={ROUTES.yourListings}>Your listings</Link>
            <Outlet />
          </>
        ),
        children: [
          { path: ROUTES.createListing, element: <CreateListingPage /> },
          { path: ROUTES.listingDetail, element: <h1>Listing page</h1> },
          { path: ROUTES.yourListings, element: <h1>Your listings page</h1> },
        ],
      },
    ],
    { initialEntries: [ROUTES.createListing] },
  )
}

const field = (name: RegExp) => screen.getByRole('textbox', { name })
const publish = () => screen.getByRole('button', { name: 'Publish listing' })

async function choose(user: UserEvent, label: RegExp, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

function setDateAndTime(date: string, time: string) {
  fireEvent.change(screen.getByLabelText(/Collection date/), { target: { value: date } })
  fireEvent.change(screen.getByLabelText(/^Time/), { target: { value: time } })
}

// Text is pasted rather than typed: the same events, without one per keystroke.
async function paste(user: UserEvent, element: HTMLElement, text: string) {
  await user.click(element)
  await user.paste(text)
}

async function fillValidForm(user: UserEvent, foodName = 'Puff-puff') {
  await paste(user, field(/Food name/), foodName)
  await choose(user, /Category/, 'Pastries')
  await paste(user, field(/Quantity/), '30')
  await choose(user, /Unit/, 'pieces')
  await choose(user, /Pickup area/, 'Yaba')
  setDateAndTime(lagosToday(new Date(Date.now() + DAY)), '12:00')
}

const myListingsNamed = (name: string) =>
  db.listMyListings(signInAs('donor')).filter((listing) => listing.foodName === name)

beforeEach(() => {
  signInAs('donor')
})

describe('Share food', () => {
  it('has "Share food" as its h1 and explains the asterisk', () => {
    renderShareFood()

    expect(screen.getByRole('heading', { level: 1, name: 'Share food' })).toBeInTheDocument()
    expect(screen.getByText('Fields marked * are required.')).toBeInTheDocument()
  })

  it("shows the spec's message for every empty required field and focuses the first", async () => {
    const user = userEvent.setup()
    renderShareFood()
    fireEvent.change(screen.getByLabelText(/Collection date/), { target: { value: '' } })

    await user.click(publish())

    for (const message of [
      'Enter the food name',
      'Choose a category',
      'Enter a quantity of 1 or more',
      'Choose a unit',
      'Choose a pickup area',
      'Choose a collection date',
      'Choose a collection time',
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument()
    }
    expect(field(/Food name/)).toHaveFocus()
  })

  it('refuses a quantity below 1', async () => {
    const user = userEvent.setup()
    renderShareFood()

    await user.type(field(/Quantity/), '0')
    await user.tab()

    expect(await screen.findByText('Enter a quantity of 1 or more')).toBeInTheDocument()
  })

  it('refuses a deadline that is not later than now, under Time', async () => {
    const user = userEvent.setup()
    renderShareFood()
    await fillValidForm(user)

    setDateAndTime(lagosToday(new Date(Date.now() - DAY)), '12:00')
    await user.click(publish())

    expect(await screen.findByText('The deadline must be later than now')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Time/)).toHaveAccessibleDescription('The deadline must be later than now')
    expect(myListingsNamed('Puff-puff')).toHaveLength(0)
  })

  it('publishes, goes to the new listing and says "Listing published"', async () => {
    const user = userEvent.setup()
    renderShareFood()
    await fillValidForm(user)

    await user.click(publish())

    expect(await screen.findByRole('heading', { name: 'Listing page' })).toBeInTheDocument()
    expect(screen.getByText('Listing published')).toBeInTheDocument()
    const [listing] = myListingsNamed('Puff-puff')
    expect(listing).toMatchObject({ quantity: 30, unit: 'pieces', category: 'pastries', pickupArea: 'yaba', status: 'AVAILABLE' })
    expect(listing.deadline).toMatch(/T12:00:00\+01:00$/)
  })

  it('publishes once when Publish listing is pressed twice', async () => {
    const user = userEvent.setup()
    renderShareFood()
    await fillValidForm(user)

    await user.dblClick(publish())

    expect(await screen.findByRole('heading', { name: 'Listing page' })).toBeInTheDocument()
    expect(myListingsNamed('Puff-puff')).toHaveLength(1)
  })

  it('keeps the form filled in when publishing fails', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/?simulate=error')
    renderShareFood()
    await fillValidForm(user)

    await user.click(publish())

    expect(await screen.findByRole('alert')).toHaveTextContent("Your listing wasn't published. Try again.")
    expect(field(/Food name/)).toHaveValue('Puff-puff')
    expect(field(/Quantity/)).toHaveValue('30')
  })

  it('counts description characters up to 500', async () => {
    const user = userEvent.setup()
    renderShareFood()

    await user.type(field(/Description/), 'Side door')

    expect(field(/Description/)).toHaveAccessibleDescription('9 of 500 characters used')
  })
})

describe('Share food: leaving with changes', () => {
  it('asks before leaving with changes; Stay keeps them', async () => {
    const user = userEvent.setup()
    renderShareFood()
    await user.type(field(/Food name/), 'Puff-puff')

    await user.click(screen.getByRole('link', { name: 'Your listings' }))

    const dialog = await screen.findByRole('dialog', { name: 'Leave without publishing?' })
    expect(dialog).toHaveAccessibleDescription('Your details will be lost.')
    expect(within(dialog).getByRole('button', { name: 'Stay' })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'Stay' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(field(/Food name/)).toHaveValue('Puff-puff')
  })

  it('leaves when Leave is chosen', async () => {
    const user = userEvent.setup()
    renderShareFood()
    await user.type(field(/Food name/), 'Puff-puff')
    await user.click(screen.getByRole('link', { name: 'Your listings' }))

    await user.click(await screen.findByRole('button', { name: 'Leave' }))

    expect(await screen.findByRole('heading', { name: 'Your listings page' })).toBeInTheDocument()
  })

  it("doesn't ask when nothing has changed", async () => {
    const user = userEvent.setup()
    renderShareFood()

    await user.click(screen.getByRole('link', { name: 'Your listings' }))

    expect(await screen.findByRole('heading', { name: 'Your listings page' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Share food: photo', () => {
  const photoInput = () => screen.getByLabelText(/Add photo/)

  it('refuses a file that is not JPG or PNG', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderShareFood()

    await user.upload(photoInput(), new File(['gif'], 'bread.gif', { type: 'image/gif' }))

    expect(await screen.findByText('Choose a JPG or PNG photo of 5 MB or less.')).toBeInTheDocument()
  })

  it('refuses a photo over 5 MB', async () => {
    const user = userEvent.setup()
    renderShareFood()
    const big = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 })

    await user.upload(photoInput(), big)

    expect(await screen.findByText('Choose a JPG or PNG photo of 5 MB or less.')).toBeInTheDocument()
  })

  it('shows a chosen photo, which can be removed', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    const user = userEvent.setup()
    renderShareFood()

    await user.upload(photoInput(), new File(['png'], 'bread.png', { type: 'image/png' }))

    expect(screen.getByRole('img', { name: 'Preview of the chosen photo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove photo' }))
    expect(screen.queryByRole('img', { name: 'Preview of the chosen photo' })).not.toBeInTheDocument()
    expect(screen.queryByText('Choose a JPG or PNG photo of 5 MB or less.')).not.toBeInTheDocument()
  })
})
