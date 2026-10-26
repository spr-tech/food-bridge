// /listings: recipients find food on offer (spec S3, "Find food"); administrators see
// the same list as "All listings", the name in their menu.
import { useSession } from '@/app/session'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { FindFood } from '@/sections/find-food/FindFood'

// The heading and description for each kind of user. The desktop description is the
// long one; phones get the short one.
const COPY = {
  recipient: {
    title: 'Find food',
    long: 'Discover surplus food from local businesses and organisations in your area.',
    short: 'Surplus food from local businesses near you.',
  },
  admin: {
    title: 'All listings',
    long: 'Every listing on FoodBridge. Use Status to see reserved, collected and expired ones.',
    short: 'Every listing on FoodBridge.',
  },
}

export function BrowsePage() {
  const role = useSession()?.role
  const copy = role === 'admin' ? COPY.admin : COPY.recipient
  useDocumentTitle(copy.title)

  return (
    <PageContainer>
      <PageHeader
        title={copy.title}
        description={
          <>
            <span className="hidden md:inline">{copy.long}</span>
            <span className="md:hidden">{copy.short}</span>
          </>
        }
      />
      <FindFood />
    </PageContainer>
  )
}