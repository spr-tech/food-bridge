// Who is offered "Delete listing". The service decides who may actually delete; this
// only keeps the button off listings the account has no claim to.
// - an administrator: any listing that isn't deleted already
// - the donor who owns it: any of their listings that isn't deleted already, whatever its
//   status. The service currently refuses Reserved and Collected listings (409
//   LISTING_NOT_DELETABLE); the confirmation then says why (DeleteListingButton), and the
//   button starts working without change if the service allows them later.
// - anyone else: never
import type { Listing, Session } from '@/types/api'

export function canDeleteListing(
  session: Pick<Session, 'role' | 'accountId'> | null,
  listing: Pick<Listing, 'donorId' | 'status'>,
): boolean {
  if (!session || listing.status === 'DELETED') return false
  if (session.role === 'admin') return true
  return (
    session.role === 'donor' &&
    // mapBackendListing leaves donorId empty when the service leaves it out.
    listing.donorId !== '' &&
    listing.donorId === session.accountId
  )
}

// Whether the listing can be edited: only while it is Available (the service's rule too,
// 409 LISTING_NOT_EDITABLE otherwise). Ownership is checked where the edit is offered.
export function isListingEditable(listing: Pick<Listing, 'status'>): boolean {
  return listing.status === 'AVAILABLE'
}
