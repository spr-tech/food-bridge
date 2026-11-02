// Who is offered "Delete listing". The service decides who may actually delete; this
// only keeps the button off listings the account has no claim to.
// - an administrator: any listing that isn't deleted already
// - the donor who owns it: any of their listings that isn't deleted already, whatever its
//   status. The service currently refuses Reserved listings (409 LISTING_NOT_DELETABLE);
//   the confirmation then says why (DeleteListingButton).
// - anyone else: never
// A Collected listing is a record of a finished handover: it is offered but disabled
// (deleteBlockedReason), for the donor and administrator alike.
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

// Why Delete is shown disabled, or null when it can be tried.
export function deleteBlockedReason(listing: Pick<Listing, 'status'>): string | null {
  return listing.status === 'COLLECTED'
    ? "Collected listings can't be deleted. They're kept as a record of the handover."
    : null
}

// Whether the listing can be edited: only while it is Available (the service's rule too,
// 409 LISTING_NOT_EDITABLE otherwise). Ownership is checked where the edit is offered.
export function isListingEditable(listing: Pick<Listing, 'status'>): boolean {
  return listing.status === 'AVAILABLE'
}
