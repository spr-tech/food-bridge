// /listings/:id: one listing; recipient and donor views differ (spec S4, S5).
// Placeholder: shows only its heading until the screen is built.
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Listing detail'

export function ListingDetailPage() {
  useDocumentTitle(TITLE)

  return <PageHeader title={TITLE} />
}
