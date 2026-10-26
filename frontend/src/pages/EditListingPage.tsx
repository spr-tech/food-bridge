// /listings/:id/edit: the owning donor edits a listing (after Monday).
// Placeholder: shows only its heading until the screen is built.
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Edit listing'

export function EditListingPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer>
      <PageHeader title={TITLE} />
    </PageContainer>
  )
}
