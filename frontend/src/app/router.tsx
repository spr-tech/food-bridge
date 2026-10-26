// Every route in the app (React Router data mode). Pages load lazily, so each
// one is its own download; layouts and the error page load up front.
// Signed-out users are sent to /sign-in (RequireSession); pages for one role show the
// 403 message to the others (RequireRole). Spec section 2.
import { createBrowserRouter, type RouteObject } from 'react-router'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { RequireRole, RequireSession } from '@/components/layout/RequireSession'
import { RootLayout } from '@/components/layout/RootLayout'
import { ROUTES } from '@/constants/routes'
import { ErrorPage } from '@/pages/ErrorPage'
import { HomeRedirect } from '@/pages/HomeRedirect'

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

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    // Shown while the first page's code downloads.
    HydrateFallback: DemoBanner,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: HomeRedirect },
      {
        path: ROUTES.signIn,
        lazy: () => import('@/pages/SignInPage').then((m) => ({ Component: m.SignInPage })),
      },
      {
        element: <RequireSession />,
        children: [
          {
            element: <RequireRole roles={['recipient', 'admin']} />,
            children: [
              {
                path: ROUTES.listings,
                lazy: () => import('@/pages/BrowsePage').then((m) => ({ Component: m.BrowsePage })),
              },
            ],
          },
          {
            element: <RequireRole roles={['donor']} />,
            children: [
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
          },
          {
            element: <RequireRole roles={['recipient']} />,
            children: [
              {
                path: ROUTES.yourRequests,
                lazy: () =>
                  import('@/pages/YourRequestsPage').then((m) => ({ Component: m.YourRequestsPage })),
              },
            ],
          },
          {
            element: <RequireRole roles={['admin']} />,
            children: [
              {
                path: ROUTES.admin,
                lazy: () => import('@/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
              },
            ],
          },
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
])
