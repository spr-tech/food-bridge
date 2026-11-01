
import { fireEvent, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '@/constants/routes'
import { lagosToday } from '@/lib/deadline'
import { CreateListingPage } from '@/pages/CreateListingPage'
import { renderRoutes, signInAs } from '@/test/render'

const refusal = vi.hoisted(() => ({
  next: null as null | {
    status: number
    code: string
    fields?: Record<string, string>
  },
}))

vi.mock('@/mocks/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/mocks/db')>()

  return {
    ...actual,
    createListing: (...args: Parameters<typeof actual.createListing>) => {
      if (refusal.next) {
        const { status, code, fields } = refusal.next

        throw new actual.MockApiError(
          status,
          code,
          'Refused for the test.',
          fields,
        )
      }

      return actual.createListing(...args)
    },
  }
})

// Filling the whole form in jsdom takes a few seconds; allow for a busy test run.
vi.setConfig({ testTimeout: 15_000 })

const DAY = 24 * 60 * 60 * 1000

async function choose(user: UserEvent, label: RegExp, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: option }))
}

async function fillAndPublish(user: UserEvent) {
  await user.click(screen.getByRole('textbox', { name: /Food name/ }))
  await user.paste('Puff-puff')

  await user.click(screen.getByRole('textbox', { name: /Description/ }))
  await user.paste('Freshly prepared puff-puff, ready for collection.')

  await choose(user, /Category/, 'Pastries')

  await user.click(screen.getByRole('textbox', { name: /Quantity/ }))
  await user.paste('30')

  await choose(user, /Unit/, 'pieces')
  await choose(user, /Pickup area/, 'Yaba')

  fireEvent.change(screen.getByLabelText(/Collection date/), {
    target: {
      value: lagosToday(new Date(Date.now() + DAY)),
    },
  })

  fireEvent.change(screen.getByLabelText(/^Time/), {
    target: { value: '12:00' },
  })

  await user.click(
    screen.getByRole('button', { name: 'Publish listing' }),
  )
}

function renderShareFood() {
  return renderRoutes(
    [
      {
        path: ROUTES.createListing,
        element: <CreateListingPage />,
      },
      {
        path: ROUTES.signIn,
        element: <h1>Sign in page</h1>,
      },
    ],
    { initialEntries: [ROUTES.createListing] },
  )
}

beforeEach(() => {
  refusal.next = null
  signInAs('donor')
})

describe('Share food: service refusals', () => {
  it("shows a 400's field messages under their fields, the deadline under Time", async () => {
    refusal.next = {
      status: 400,
      code: 'VALIDATION_FAILED',
      fields: {
        foodName: 'Enter the food name',
        deadline: 'The deadline must be later than now',
      },
    }

    const user = userEvent.setup()
    renderShareFood()

    await fillAndPublish(user)

    const foodName = screen.getByRole('textbox', {
      name: /Food name/,
    })

    expect(
      await screen.findByText('Enter the food name'),
    ).toBeInTheDocument()
    expect(foodName).toHaveAccessibleDescription('Enter the food name')
    expect(
      screen.getByLabelText(/^Time/),
    ).toHaveAccessibleDescription('The deadline must be later than now')
    expect(foodName).toHaveFocus()
  })

  it('sends the donor to sign in when the session has ended (401)', async () => {
    refusal.next = {
      status: 401,
      code: 'SESSION_EXPIRED',
    }

    const user = userEvent.setup()
    const { router } = renderShareFood()

    await fillAndPublish(user)

    expect(
      await screen.findByRole('heading', { name: 'Sign in page' }),
    ).toBeInTheDocument()

    expect(router.state.location.search).toBe(
      `?reason=session-ended&next=${encodeURIComponent(ROUTES.createListing)}`,
    )
  })
})
