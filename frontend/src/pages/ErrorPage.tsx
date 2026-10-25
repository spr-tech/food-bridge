// The root route's error page, shown if a page crashes or fails to load. It replaces
// the whole layout, so it brings its own demonstration line. Raw error text is never shown.
import { Link } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { ROLE_CONFIG } from '@/constants/roles'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRole } from '@/hooks/useRole'

const TITLE = 'Something went wrong'

export function ErrorPage() {
  useDocumentTitle(TITLE)
  const { homePath } = ROLE_CONFIG[useRole()]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <PageHeader title={TITLE} description="Try again, or go back to your home page." />
      <Link to={homePath} className="font-medium text-primary underline underline-offset-4">
        Go to your home page
      </Link>
      <DemoBanner />
    </main>
  )
}
