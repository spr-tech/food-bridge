// Every route in the app (React Router data mode). Pages load lazily, so each
// one is its own download; layouts and the error page load up front.
// Signed-out users are sent to /sign-in (RequireSession); pages for one role show the
// 403 message to the others (RequireRole). Spec section 2.
// The roles each guard allows are also kept on its route, so canOpen (used by sign-in
// for ?next=) follows exactly the same rules as RequireRole.
import { matchRoutes, type RouteObject } from 'react-router'
import { RequireRole, RequireSession } from '@/components/layout/RequireSession'
import { RootLayout } from '@/components/layout/RootLayout'
import { ROUTES } from '@/constants/routes'
import { ErrorPage } from '@/pages/ErrorPage'
import { HomeRedirect } from '@/pages/HomeRedirect'
import type { Role } from '@/types/role'

type RoleHandle = { roles: Role[] }

// Pages only these roles may open.
function forRoles(roles: Role[], children: RouteObject[]): RouteObject {
  const handle: RoleHandle = { roles }
  return { element: <RequireRole roles={roles} />, handle, children }
}

// In production builds this is an empty list, so the preview page isn't shipped.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: ROUTES.devForms,
        lazy: () =>
          import('@/pages/dev/FormPreviewPage').then((m) => ({ Component: m.FormPreviewPage })),
      },
    ]
  : []

export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    // Shown while the first page's code downloads.
 hydrateFallbackElement: <div className='min-h-screen bg-bg' />,        errorElement: <ErrorPage />,
    children: [
{
  Component: HomeRedirect,
  children: [
    {
      index: true,
      lazy: () => import('@/pages/LandingPage').then((m) => ({ Component: m.LandingPage })),
    },
  ],
},      {
        path: ROUTES.signIn,
        lazy: () => import('@/pages/SignInPage').then((m) => ({ Component: m.SignInPage })),
      },
      {
        element: <RequireSession />,
        children: [
          forRoles(
            ['recipient', 'admin'],
            [
              {
                path: ROUTES.listings,
                lazy: () => import('@/pages/BrowsePage').then((m) => ({ Component: m.BrowsePage })),
              },
            ],
          ),
          forRoles(
            ['donor'],
            [
              {
                path: ROUTES.createListing,
                lazy: () =>
                  import('@/pages/CreateListingPage').then((m) => ({ Component: m.CreateListingPage })),
              },
              {
                path: ROUTES.editListing,
                lazy: () =>
                  import('@/pages/EditListingPage').then((m) => ({ Component: m.EditListingPage })),
              },
              {
                path: ROUTES.yourListings,
                lazy: () =>
                  import('@/pages/YourListingsPage').then((m) => ({ Component: m.YourListingsPage })),
              },
              {
                path: ROUTES.requests,
                lazy: () => import('@/pages/RequestsPage').then((m) => ({ Component: m.RequestsPage })),
              },
            ],
          ),
          forRoles(
            ['recipient'],
            [
              {
                path: ROUTES.yourRequests,
                lazy: () =>
                  import('@/pages/YourRequestsPage').then((m) => ({ Component: m.YourRequestsPage })),
              },
            ],
          ),
          forRoles(
            ['admin'],
            [
              {
                path: ROUTES.admin,
                lazy: () => import('@/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
              },
            ],
          ),
          // Every role: the donor's and the recipient's views differ (spec S4, S5).
          {
            path: ROUTES.listingDetail,
            // When the listing endpoint exists, add a loader here that calls
            // api.util.prefetch for the listing WITHOUT awaiting it, so
            // navigation never waits for data.
            lazy: () =>
              import('@/pages/ListingDetailPage').then((m) => ({ Component: m.ListingDetailPage })),
          },
          ...devRoutes,
          {
            path: '*',
            lazy: () => import('@/pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })),
          },
        ],
      },
    ],
  },
]

// Whether this role may open the page at path (which may carry a ?query): true unless
// a guard on the way to it leaves the role out.
export function canOpen(role: Role, path: string): boolean {
  const matches = matchRoutes(routes, path)
  if (!matches) return false
  return matches.every(({ route }) => {
    const handle = route.handle as RoleHandle | undefined
    return !handle || handle.roles.includes(role)
  })
}
