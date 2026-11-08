// AppLayout: permanent dark-green sidebar, navigation (no Coming soon items),
// notification counts, sign-out and phone layout.
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SESSION_STORAGE_KEY } from '@/stores/sessionStore'
import { RequireSession } from '@/components/layout/RequireSession'
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

// Signed in as the demo donor: Your listings, Share food, Requests.
function renderLayout(path: string = ROUTES.yourListings) {
  return renderRoutes(
    [
      { path: ROUTES.signIn, element: <h1>Sign in</h1> },
      {
        element: <RequireSession />,
        children: [
          { path: ROUTES.yourListings, element: <h1>Your listings</h1> },
          { path: ROUTES.createListing, element: <h1>Share food</h1> },
          { path: ROUTES.requests, element: <h1>Requests</h1> },
          { path: ROUTES.listings, element: <h1>Find food</h1> },
          { path: ROUTES.yourRequests, element: <h1>Your requests</h1> },
          { path: ROUTES.adminRequests, element: <h1>Requests waiting</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
}

function sidebarState() {
  return document.querySelector('[data-sidebar]')?.getAttribute('data-sidebar')
}

beforeEach(() => {
  setScreen('desktop')
  signInAs('donor')
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
})

describe('AppLayout sidebar', () => {
  it('starts dark green after sign-in', () => {
    renderLayout()

    expect(sidebarState()).toBe('dark')
  })

  it('stays dark green when navigating between sidebar links', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('link', { name: 'Share food' }))

    expect(await screen.findByRole('heading', { name: 'Share food' })).toBeInTheDocument()
    expect(sidebarState()).toBe('dark')

    await user.click(screen.getByRole('link', { name: /^Requests/ }))

    expect(await screen.findByRole('heading', { name: 'Requests' })).toBeInTheDocument()
    expect(sidebarState()).toBe('dark')
  })

  it('stays dark green when the current page link is clicked', async () => {
    const user = userEvent.setup()
    renderLayout(ROUTES.yourListings)

    await user.click(screen.getByRole('link', { name: 'Your listings' }))

    expect(sidebarState()).toBe('dark')
  })

  it('ignores the old saved cream theme preference', () => {
    sessionStorage.setItem('foodbridge.sidebar', 'cream')

    renderLayout()

    expect(sidebarState()).toBe('dark')
  })

  it('signs out and starts dark green at the next sign-in', async () => {
    const user = userEvent.setup()
    const { unmount, router } = renderLayout()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('')
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()

    unmount()
    signInAs('recipient')
    renderLayout(ROUTES.listings)

    expect(sidebarState()).toBe('dark')
  })

  it('shows no Coming soon items, only links to pages that exist', () => {
    renderLayout()

    expect(screen.queryByText(/Coming soon/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Collections')).not.toBeInTheDocument()
    expect(screen.queryByText('Impact')).not.toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      ROUTES.yourListings,
      ROUTES.createListing,
      ROUTES.requests,
    ])
  })

  it('gives the administrator Dashboard, All listings and Handovers', () => {
    signInAs('admin')
    renderLayout(ROUTES.listings)

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Dashboard',
      'All listings',
      'Handovers',
    ])
    expect(within(nav).getByRole('link', { name: 'Handovers' })).toHaveAttribute(
      'href',
      ROUTES.completedHandovers,
    )
  })

  it('keeps Dashboard marked on Requests waiting, which the dashboard opens', () => {
    signInAs('admin')
    renderLayout(ROUTES.adminRequests)

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks the current page link with aria-current="page"', () => {
    renderLayout(ROUTES.createListing)

    expect(
      screen.getByRole('link', { name: 'Share food' }),
    ).toHaveAttribute('aria-current', 'page')

    expect(
      screen.getByRole('link', { name: 'Your listings' }),
    ).not.toHaveAttribute('aria-current')
  })
})

describe('AppLayout on a phone', () => {
  it('shows the tab bar and account menu instead of the sidebar', () => {
    setScreen('phone')
    renderLayout(ROUTES.requests)

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(sidebarState()).toBeUndefined()
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /^Requests/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('button', { name: "Account, Mama's Oven" }),
    ).toBeInTheDocument()
  })

  it('shows the sidebar and no tab bar on a desktop screen', () => {
    renderLayout()

    expect(screen.getByRole('complementary')).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /Account/ })).not.toBeInTheDocument()
    expect(sidebarState()).toBe('dark')
  })
})

describe('AppLayout navigation counts', () => {
  it("shows the donor's pending requests across their listings beside Requests", async () => {
    renderLayout()

    // Seed: three recipients waiting on the wholewheat loaves.
    const link = await screen.findByRole('link', { name: 'Requests, 3 pending' })

    expect(within(link).getByText('3')).toBeInTheDocument()
  })

  it('shows no count before the data has loaded', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: 'Requests' })).toBeInTheDocument()
  })
})