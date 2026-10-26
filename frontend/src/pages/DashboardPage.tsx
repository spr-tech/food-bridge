// /admin: the administrator's dashboard (brief journey 5).
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AdminDashboard } from '@/sections/admin-dashboard/AdminDashboard'

const TITLE = 'Dashboard'

export function DashboardPage() {
  useDocumentTitle(TITLE)

  return (
    <PageContainer>
      <PageHeader title={TITLE} description="How FoodBridge is doing, across every listing." />
      <AdminDashboard />
    </PageContainer>
  )
}