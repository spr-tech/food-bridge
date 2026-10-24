// /listings/new: a donor publishes a listing (spec S2).
// Placeholder: shows only its heading until the screen is built.
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'List surplus food'

export function CreateListingPage() {
  useDocumentTitle(TITLE)

  return <PageHeader title={TITLE} />
}
