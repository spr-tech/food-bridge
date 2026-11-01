// Who is offered "Delete listing". The service decides who may actually delete; this
// only keeps the button off listings the account couldn't delete anyway.
// - an administrator: any listing
// - the donor who owns it: while it is Available or Expired (not once it is Reserved
//   or Collected, when a recipient is counting on it or has it)
// - anyone else: never
import type { Listing, Session } from '@/types/api'

const DONOR_DELETABLE: ReadonlySet<Listing['status']> = new Set(['AVAILABLE', 'EXPIRED'])

export function canDeleteListing(
  session: Pick<Session, 'role' | 'accountId'> | null,
  listing: Pick<Listing, 'donorId' | 'status'>,
): boolean {
  if (!session) return false
  if (session.role === 'admin') return true
  return (
    session.role === 'donor' &&
    // mapBackendListing leaves donorId empty when the service leaves it out.
    listing.donorId !== '' &&
    listing.donorId === session.accountId &&
    DONOR_DELETABLE.has(listing.status)
  )
}
