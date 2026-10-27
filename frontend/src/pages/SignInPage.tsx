// /sign-in (spec S1), as in 1-sign-in and m1-sign-in. Sits outside the app frame, so it
// provides its own main landmark and demonstration line. A signed-in user is sent on:
// back to the page they wanted (?next=, only paths inside the app that their role may
// open) or their home page.
// The handover photo covers the whole page and the form sits on a white card. From
// 1024px up, the welcome panel fills the left half; below that, only the logo shows.
import { Navigate, useSearchParams } from 'react-router'
import { canOpen } from '@/app/routes'
import { useSession } from '@/app/session'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { homePathFor } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { SignInForm } from '@/sections/sign-in/SignInForm'
import { SignInPanelDesktop, SignInPanelPhone } from '@/sections/sign-in/SignInPanel'
import type { Role } from '@/types/role'

// Only a path inside this app that the role may open: never another site, never back to
// sign in, and never a page that would only say "You don't have access to this."
function safeNext(raw: string | null, role: Role): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith(ROUTES.signIn)) return null
  return canOpen(role, raw) ? raw : null
}

export function SignInPage() {
  useDocumentTitle('Sign in')
  const session = useSession()
  const [params] = useSearchParams()

  if (session) {
    return <Navigate to={safeNext(params.get('next'), session.role) ?? homePathFor(session.role)} replace />
  }

  return (
    <main className='photo-backdrop grid min-h-screen content-start lg:grid-cols-2 lg:content-stretch'>
      <div className='hidden lg:flex lg:flex-col *:flex-1'>
        <SignInPanelDesktop />
      </div>
      <div className='lg:hidden'>
        <SignInPanelPhone />
      </div>
      <div className='flex flex-col items-center px-4 py-4 lg:justify-center lg:px-8 lg:py-12'>
        <div className='w-full max-w-110 rounded-2xl bg-surface px-5 pt-6 pb-5 shadow-[0_30px_70px_color-mix(in_srgb,var(--color-sidebar-dark)_45%,transparent)] lg:max-w-125 lg:rounded-3xl lg:px-11 lg:pt-11 lg:pb-8'>
          <SignInForm sessionEnded={params.get('reason') === 'session-ended'} />
          <DemoBanner />
        </div>
      </div>
    </main>
  )
}