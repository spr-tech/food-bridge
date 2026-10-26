// /listings/new: a donor shares surplus food (spec S2, "Share food").
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ShareFoodForm } from '@/sections/share-food/ShareFoodForm'

const TITLE = 'Share food'

export function CreateListingPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer width="form">
      <PageHeader
        title={TITLE}
        description={
          <>
            <span className="hidden md:inline">
              Fill in the details below to list surplus food and get it to people who need it.
            </span>
            <span className="md:hidden">List surplus food so people who need it can request it.</span>
          </>
        }
      />
      <ShareFoodForm />
    </PageContainer>
  )
}
