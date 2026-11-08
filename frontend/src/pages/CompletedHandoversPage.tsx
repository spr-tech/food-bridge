// /admin/handovers: every completed handover, opened from the dashboard's card.
import { PageContainer } from '@/components/layouts/PageContainer'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
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
