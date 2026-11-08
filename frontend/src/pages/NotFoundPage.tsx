// Shown for any address that matches no route.
import { Link } from 'react-router'
import { PageContainer } from '@/components/layouts/PageContainer'
import { PageHeader } from '@/components/layouts/PageHeader'
import { homePathFor } from '@/utilities/constants/roles'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { useRole } from '@/utilities/hooks/useRole'

const TITLE = 'Page not found'

export function NotFoundPage() {
  useDocumentTitle(TITLE)
  const homePath = homePathFor(useRole())

  return (
    <PageContainer>
      <PageHeader title={TITLE} description="Check the address, or go back to your home page." />
      <Link to={homePath} className="font-medium text-primary underline underline-offset-4">
        Go to your home page
      </Link>
    </PageContainer>
  )
}
