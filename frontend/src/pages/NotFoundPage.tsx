// Shown for any address that matches no route.
import { Link } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { ROLE_CONFIG } from '@/constants/roles'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useRole } from '@/hooks/useRole'

const TITLE = 'Page not found'

export function NotFoundPage() {
  useDocumentTitle(TITLE)
  const { homePath } = ROLE_CONFIG[useRole()]

  return (
    <>
      <PageHeader title={TITLE} description="Check the address, or go back to your home page." />
      <Link to={homePath} className="font-medium text-primary underline underline-offset-4">
        Go to your home page
      </Link>
    </>
  )
}
