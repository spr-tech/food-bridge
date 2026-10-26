// /your-listings: the donor's own listings, newest first (spec S6), with a button to
// share more food.
import { useNavigate } from 'react-router'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { YourListings } from '@/sections/your-listings/YourListings'

const TITLE = 'Your listings'

export function YourListingsPage() {
  useDocumentTitle(TITLE)
  const navigate = useNavigate()

  return (
    <PageContainer>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={TITLE} description="Food you've shared, newest first. Open one to see its requests." />
        <Button onClick={() => void navigate(ROUTES.createListing)}>List surplus food</Button>
      </div>
      <YourListings />
    </PageContainer>
  )
}