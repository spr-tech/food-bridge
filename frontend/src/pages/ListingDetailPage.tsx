// /listings/:id: one listing; the owning donor's view and everyone else's differ (spec S4,
// S5). The section sets the tab title to the food's name once it loads.
import { useParams } from 'react-router'
import { ListingDetails } from '@/sections/listing-details/ListingDetails'

export function ListingDetailPage() {
  const { id = '' } = useParams()

  // A new key per listing, so moving between listings starts each one fresh.
  return <ListingDetails key={id} listingId={id} />
}
