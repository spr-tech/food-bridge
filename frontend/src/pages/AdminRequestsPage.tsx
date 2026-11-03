// /admin/requests: requests waiting for a donor's decision, opened from the dashboard's card.
import { PageContainer } from '@/components/common/PageContainer'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AdminRequests, AdminRequestsHeader } from '@/sections/admin-requests/AdminRequests'

export function AdminRequestsPage() {
  useDocumentTitle('Requests waiting')

  return (
    <PageContainer width="dashboard">
      <AdminRequestsHeader />
      <AdminRequests />
    </PageContainer>
  )
}
