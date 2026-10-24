// /listings/:id/edit: the owning donor edits a listing (after Monday).
// Placeholder: shows only its heading until the screen is built.
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Edit listing'

export function EditListingPage() {
  useDocumentTitle(TITLE)

  return <PageHeader title={TITLE} />
}
