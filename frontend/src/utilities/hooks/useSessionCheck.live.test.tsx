// Restoring a stored session against the live service (mocks off, fetch stubbed):
// RequireSession confirms it once with GET /api/auth/me and the bearer token. A 401 (an
// expired or invalid token) ends the session; a changed role or name is stored.
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/stores/sessionStore'
import { RequireRole, RequireSession } from '@/components/layout/RequireSession'
import { ROUTES } from '@/utilities/constants/routes'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const fetchMock = vi.fn<typeof fetch>()
const meCalls = () =>
  fetchMock.mock.calls
    .map(([input]) => input as Request)
    .filter((request) => request.url === 'https://api.test/api/auth/me')

const me = {
  id: 'acc-donor',
  name: 'donor1',
  role: 'DONOR',
  organisationName: "Mama's Oven",
  email: 'donor@foodbridge.test',
}

function renderApp(entry: string) {
  return renderRoutes(
    [
      { path: ROUTES.signIn, element: <h1>Sign in page</h1> },
      {
        element: <RequireSession />,
        children: [
          {
            element: <RequireRole roles={['donor']} />,
            children: [
              {
                path: ROUTES.requests,
                element: (
                  <>
                    <h1>Requests page</h1>
                    <Link to={ROUTES.yourListings}>Go to your listings</Link>
                  </>
                ),
              },
              { path: ROUTES.yourListings, element: <h1>Your listings page</h1> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [entry] },
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  signInAs('donor')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('session check (live service)', () => {
  it('confirms the stored session once with GET /api/auth/me and the bearer token', async () => {
    fetchMock.mockImplementation(async () => Response.json(me))
    renderApp(ROUTES.requests)

    expect(await screen.findByRole('heading', { name: 'Requests page' })).toBeInTheDocument()
    await waitFor(() => expect(meCalls()).toHaveLength(1))
    expect(meCalls()[0].method).toBe('GET')
    expect(meCalls()[0].headers.get('Authorization')).toBe('Bearer test-token-donor')

    // Moving between pages doesn't ask again.
    await userEvent.setup().click(screen.getByRole('link', { name: 'Go to your listings' }))
    expect(await screen.findByRole('heading', { name: 'Your listings page' })).toBeInTheDocument()
    expect(meCalls()).toHaveLength(1)
    expect(getSession()).toMatchObject({ token: 'test-token-donor', accountId: 'acc-donor', role: 'donor' })
  })

  it('ends the session on a 401 and sends the user to sign in, coming back afterwards', async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 401 }))
    const { router } = renderApp(ROUTES.requests)

    expect(await screen.findByRole('heading', { name: 'Sign in page' })).toBeInTheDocument()
    expect(getSession()).toBeNull()
    expect(router.state.location.search).toBe(
      `?reason=session-ended&next=${encodeURIComponent(ROUTES.requests)}`,
    )
  })

  it("keeps the session when the check can't reach the service", async () => {
    fetchMock.mockImplementation(async () => {
      throw new TypeError('Failed to fetch')
    })
    renderApp(ROUTES.requests)

    expect(await screen.findByRole('heading', { name: 'Requests page' })).toBeInTheDocument()
    await waitFor(() => expect(meCalls()).toHaveLength(1))
    expect(getSession()).toMatchObject({ token: 'test-token-donor' })
  })

  it("stores the service's account details when they differ from the stored ones", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ ...me, role: 'RECIPIENT', organisationName: 'Hope Community Kitchen' }),
    )
    renderApp(ROUTES.requests)

    // The role guard now follows the service's role.
    expect(await screen.findByRole('heading', { name: "You don't have access to this." })).toBeInTheDocument()
    expect(getSession()).toMatchObject({
      token: 'test-token-donor',
      role: 'recipient',
      organisationName: 'Hope Community Kitchen',
    })
  })
})
