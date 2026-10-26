// /admin: the administrator's summary figures (after Monday).
// Placeholder: shows only its heading until the screen is built.
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Dashboard'

export function DashboardPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer>
      <PageHeader title={TITLE} />
    </PageContainer>
  )
}
