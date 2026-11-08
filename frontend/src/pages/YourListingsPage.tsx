// /your-listings: the donor's own listings, newest first (spec S6), with a button to
// share more food. /your-listings?view=history shows the listing history.
import { useNavigate } from 'react-router'
import { PageContainer } from '@/components/layouts/PageContainer'
import { PageHeader } from '@/components/layouts/PageHeader'
import { Button } from '@/components/ui/button/button'
import { ROUTES } from '@/utilities/constants/routes'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { YourListings } from '@/sections/your-listings/YourListings'

const TITLE = 'Your listings'

export function YourListingsPage() {
  useDocumentTitle(TITLE)
  const navigate = useNavigate()

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Donor · Your listings"
        title={TITLE}
        description="Food you've shared, newest first. Open one to see its requests; finished listings move to Listing history."
        actions={<Button onClick={() => void navigate(ROUTES.createListing)}>List surplus food</Button>}
      />
      <YourListings />
    </PageContainer>
  )
}