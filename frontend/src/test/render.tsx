// Test helpers: render routes the way the app does (a fresh Redux store, a memory router
// and the shared ToastProvider), and sign in as one of the seeded demo accounts.
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, Outlet, RouterProvider, type RouteObject } from 'react-router'
import { saveSession } from '@/app/session'
import { makeStore } from '@/app/store'
import { ToastProvider } from '@/components/ui/toast'
import { ACCOUNTS } from '@/mocks/seed'
import type { Role } from '@/types/role'

type RenderRoutesOptions = {
  initialEntries?: string[]
}

export function renderRoutes(routes: RouteObject[], { initialEntries = ['/'] }: RenderRoutesOptions = {}) {
  const store = makeStore()
  const router = createMemoryRouter(
    [
      {
        element: (
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        ),
        children: routes,
      },
    ],
    { initialEntries },
  )
  const view = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )
  return { ...view, store, router }
}

// The seeded accounts by the name tests use for them.
const ACCOUNT_IDS = {
  donor: 'acc-donor',
  recipient: 'acc-recipient',
  recipient2: 'acc-recipient-2',
  recipient3: 'acc-recipient-3',
  admin: 'acc-admin',
} as const

export type DemoAccount = keyof typeof ACCOUNT_IDS

export function signInAs(who: DemoAccount) {
  const account = ACCOUNTS.find((a) => a.id === ACCOUNT_IDS[who])
  if (!account) throw new Error(`No seeded account for ${who}`)
  const session = {
    token: `test-token-${who}`,
    accountId: account.id,
    role: account.role as Role,
    organisationName: account.organisationName,
    email: account.email,
  }
  saveSession(session)
  return session
}
