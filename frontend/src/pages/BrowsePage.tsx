// /listings: recipients find food on offer (spec S3, "Find food").
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { FindFood } from '@/sections/find-food/FindFood'

const TITLE = 'Find food'

export function BrowsePage() {
  useDocumentTitle(TITLE)

  return (
    <>
      <PageHeader
        title={TITLE}
        description={
          <>
            <span className="hidden md:inline">
              Discover surplus food from local businesses and organisations in your area.
            </span>
            <span className="md:hidden">Surplus food from local businesses near you.</span>
          </>
        }
      />
      <FindFood />
    </>
  )
}
