// /your-requests: the recipient's requests and their statuses (spec S7).
// Placeholder: shows only its heading until the screen is built.
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Your requests'

export function YourRequestsPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer>
      <PageHeader title={TITLE} />
    </PageContainer>
  )
}
