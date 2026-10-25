// AppLayout: the sidebar's dark-to-cream flood and its session memory, the Coming soon
// items, the current link, and the phone layout replacing the sidebar.
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/components/layout/AppLayout'
import { ROUTES } from '@/constants/routes'
import { SIDEBAR_STORAGE_KEY } from '@/hooks/useSidebarTheme'

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

// The test runs as a donor (src/app/devRole.ts): Your listings, Share food, Requests.
function renderLayout(path: string = ROUTES.yourListings) {
  const router = createMemoryRouter(
    [
      { path: ROUTES.signIn, element: <h1>Sign in</h1> },
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.yourListings, element: <h1>Your listings</h1> },
          { path: ROUTES.createListing, element: <h1>Share food</h1> },
          { path: ROUTES.requests, element: <h1>Requests</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

function sidebarState() {
  return document.querySelector('[data-sidebar]')?.getAttribute('data-sidebar')
}

beforeEach(() => {
  setScreen('desktop')
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  sessionStorage.clear()
  vi.useRealTimers()
})

describe('AppLayout sidebar', () => {
  it('starts dark green after sign-in', () => {
    renderLayout()

    expect(sidebarState()).toBe('dark')
  })

  it('floods to cream on the first link click, remembers it, and floods only once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderLayout()

    await user.click(screen.getByRole('link', { name: 'Share food' }))

    expect(sidebarState()).toBe('flooding')
    expect(sessionStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('cream')

    act(() => {
      vi.advanceTimersByTime(2600)
    })
    expect(sidebarState()).toBe('cream')

    await user.click(screen.getByRole('link', { name: 'Requests' }))
    expect(sidebarState()).toBe('cream')
  })

  it('counts a click on the current page link as the first click', async () => {
    const user = userEvent.setup()
    renderLayout(ROUTES.yourListings)

    await user.click(screen.getByRole('link', { name: 'Your listings' }))

    expect(sidebarState()).toBe('flooding')
  })

  it('stays cream, without replaying the flood, after a reload', () => {
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, 'cream')

    renderLayout()

    expect(sidebarState()).toBe('cream')
  })

  it('starts dark green again after signing out', async () => {
    const user = userEvent.setup()
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, 'cream')
    const { unmount } = renderLayout()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(sessionStorage.getItem(SIDEBAR_STORAGE_KEY)).toBeNull()

    unmount()
    renderLayout()
    expect(sidebarState()).toBe('dark')
  })

  it('never lets Tab reach the Coming soon items', async () => {
    const user = userEvent.setup()
    renderLayout()

    expect(screen.getByText('Collections')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Collections|Impact/ })).not.toBeInTheDocument()

    // Tab through everything (focus wraps back to the page after the last control).
    const reached: Element[] = []
    for (let i = 0; i < 10; i += 1) {
      await user.tab()
      if (document.activeElement && document.activeElement !== document.body) {
        reached.push(document.activeElement)
      }
    }
    expect(reached.map((element) => element.textContent)).toContain('Sign out')
    const comingSoon = [screen.getByText('Collections'), screen.getByText('Impact')].map(
      (label) => label.closest('.fb-later'),
    )
    expect(reached.some((element) => comingSoon.some((item) => item?.contains(element)))).toBe(false)
  })

  it('marks the current page link with aria-current="page"', () => {
    renderLayout(ROUTES.createListing)

    expect(screen.getByRole('link', { name: 'Share food' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Your listings' })).not.toHaveAttribute('aria-current')
  })
})

describe('AppLayout on a phone', () => {
  it('shows the tab bar and account menu instead of the sidebar', () => {
    setScreen('phone')
    renderLayout(ROUTES.requests)

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(sidebarState()).toBeUndefined()
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Requests' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: "Account, Mama's Oven" })).toBeInTheDocument()
  })

  it('shows the sidebar and no tab bar on a desktop screen', () => {
    renderLayout()

    expect(screen.getByRole('complementary')).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /Account/ })).not.toBeInTheDocument()
  })
})
