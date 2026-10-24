// Every route in the app (React Router data mode). Pages load lazily, so each
// one is its own download; layouts and the error page load up front.
import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { DemoBanner } from '@/components/layout/DemoBanner'
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
        Component: AppLayout,
        children: [
          {
            path: ROUTES.listings,
            lazy: () => import('@/pages/BrowsePage').then((m) => ({ Component: m.BrowsePage })),
          },
          {
            path: ROUTES.createListing,
            lazy: () =>
              import('@/pages/CreateListingPage').then((m) => ({ Component: m.CreateListingPage })),
          },
          {
            path: ROUTES.listingDetail,
            // When the listing endpoint exists, add a loader here that calls
            // api.util.prefetch for the listing WITHOUT awaiting it, so
            // navigation never waits for data.
            lazy: () =>
              import('@/pages/ListingDetailPage').then((m) => ({ Component: m.ListingDetailPage })),
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
            path: ROUTES.yourRequests,
            lazy: () =>
              import('@/pages/YourRequestsPage').then((m) => ({ Component: m.YourRequestsPage })),
          },
          {
            path: ROUTES.admin,
            lazy: () => import('@/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
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
