// /your-requests: the recipient's requests and what happened to each (spec S7).
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { YourRequests } from '@/sections/your-requests/YourRequests'

const TITLE = 'Your requests'

export function YourRequestsPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer>
      <PageHeader title={TITLE} description="Food you've asked for, and what the donor decided." />
      <YourRequests />
    </PageContainer>
  )
}