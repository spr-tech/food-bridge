// /your-requests: the recipient's requests and what happened to each (spec S7).
import { PageContainer } from '@/components/layouts/PageContainer'
import { PageHeader } from '@/components/layouts/PageHeader'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { YourRequests } from '@/components/content/requests/your-requests/YourRequests'

const TITLE = 'Your requests'

export function YourRequestsPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Recipient · Your requests"
        title={TITLE}
        description="Food you've asked for, and what the donor decided." />
      <YourRequests />
    </PageContainer>
  )
}