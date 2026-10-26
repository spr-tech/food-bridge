// Test helpers: render routes the way the app does (a fresh Redux store, a memory router
// and the shared ToastProvider), and sign in as one of the seeded demo accounts.
import { render, screen, waitFor, within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createMemoryRouter, Outlet, RouterProvider, type RouteObject } from 'react-router'
import { expect } from 'vitest'
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

// A toast's action button, once it can be clicked. Radix Toast keeps its viewport at
// pointer-events: none until it has counted the new toast, one render after the toast's
// text appears; on a busy test run a click can land in that gap.
export async function findToastAction(title: string, action: string): Promise<HTMLElement> {
  const toast = (await screen.findByText(title)).closest('li')
  if (!toast) throw new Error(`No toast "${title}"`)
  const button = within(toast).getByRole('button', { name: action })
  await waitFor(() => {
    for (let el: HTMLElement | null = button; el; el = el.parentElement) {
      expect(getComputedStyle(el).pointerEvents).not.toBe('none')
    }
  })
  return button
}

// The seeded accounts by the name tests use for them.
const ACCOUNT_IDS = {
  donor: 'acc-donor',
  recipient: 'acc-recipient',
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
