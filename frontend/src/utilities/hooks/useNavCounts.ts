// The counts beside the navigation links: a donor's pending requests across their
// listings (Requests), and a recipient's own pending requests (Your requests).
// Cancelled, declined and expired requests don't count. No count until the data loads.
// Only requests still awaiting a decision count: the donor's on Available listings, and
// the recipient's that show as Pending (getRecipientRequestStatus). The service can still
// store a request as PENDING once its listing is reserved, collected or expired.
import { useSession } from '@/stores/sessionStore'
import type { NavCounts } from '@/components/layout/Sidebar'
import { ROUTES } from '@/utilities/constants/routes'
import { getRecipientRequestStatus } from '@/utilities/helpers/request-status'
import { useMyListings } from '@/services/listings'
import { useMyRequests } from '@/services/requests'

export function useNavCounts(): NavCounts {
  const role = useSession()?.role
  const myListings = useMyListings({ skip: role !== 'donor' })
  const myRequests = useMyRequests({ skip: role !== 'recipient' })

  if (role === 'donor' && myListings.data) {
    return {
      [ROUTES.requests]: myListings.data
        .filter((listing) => listing.status === 'AVAILABLE')
        .reduce((sum, listing) => sum + listing.pendingRequestCount, 0),
    }
  }
  if (role === 'recipient' && myRequests.data) {
    return {
      [ROUTES.yourRequests]: myRequests.data.filter(
        (request) => getRecipientRequestStatus(request.status, request.listing.status) === 'PENDING',
      ).length,
    }
  }
  return {}
}
