// /listings: recipients browse and filter food on offer (spec S3).
// Placeholder: shows only its heading until the screen is built.
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Food available nearby'

export function BrowsePage() {
  useDocumentTitle(TITLE)

  return <PageHeader title={TITLE} />
}
