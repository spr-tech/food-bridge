// PageContainer and the pages that use it (spec section 12): every signed-in page sits in
// one container, centred (mx-auto) up to its page's max width. jsdom has no layout, so
// these check the classes that do the centring, and which width each page asks for.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageContainer } from '@/components/common/PageContainer'
import { listingDetailPath, ROUTES } from '@/constants/routes'
import { BrowsePage } from '@/pages/BrowsePage'
import { CreateListingPage } from '@/pages/CreateListingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ListingDetailPage } from '@/pages/ListingDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RequestsPage } from '@/pages/RequestsPage'
import { YourListingsPage } from '@/pages/YourListingsPage'
import { YourRequestsPage } from '@/pages/YourRequestsPage'
import { renderRoutes, signInAs } from '@/test/render'

describe('PageContainer', () => {
  it.each([
    ['details', 'max-w-200'],
    ['form', 'max-w-215'],
    ['wide', 'max-w-270'],
  ] as const)('centres a "%s" page up to %s, full width below it', (width, maxWidth) => {
    render(<PageContainer width={width}>Page</PageContainer>)

    const container = screen.getByText('Page')
    expect(container).toHaveClass('mx-auto', 'w-full', maxWidth)
  })

  it('is wide (1080px) unless a page says otherwise', () => {
    render(<PageContainer>Page</PageContainer>)

    expect(screen.getByText('Page')).toHaveClass('max-w-270')
  })
})

// The page's h1 sits inside the container, so the heading lines up with the content.
const widthAroundHeading = () => screen.getAllByRole('heading', { level: 1 })[0].closest('[data-page-width]')?.getAttribute('data-page-width')

describe('Pages in the container', () => {
  it.each([
    ['Find food', 'recipient', ROUTES.listings, <BrowsePage />, 'wide'],
    ['Share food', 'donor', ROUTES.createListing, <CreateListingPage />, 'form'],
    ['Your listings', 'donor', ROUTES.yourListings, <YourListingsPage />, 'wide'],
    ['Your requests', 'recipient', ROUTES.yourRequests, <YourRequestsPage />, 'wide'],
    ['Requests', 'donor', ROUTES.requests, <RequestsPage />, 'wide'],
    ['Dashboard', 'admin', ROUTES.admin, <DashboardPage />, 'wide'],
    ['Page not found', 'donor', '/nowhere', <NotFoundPage />, 'wide'],
  ] as const)('%s uses the container (%s)', (_name, who, path, page, width) => {
    signInAs(who)
    renderRoutes([{ path, element: page }], { initialEntries: [path] })

    expect(widthAroundHeading()).toBe(width)
  })

  it('Listing details uses the 800px container', async () => {
    signInAs('recipient')
    renderRoutes([{ path: ROUTES.listingDetail, element: <ListingDetailPage /> }], {
      initialEntries: [listingDetailPath('lst-09')],
    })

    expect(await screen.findByRole('heading', { level: 1, name: 'Moi moi and fried plantain' })).toBeInTheDocument()
    expect(widthAroundHeading()).toBe('details')
  })
})
