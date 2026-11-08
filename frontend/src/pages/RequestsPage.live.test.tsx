// The donor's Requests page against the live service (mocks off, fetch stubbed), inside
// RequireSession as in the app.
// - Only Available listings with requests waiting show. Once a request is approved the
//   service still counts the listing's other requests as pending (it doesn't decline
//   them), so a Reserved or Collected listing must not stay on the page.
// - A 401 from any call ends the session (services/api.ts): the user goes to sign in with
//   "Your session ended" and ?next= back here. A refused sign-in never does.
import { act, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession, wasExpired } from '@/stores/sessionStore'
import { makeStore } from '@/configs/storeConfig'
import { RequireRole, RequireSession } from '@/components/layouts/RequireSession'
import { ROUTES } from '@/utilities/constants/routes'
import { RequestsPage } from '@/pages/RequestsPage'
import { useSignIn } from '@/services/auth'
import { listingsApi } from '@/services/listings'
import { renderRoutes, signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const me = {
  id: 'acc-donor',
  name: 'donor1',
  role: 'DONOR',
  organisationName: "Mama's Oven",
  email: 'donor@foodbridge.test',
}

const listing = (id: string, foodName: string, status: string, pendingRequestCount: number) => ({
  id,
  foodName,
  description: 'Freshly made',
  category: 'BAKERY',
  quantity: 4,
  unit: 'BOXES',
  imageReference: null,
  pickupArea: 'surulere',
  collectionDeadline: '2030-01-01T12:00:00Z',
  status,
  donorId: 'acc-donor',
  donorName: "Mama's Oven",
  createdAt: '2026-11-01T09:00:00Z',
  pendingRequestCount,
  deleted: false,
  deletedAt: null,
})

const LISTINGS = [
  listing('00000000-0000-4000-8000-000000000001', 'Fresh bread', 'AVAILABLE', 1),
  // Approved: its other two requests are still PENDING in the service.
  listing('00000000-0000-4000-8000-000000000002', 'Jollof rice', 'RESERVED', 2),
  listing('00000000-0000-4000-8000-000000000003', 'Moi moi', 'COLLECTED', 1),
  listing('00000000-0000-4000-8000-000000000004', 'Plantain', 'AVAILABLE', 0),
]

const fetchMock = vi.fn<typeof fetch>()

function serve(listingsStatus = 200) {
  fetchMock.mockImplementation(async (input) => {
    const url = new URL((input as Request).url)
    if (url.pathname === '/api/auth/me') return Response.json(me)
    if (url.pathname === '/api/listings') {
      if (listingsStatus === 401) return new Response(null, { status: 401 })
      return Response.json(LISTINGS, { headers: { 'X-Total-Count': String(LISTINGS.length) } })
    }
    if (url.pathname.endsWith('/requests')) return Response.json([])
    return new Response(null, { status: 404 })
  })
}

function renderApp() {
  return renderRoutes(
    [
      { path: ROUTES.signIn, element: <h1>Sign in page</h1> },
      {
        element: <RequireSession />,
        children: [
          {
            element: <RequireRole roles={['donor']} />,
            children: [{ path: ROUTES.requests, element: <RequestsPage /> }],
          },
        ],
      },
    ],
    { initialEntries: [ROUTES.requests] },
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

describe('Requests page (live service)', () => {
  it('shows only Available listings that have requests waiting', async () => {
    serve()
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Fresh bread' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Jollof rice' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Moi moi' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Plantain' })).not.toBeInTheDocument()
  })

  it('ends the session on a 401 and goes to sign in with ?next= back here', async () => {
    serve(401)
    const { router } = renderApp()

    expect(await screen.findByRole('heading', { name: 'Sign in page' })).toBeInTheDocument()
    expect(getSession()).toBeNull()
    expect(wasExpired()).toBe(true)
    await waitFor(() =>
      expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(
        `${ROUTES.signIn}?reason=session-ended&next=${encodeURIComponent(ROUTES.requests)}`,
      ),
    )
  })
})

describe('ending the session on a 401 (services/api.ts)', () => {
  it("doesn't end the session when sign-in is refused", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
    const store = makeStore()
    const { result } = renderHook(() => useSignIn(), {
      wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>,
    })

    let outcome: unknown
    await act(async () => {
      outcome = await result.current[0]({ email: 'donor@foodbridge.test', password: 'wrong' })
    })

    expect(outcome).toMatchObject({ error: { status: 401 } })
    expect(getSession()).not.toBeNull()
    expect(wasExpired()).toBe(false)
  })

  it("doesn't end a newer session when an earlier account's call is refused", async () => {
    let answer: (response: Response) => void = () => {}
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => (answer = resolve)))
    const store = makeStore()

    const pending = store.dispatch(listingsApi.endpoints.getMyListings.initiate())
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    // Someone else signs in while the donor's call is still out.
    signInAs('admin')
    answer(new Response(null, { status: 401 }))
    await pending

    expect(getSession()?.role).toBe('admin')
    expect(wasExpired()).toBe(false)
  })
})
