// /requests: every request on the donor's listings (spec S8). Its endpoint is TBC, so
// Monday's approve runs from listing details (S5).
// Placeholder: shows only its heading until the screen is built.
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Requests'

export function RequestsPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer>
      <PageHeader title={TITLE} />
    </PageContainer>
  )
}
