// /admin: the administrator's dashboard (brief journey 5).
import { PageContainer } from '@/components/layouts/PageContainer'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { AdminDashboard, DashboardHeader } from '@/components/content/admin/dashboard/AdminDashboard'

const TITLE = 'Dashboard'

export function DashboardPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer width="dashboard">
      <DashboardHeader />
      <AdminDashboard />
    </PageContainer>
  )
}
