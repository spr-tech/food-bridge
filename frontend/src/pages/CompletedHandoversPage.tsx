// /admin/handovers: every completed handover, opened from the dashboard's card.
import { PageContainer } from '@/components/common/PageContainer'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  CompletedHandovers,
  CompletedHandoversHeader,
} from '@/sections/completed-handovers/CompletedHandovers'

export function CompletedHandoversPage() {
  useDocumentTitle('Completed handovers')

  return (
    <PageContainer width="dashboard">
      <CompletedHandoversHeader />
      <CompletedHandovers />
    </PageContainer>
  )
}
