// /your-listings: the donor's own listings, newest first (spec S6).
// Placeholder: shows only its heading until the screen is built.
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Your listings'

export function YourListingsPage() {
  useDocumentTitle(TITLE)

  return <PageHeader title={TITLE} />
}
