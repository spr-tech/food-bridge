// The sidebar follows the chosen language: switched to French, its links and tagline read
// in French, and <html lang> says so for screen readers.
// Switches back to English afterwards so the other tests are unaffected.
import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import i18next from '@/configs/i18nConfig'
import { RequireSession } from '@/components/layouts/RequireSession'
import { ROUTES } from '@/utilities/constants/routes'
import { renderRoutes, signInAs } from '@/test/render'

const originalMatchMedia = window.matchMedia

afterEach(async () => {
  window.matchMedia = originalMatchMedia
  await i18next.changeLanguage('en')
})

describe('Navigation in French', () => {
  it('shows the sidebar labels in French and sets <html lang="fr">', async () => {
    // The sidebar is the desktop layout.
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
    signInAs('donor')
    renderRoutes(
      [{ element: <RequireSession />, children: [{ path: ROUTES.yourListings, element: <p>Home</p> }] }],
      { initialEntries: [ROUTES.yourListings] },
    )
    await screen.findByText('Home')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: /Your listings/ })).toBeInTheDocument()

    await act(() => i18next.changeLanguage('fr'))

    expect(within(nav).getByRole('link', { name: /Vos annonces/ })).toBeInTheDocument()
    expect(screen.getByText('Ensemble, réduisons le gaspillage alimentaire.')).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: /Your listings/ })).not.toBeInTheDocument()
    expect(document.documentElement.lang).toBe('fr')
  })
})
