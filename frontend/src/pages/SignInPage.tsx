// /sign-in (spec S1), as in 1-sign-in and m1-sign-in. Sits outside the app frame, so it
// provides its own main landmark and demonstration line. A signed-in user is sent on:
// back to the page they wanted (?next=, only paths inside the app) or their home page.
// Two halves from 1024px up; below that, the short header and the form.
import { Navigate, useSearchParams } from 'react-router'
import { useSession } from '@/app/session'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { homePathFor } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { SignInForm } from '@/sections/sign-in/SignInForm'
import { SignInPanelDesktop, SignInPanelPhone } from '@/sections/sign-in/SignInPanel'

// Only a path inside this app: never another site, and never back to sign in.
function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith(ROUTES.signIn)) return null
  return raw
}

export function SignInPage() {
  useDocumentTitle('Sign in')
  const session = useSession()
  const [params] = useSearchParams()

  if (session) {
    return <Navigate to={safeNext(params.get('next')) ?? homePathFor(session.role)} replace />
  }

  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-2">
      <div className="hidden lg:flex lg:flex-col [&>*]:flex-1">
        <SignInPanelDesktop />
      </div>
      <div className="lg:hidden">
        <SignInPanelPhone />
      </div>
      <div className="flex flex-col items-center px-5 py-[22px] lg:justify-center lg:px-8 lg:py-12">
        <div className="w-full max-w-[440px]">
          <SignInForm sessionEnded={params.get('reason') === 'session-ended'} />
          <DemoBanner />
        </div>
      </div>
    </main>
  )
}
