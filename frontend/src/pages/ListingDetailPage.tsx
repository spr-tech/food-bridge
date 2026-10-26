// /listings/:id: one listing; the owning donor's view and everyone else's differ (spec S4,
// S5). The section sets the tab title to the food's name once it loads.
import { useParams } from 'react-router'
import { PageContainer } from '@/components/common/PageContainer'
import { ListingDetails } from '@/sections/listing-details/ListingDetails'

export function ListingDetailPage() {
  // Spaces pasted along with the address (/listings/lst-01%20%20) are not part of the id.
  const id = (useParams().id ?? '').trim()

  // A new key per listing, so moving between listings starts each one fresh.
  return (
    <PageContainer width="details">
      <ListingDetails key={id} listingId={id} />
    </PageContainer>
  )
}
