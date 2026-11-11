// The landing page (spec S0) at "/": shown to signed-out visitors with one h1, every call
// to action going to sign in, the animated closing heading read once in full, and the
// demonstration line. A signed-in user who opens "/" goes to their home page instead.
import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18next from '@/configs/i18nConfig'
import { ROUTES } from '@/utilities/constants/routes'
import { HomeRedirect } from '@/app/pages/HomeRedirect'
import { LandingPage } from '@/app/pages/LandingPage'
import { renderRoutes, signInAs } from '@/test/render'

function renderHome() {
  return renderRoutes([
    { path: '/', element: <HomeRedirect />, children: [{ index: true, element: <LandingPage /> }] },
    { path: ROUTES.signIn, element: <h1>Sign in page</h1> },
    { path: ROUTES.yourListings, element: <h1>Donor home</h1> },
    { path: ROUTES.listings, element: <h1>Recipient home</h1> },
    { path: ROUTES.admin, element: <h1>Admin home</h1> },
  ])
}

describe('Landing page', () => {
  it('shows signed-out visitors the landing page, with one h1', () => {
    renderHome()

    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      'Good food deserves another table.',
    ])
  })

  it('sends every call to action to sign in', () => {
    renderHome()

    const actions = screen.getAllByRole('link', {
      name: /^(Sign in|Share surplus food|Find food for your group|Find food now|Sign in to FoodBridge)$/,
    })
    expect(actions.length).toBeGreaterThanOrEqual(6)
    for (const link of actions) expect(link).toHaveAttribute('href', ROUTES.signIn)
  })

  it('reads the animated closing heading once, in full', () => {
    renderHome()

    expect(
      screen.getByRole('heading', { level: 2, name: 'Tonight, let nothing good go to waste.' }),
    ).toBeInTheDocument()
  })

  it('shows the demonstration line', () => {
    renderHome()

    expect(screen.getByText('Demonstration data · organisations and people are fictional')).toBeInTheDocument()
  })

  it('shows the hero heading and the animated closing phrase in French, then English again', async () => {
    renderHome()
    try {
      await act(() => i18next.changeLanguage('fr'))

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('La bonne nourriture mérite une autre table.')
      expect(
        screen.getByRole('heading', { level: 2, name: 'Ce soir, ne laissez rien de bon se perdre.' }),
      ).toBeInTheDocument()
      // The letters dropped in one by one spell the French accent, not "go to waste."
      const letters = [...document.querySelectorAll('.landing-letter')].map((letter) => letter.textContent || ' ')
      expect(letters.join('')).toBe('se perdre.')
    } finally {
      await act(() => i18next.changeLanguage('en'))
    }

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good food deserves another table.')
  })

  it.each([
    ['donor', 'Donor home'],
    ['recipient', 'Recipient home'],
    ['admin', 'Admin home'],
  ] as const)('sends a signed-in %s to their home page instead', async (who, home) => {
    signInAs(who)
    renderHome()

    expect(await screen.findByRole('heading', { name: home })).toBeInTheDocument()
    expect(screen.queryByText('Good food deserves another table.')).not.toBeInTheDocument()
  })
})