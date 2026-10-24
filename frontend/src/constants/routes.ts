// Every path in the app. Use these instead of writing paths by hand.
import { generatePath } from 'react-router'

export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  listings: '/listings',
  createListing: '/listings/new',
  listingDetail: '/listings/:id',
  editListing: '/listings/:id/edit',
  yourListings: '/your-listings',
  yourRequests: '/your-requests',
  admin: '/admin',
  devForms: '/dev/forms',
} as const

export const listingDetailPath = (id: string) => generatePath(ROUTES.listingDetail, { id })

export const editListingPath = (id: string) => generatePath(ROUTES.editListing, { id })
