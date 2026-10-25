// The counts beside the navigation links: a donor's pending requests across their
// listings (Requests), and a recipient's own pending requests (Your requests).
// Cancelled, declined and expired requests don't count. No count until the data loads.
import { useSession } from '@/app/session'
import type { NavCounts } from '@/components/layout/Sidebar'
import { ROUTES } from '@/constants/routes'
import { useMyListings } from '@/services/listings'
import { useMyRequests } from '@/services/requests'

export function useNavCounts(): NavCounts {
  const role = useSession()?.role
  const myListings = useMyListings({ skip: role !== 'donor' })
  const myRequests = useMyRequests({ skip: role !== 'recipient' })

  if (role === 'donor' && myListings.data) {
    return {
      [ROUTES.requests]: myListings.data.reduce((sum, listing) => sum + listing.pendingRequestCount, 0),
    }
  }
  if (role === 'recipient' && myRequests.data) {
    return {
      [ROUTES.yourRequests]: myRequests.data.filter((request) => request.status === 'PENDING').length,
    }
  }
  return {}
}
