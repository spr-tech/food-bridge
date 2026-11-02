// Which menu link is current (activeNavItem), and the sidebar and tab bar showing it:
// a listing opened from a menu page keeps that page's link current, whether it was
// reached by a click, opened directly (a refresh) or by Back and Forward.
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { RequireSession } from '@/components/layout/RequireSession'
import { activeNavItem, ROLE_CONFIG } from '@/constants/roles'
import { editListingPath, listingDetailPath, ROUTES } from '@/constants/routes'
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
  sessionStorage.clear()
})

const labelAt = (role: keyof typeof ROLE_CONFIG, path: string) =>
  activeNavItem(ROLE_CONFIG[role].nav, path)?.label

describe('activeNavItem', () => {
  it.each([
    [ROUTES.yourListings, 'Your listings'],
    [listingDetailPath('lst-01'), 'Your listings'],
    [editListingPath('lst-01'), 'Your listings'],
    // Its own page wins over the listing pattern /listings/:id.
    [ROUTES.createListing, 'Share food'],
    [ROUTES.requests, 'Requests'],
  ])('donor at %s: %s', (path, label) => {
    expect(labelAt('donor', path)).toBe(label)
  })

  it.each([
    [ROUTES.listings, 'Find food'],
    [listingDetailPath('lst-06'), 'Find food'],
    [ROUTES.yourRequests, 'Your requests'],
  ])('recipient at %s: %s', (path, label) => {
    expect(labelAt('recipient', path)).toBe(label)
  })

  it.each([
    [ROUTES.admin, 'Dashboard'],
    [listingDetailPath('lst-06'), 'All listings'],
  ])('administrator at %s: %s', (path, label) => {
    expect(labelAt('admin', path)).toBe(label)
  })

  it('none for a page outside the menu', () => {
    expect(labelAt('donor', '/somewhere-else')).toBeUndefined()
  })
})

function renderApp(path: string) {
  return renderRoutes(
    [
      {
        element: <RequireSession />,
        children: [
          { path: ROUTES.yourListings, element: <h1>Your listings page</h1> },
          { path: ROUTES.createListing, element: <h1>Share food page</h1> },
          { path: ROUTES.requests, element: <h1>Requests page</h1> },
          { path: ROUTES.listings, element: <h1>Find food page</h1> },
          { path: ROUTES.listingDetail, element: <h1>Listing page</h1> },
          { path: ROUTES.editListing, element: <h1>Edit page</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
}

const current = () =>
  screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page').map((link) => link.textContent?.trim())

describe('Sidebar current link', () => {
  it("keeps Your listings current on the donor's listing details, opened directly (a refresh)", async () => {
    setScreen('desktop')
    signInAs('donor')
    renderApp(listingDetailPath('lst-01'))
    await screen.findByRole('heading', { name: 'Listing page' })

    expect(current()).toEqual([expect.stringMatching(/^Your listings/)])
  })

  it('follows a click, Back and Forward', async () => {
    setScreen('desktop')
    signInAs('donor')
    const { router } = renderApp(listingDetailPath('lst-01'))
    await screen.findByRole('heading', { name: 'Listing page' })

    await userEvent.setup().click(screen.getByRole('link', { name: /^Requests/ }))
    await screen.findByRole('heading', { name: 'Requests page' })
    expect(current()).toEqual([expect.stringMatching(/^Requests/)])

    await act(() => router.navigate(-1))
    await screen.findByRole('heading', { name: 'Listing page' })
    expect(current()).toEqual([expect.stringMatching(/^Your listings/)])

    await act(() => router.navigate(1))
    await screen.findByRole('heading', { name: 'Requests page' })
    expect(current()).toEqual([expect.stringMatching(/^Requests/)])
  })

  it('keeps Your listings current on the edit page, and Share food on its own page', async () => {
    setScreen('desktop')
    signInAs('donor')
    const { router } = renderApp(editListingPath('lst-01'))
    await screen.findByRole('heading', { name: 'Edit page' })
    expect(current()).toEqual([expect.stringMatching(/^Your listings/)])

    await act(() => router.navigate(ROUTES.createListing))
    await screen.findByRole('heading', { name: 'Share food page' })
    expect(current()).toEqual([expect.stringMatching(/^Share food/)])
  })

  it("keeps Find food current on a recipient's listing details (phone tab bar)", async () => {
    setScreen('phone')
    signInAs('recipient')
    renderApp(listingDetailPath('lst-06'))
    await screen.findByRole('heading', { name: 'Listing page' })

    expect(current()).toEqual([expect.stringMatching(/^Find food/)])
  })
})
