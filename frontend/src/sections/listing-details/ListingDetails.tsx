// Listing details (spec S4 and S5), one page with two views:
// - the owning donor: the listing and its requests panel (S5)
// - everyone else: the listing and, for recipients, their one action (S4). Another
//   donor or an administrator sees the listing only.
// A single column, as in 4-recipient-listing-details: the back link ("Back to Find food"
// for recipients, "Back to Your listings" for donors, "Back to All listings" for
// administrators, matching each role's menu), then the listing in a card up to 760px wide
// on desktop and straight on the page on a phone (m4).
// States: skeletons for the photo and details; "We couldn't load this listing." with Try
// again; 404 "This listing no longer exists." and 403 "You don't have access to this.",
// each with a link home; a 401 goes to sign in.
import { useEffect } from 'react'
import { Link } from 'react-router'
import { useSession } from '@/app/session'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { homePathFor } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { ListingSummary } from '@/sections/listing-details/ListingSummary'
import { RecipientAction } from '@/sections/listing-details/RecipientAction'
import { RequestsPanel } from '@/sections/listing-details/RequestsPanel'
import { errorStatus } from '@/services/errors'
import { useListing } from '@/services/listings'
import type { Role } from '@/types/role'

const CARD = 'md:max-w-190 md:rounded-2xl md:border md:border-border md:bg-surface md:p-5 md:shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_22px_rgb(30_42_36/0.05)]'
const LINK = 'font-semibold text-primary underline underline-offset-4'

// Where each role's list of listings lives, named as it is in that role's menu.
function listPageFor(role: Role | null): { to: string; name: string } {
  if (role === 'donor') return { to: ROUTES.yourListings, name: 'Your listings' }
  if (role === 'admin') return { to: ROUTES.listings, name: 'All listings' }
  return { to: ROUTES.listings, name: 'Find food' }
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-3.5 inline-flex items-center gap-1.75 font-semibold text-primary md:mb-4">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </Link>
  )
}

export function ListingDetails({ listingId }: { listingId: string }) {
  const session = useSession()
  const role = session?.role ?? null
  const listing = useListing(listingId)
  const sessionEnded = useSessionEnded()
  const status = errorStatus(listing.error)
  useDocumentTitle(listing.data?.foodName ?? 'Listing details')

  useEffect(() => {
    if (status === 401) void sessionEnded()
  }, [status, sessionEnded])

  const listPage = listPageFor(role)

  let body
  if (listing.isLoading) {
    body = (
      <div className={CARD}>
        <h1 className="sr-only">Listing details</h1>
        <LoadingState label="Loading listing">
          <Skeleton shape="image" className="h-50 rounded-[14px] md:h-65 md:rounded-xl" />
          <Skeleton lines={4} />
        </LoadingState>
      </div>
    )
  } else if (status === 404) {
    body = (
      <>
        <h1 className="mb-3 text-[26px] md:text-[32px]">This listing no longer exists.</h1>
        <Link to={listPage.to} className={LINK}>
          {listPage.name}
        </Link>
      </>
    )
  } else if (status === 403) {
    body = (
      <>
        <h1 className="mb-3 text-[26px] md:text-[32px]">You don't have access to this.</h1>
        <Link to={homePathFor(role)} className={LINK}>
          Go to your home page
        </Link>
      </>
    )
  } else if (listing.isError || !listing.data) {
    body = (
      <>
        <h1 className="sr-only">Listing details</h1>
        <ErrorState
          title="We couldn't load this listing."
          description="Check your connection and try again."
          onRetry={() => void listing.refetch()}
          retrying={listing.isFetching}
        />
      </>
    )
  } else {
    // The service decides who sees the requests; this only picks the view.
    const isOwner = role === 'donor' && listing.data.donorId === session?.accountId
    body = (
      <>
        <article className={CARD}>
          <ListingSummary listing={listing.data} />
          {role === 'recipient' && <RecipientAction listing={listing.data} />}
        </article>
        {isOwner && <RequestsPanel listing={listing.data} />}
      </>
    )
  }

  return (
    <>
      <BackLink to={listPage.to} label={`Back to ${listPage.name}`} />
      {body}
    </>
  )
}