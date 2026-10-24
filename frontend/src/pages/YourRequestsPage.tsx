// /your-requests: the recipient's requests and their statuses (spec S7).
// Placeholder: shows only its heading until the screen is built.
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Your requests'

export function YourRequestsPage() {
  useDocumentTitle(TITLE)

  return <PageHeader title={TITLE} />
}
