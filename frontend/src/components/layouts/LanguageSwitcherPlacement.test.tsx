// Where the language switcher appears and what choosing a language does there: signed out
// on the landing page and sign-in, signed in in the desktop top bar and inside the phone
// account menu, which stays open while its language list is used.
// The test setup puts English back and clears the saved language after each test.
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { HomeRedirect } from '@/app/pages/HomeRedirect'
import { LandingPage } from '@/app/pages/LandingPage'
import { SignInPage } from '@/app/pages/SignInPage'
import { RequireSession } from '@/components/layouts/RequireSession'
import { LANGUAGE_STORAGE_KEY } from '@/utilities/helpers/language'
import { ROUTES } from '@/utilities/constants/routes'
import { renderRoutes, signInAs } from '@/test/render'

const originalMatchMedia = window.matchMedia

function setScreen(width: 'desktop' | 'phone') {
  window.matchMedia = ((query: string) => ({
    matches: width === 'desktop',
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

function renderSignedIn() {
  signInAs('donor')
  return renderRoutes(
    [{ element: <RequireSession />, children: [{ path: ROUTES.yourListings, element: <h1>Home</h1> }] }],
    { initialEntries: [ROUTES.yourListings] },
  )
}

describe('Language switcher, signed out', () => {
  it('is in the landing page header', () => {
    renderRoutes([{ path: '/', element: <HomeRedirect />, children: [{ index: true, element: <LandingPage /> }] }])

    const header = screen.getByRole('banner')
    expect(within(header).getByRole('combobox', { name: 'Language' })).toHaveTextContent('English')
  })

  it('is on the sign-in page', () => {
    renderRoutes([{ path: ROUTES.signIn, element: <SignInPage /> }], { initialEntries: [ROUTES.signIn] })

    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument()
  })
})

describe('Language switcher, signed in', () => {
  it('in the desktop top bar: choosing Français turns the sidebar French and saves it', async () => {
    const user = userEvent.setup()
    setScreen('desktop')
    renderSignedIn()
    await screen.findByRole('heading', { name: 'Home' })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: /Your listings/ })).toBeInTheDocument()

    await user.click(within(screen.getByRole('banner')).getByRole('combobox', { name: 'Language' }))
    await user.click(await screen.findByRole('option', { name: 'Français' }))

    expect(within(nav).getByRole('link', { name: /Vos annonces/ })).toBeInTheDocument()
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr')
    expect(screen.getByRole('combobox', { name: 'Langue' })).toHaveTextContent('Français')
  })

  it('in the phone account menu: the menu stays open while the list is used', async () => {
    const user = userEvent.setup()
    setScreen('phone')
    renderSignedIn()
    await screen.findByRole('heading', { name: 'Home' })
    const account = screen.getByRole('button', { name: /^Account,/ })
    await user.click(account)

    // Choosing a language: the tab bar turns French, the menu stays open.
    await user.click(screen.getByRole('combobox', { name: 'Language' }))
    await user.click(await screen.findByRole('option', { name: 'Français' }))

    expect(account).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /Vos annonces/ })).toBeInTheDocument()
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr')

    // Escape in the open list closes only the list; the menu and its buttons stay usable.
    await user.click(screen.getByRole('combobox', { name: 'Langue' }))
    await screen.findByRole('listbox')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(account).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()

    // A second Escape, outside the list, closes the menu as before.
    await user.keyboard('{Escape}')
    expect(account).toHaveAttribute('aria-expanded', 'false')
  })
})
