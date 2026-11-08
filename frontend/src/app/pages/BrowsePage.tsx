// /listings: recipients find food on offer (spec S3, "Find food"); administrators see
// the same list as "All listings", the name in their menu.
import { useSession } from '@/stores/sessionStore'
import { PageContainer } from '@/components/layouts/PageContainer'
import { PageHeader } from '@/components/layouts/PageHeader'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { FindFood } from '@/components/content/listings/find-food/FindFood'

// The heading and description for each kind of user. The desktop description is the
// long one; phones get the short one.
const COPY = {
  recipient: {
    title: 'Find food',
    eyebrow: 'Recipient · Find food',
    long: 'Discover surplus food from local businesses and organisations in your area.',
    short: 'Surplus food from local businesses near you.',
  },
  admin: {
    title: 'All listings',
    eyebrow: 'Administrator · All listings',
    long: 'Every listing on FoodBridge. Use Status to see reserved, collected, expired and deleted ones.',
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
        eyebrow={copy.eyebrow}
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