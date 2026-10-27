// The route guards (spec section 2): a signed-out user is sent to sign in and brought
// back afterwards; a page for another role shows the 403 message.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { RequireRole, RequireSession } from '@/components/layout/RequireSession'
import { ROUTES } from '@/constants/routes'
import { DEMO_PASSWORD } from '@/mocks/seed'
import { SignInPage } from '@/pages/SignInPage'
import { renderRoutes, signInAs } from '@/test/render'

function renderApp(entry: string) {
  return renderRoutes(
    [
      { path: ROUTES.signIn, element: <SignInPage /> },
      {
        element: <RequireSession />,
        children: [
          {
            element: <RequireRole roles={['donor']} />,
            children: [{ path: ROUTES.requests, element: <h1>Requests page</h1> }],
          },
          {
            element: <RequireRole roles={['recipient', 'admin']} />,
            children: [{ path: ROUTES.listings, element: <h1>Find food page</h1> }],
          },
          {
            element: <RequireRole roles={['donor']} />,
            children: [{ path: ROUTES.yourListings, element: <h1>Your listings page</h1> }],
          },
        ],
      },
    ],
    { initialEntries: [entry] },
  )
}

async function signInWith(email: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('textbox', { name: /Email address/ }))
  await user.paste(email)
  await user.click(screen.getByLabelText(/^Password/))
  await user.paste(DEMO_PASSWORD)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('RequireSession', () => {
  it('sends a signed-out user to sign in, then back to the page they wanted', async () => {
    const { router } = renderApp(`${ROUTES.requests}?tab=pending`)

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(router.state.location.search).toBe(`?next=${encodeURIComponent('/requests?tab=pending')}`)

    await signInWith('donor@foodbridge.test')

    expect(await screen.findByRole('heading', { name: 'Requests page' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?tab=pending')
  })

  it('signs out to sign in with no ?next=, so the next person starts on their own home page', async () => {
    const user = userEvent.setup()
    signInAs('recipient')
    const { router } = renderApp(ROUTES.listings)
    expect(await screen.findByRole('heading', { name: 'Find food page' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Account, Hope Community Kitchen' }))
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(ROUTES.signIn)
    expect(router.state.location.search).toBe('')

    await signInWith('donor@foodbridge.test')

    expect(await screen.findByRole('heading', { name: 'Your listings page' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(ROUTES.yourListings)
  })

  it('shows the page inside the app frame when signed in with the right role', async () => {
    signInAs('recipient')
    renderApp(ROUTES.listings)

    expect(await screen.findByRole('heading', { name: 'Find food page' })).toBeInTheDocument()
    // The frame is there: on a phone-width screen (the test default), the account menu.
    expect(screen.getByRole('button', { name: 'Account, Hope Community Kitchen' })).toBeInTheDocument()
  })
})

describe('RequireRole', () => {
  it("shows the spec's 403 message, with a link home, for another role's page", async () => {
    signInAs('recipient')
    renderApp(ROUTES.requests)

    expect(await screen.findByRole('heading', { name: "You don't have access to this." })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to your home page' })).toHaveAttribute('href', ROUTES.listings)
    expect(screen.queryByRole('heading', { name: 'Requests page' })).not.toBeInTheDocument()
  })
})
