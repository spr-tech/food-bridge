// Sign in (spec S1): validation, wrong details, an unreachable service, the session it
// saves, where each role lands, ?next=, the phone chips and show password.
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getSession, SESSION_STORAGE_KEY } from '@/app/session'
import { ROUTES } from '@/constants/routes'
import { DEMO_PASSWORD } from '@/mocks/seed'
import { SignInPage } from '@/pages/SignInPage'
import { renderRoutes, signInAs } from '@/test/render'

function renderSignIn(entry: string = ROUTES.signIn) {
  return renderRoutes(
    [
      { path: ROUTES.signIn, element: <SignInPage /> },
      { path: ROUTES.yourListings, element: <h1>Donor home</h1> },
      { path: ROUTES.listings, element: <h1>Recipient home</h1> },
      { path: ROUTES.admin, element: <h1>Admin home</h1> },
      { path: ROUTES.requests, element: <h1>Requests page</h1> },
    ],
    { initialEntries: [entry] },
  )
}

const emailField = () => screen.getByRole('textbox', { name: /Email address/ })
const passwordField = () => screen.getByLabelText(/^Password/)

async function signInWith(email: string, password: string) {
  const user = userEvent.setup()
  // Pasted rather than typed: the same events, without one per keystroke.
  await user.click(emailField())
  await user.paste(email)
  await user.click(passwordField())
  await user.paste(password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  return user
}

describe('Sign in', () => {
  it('has "Welcome back" as its one h1, with focus starting on the email field', () => {
    renderSignIn()

    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Welcome back'])
    expect(emailField()).toHaveFocus()
  })

  it('shows both empty-field errors and moves focus to the first', async () => {
    const user = userEvent.setup()
    renderSignIn()
    await user.click(passwordField())

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your email address')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(emailField()).toHaveAttribute('aria-invalid', 'true')
    expect(emailField()).toHaveFocus()
  })

  it('says the details are wrong and keeps the email filled in', async () => {
    renderSignIn()

    await signInWith('donor@foodbridge.test', 'not-the-password')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "That email or password isn't right. Check them and try again.",
    )
    expect(emailField()).toHaveValue('donor@foodbridge.test')
    expect(getSession()).toBeNull()
  })

  it('says the service is unreachable when it fails', async () => {
    window.history.replaceState(null, '', '/?simulate=error')
    renderSignIn()

    await signInWith('donor@foodbridge.test', DEMO_PASSWORD)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We can't reach FoodBridge right now. Try again in a moment.",
    )
  })

  it.each([
    ['donor@foodbridge.test', 'Donor home'],
    ['recipient@foodbridge.test', 'Recipient home'],
    ['admin@foodbridge.test', 'Admin home'],
  ])('sends %s to their home page', async (email, home) => {
    renderSignIn()

    await signInWith(email, DEMO_PASSWORD)

    expect(await screen.findByRole('heading', { name: home })).toBeInTheDocument()
  })

  it('saves the session (token, role, organisation) in sessionStorage', async () => {
    renderSignIn()

    await signInWith('recipient@foodbridge.test', DEMO_PASSWORD)

    await waitFor(() => expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull())
    expect(getSession()).toMatchObject({ role: 'recipient', organisationName: 'Hope Community Kitchen' })
    expect(getSession()?.token).toBeTruthy()
  })

  it('returns to the page asked for in ?next=', async () => {
    renderSignIn(`${ROUTES.signIn}?next=${encodeURIComponent(ROUTES.requests)}`)

    await signInWith('donor@foodbridge.test', DEMO_PASSWORD)

    expect(await screen.findByRole('heading', { name: 'Requests page' })).toBeInTheDocument()
  })

  it.each(['https://example.com/', '//example.com/'])('ignores a ?next= outside the app (%s)', async (next) => {
    renderSignIn(`${ROUTES.signIn}?next=${encodeURIComponent(next)}`)

    await signInWith('donor@foodbridge.test', DEMO_PASSWORD)

    expect(await screen.findByRole('heading', { name: 'Donor home' })).toBeInTheDocument()
  })

  it('sends an already signed-in user straight on', async () => {
    signInAs('admin')
    renderSignIn()

    expect(await screen.findByRole('heading', { name: 'Admin home' })).toBeInTheDocument()
  })

  it('says the session ended when sent back for that reason', () => {
    renderSignIn(`${ROUTES.signIn}?reason=session-ended`)

    expect(screen.getByRole('status')).toHaveTextContent('Your session ended. Sign in again.')
  })

  it('fills in the email from a demo account chip and moves to the password', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.click(screen.getByRole('button', { name: 'Administrator' }))

    expect(emailField()).toHaveValue('admin@foodbridge.test')
    expect(passwordField()).toHaveFocus()
    expect(passwordField()).toHaveValue('')
  })

  it('shows and hides the password', async () => {
    const user = userEvent.setup()
    renderSignIn()
    const toggle = screen.getByRole('button', { name: 'Show password' })

    expect(passwordField()).toHaveAttribute('type', 'password')
    await user.click(toggle)
    expect(passwordField()).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(passwordField()).toHaveAttribute('type', 'password')
  })

  it('lists one demo account per role, with its email', () => {
    renderSignIn()

    for (const email of ['donor@', 'recipient@', 'admin@']) {
      expect(screen.getByText(`${email}foodbridge.test`)).toBeInTheDocument()
    }
    expect(screen.queryByText(/recipient\d@foodbridge\.test/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^(Donor|Recipient|Administrator)$/ })).toHaveLength(3)
  })
})
