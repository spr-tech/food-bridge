// /sign-in: email and password sign in (spec S1). Sits outside AppLayout, so it
// provides its own main landmark. Placeholder: shows only its heading for now.
import { PageHeader } from '@/components/common/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const TITLE = 'Sign in to FoodBridge'

export function SignInPage() {
  useDocumentTitle(TITLE)

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <PageHeader title={TITLE} />
    </main>
  )
}
