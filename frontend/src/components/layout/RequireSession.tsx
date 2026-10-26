// Route guards (spec section 2).
// RequireSession: a signed-out user is sent to /sign-in, with the page they wanted in
// ?next=, so signing in brings them back. Signed in, it renders the app frame.
// RequireRole: a page for another role shows the spec's 403 message (section 4) inside
// the frame. Hiding pages is convenience only; the service decides who can do what.
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '@/app/session'
import { PageHeader } from '@/components/common/PageHeader'
import { AppLayout } from '@/components/layout/AppLayout'
import { homePathFor } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Role } from '@/types/role'

export function RequireSession() {
  const session = useSession()
  const location = useLocation()

  if (!session) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`${ROUTES.signIn}?next=${next}`} replace />
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
