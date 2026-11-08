// Route guards (spec section 2).
// RequireSession: a signed-out user is sent to /sign-in, with the page they wanted in
// ?next=, so signing in brings them back (sign-in follows it only if the role may open
// that page). After Sign out there is no ?next=. When the service refused the token
// (services/api.ts), sign in also says "Your session ended". Signed in, it renders the app frame
// while useSessionCheck confirms the stored session with the service.
// RequireRole: a page for another role shows the spec's 403 message (section 4) inside
// the frame. Hiding pages is convenience only; the service decides who can do what.
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { useSession, wasExpired, wasSignedOut } from '@/stores/sessionStore'
import { PageHeader } from '@/components/common/PageHeader'
import { AppLayout } from '@/components/layout/AppLayout'
import { homePathFor } from '@/utilities/constants/roles'
import { ROUTES } from '@/utilities/constants/routes'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { useSessionCheck } from '@/utilities/hooks/useSessionCheck'
import type { Role } from '@/utilities/enums/role'

export function RequireSession() {
  const session = useSession()
  const location = useLocation()
  useSessionCheck(session)

  if (!session) {
    // Signed out on purpose: no ?next=, so the next person starts on their own home page.
    if (wasSignedOut()) return <Navigate to={ROUTES.signIn} replace />
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    const reason = wasExpired() ? 'reason=session-ended&' : ''
    return <Navigate to={`${ROUTES.signIn}?${reason}next=${next}`} replace />
  }
  return <AppLayout session={session} />
}

const FORBIDDEN = "You don't have access to this."

function Forbidden({ role }: { role: Role | null }) {
  useDocumentTitle(FORBIDDEN)
  return (
    <>
      <PageHeader title={FORBIDDEN} />
      <Link to={homePathFor(role)} className="font-medium text-primary underline underline-offset-4">
        Go to your home page
      </Link>
    </>
  )
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const role = useSession()?.role ?? null
  return role && roles.includes(role) ? <Outlet /> : <Forbidden role={role} />
}
