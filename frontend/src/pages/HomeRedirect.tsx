// "/": signed in, sends each role to its home page (donor, recipient or admin).
// Signed out, shows the landing page (the child route).
import { Navigate, Outlet } from 'react-router'
import { homePathFor } from '@/constants/roles'
import { useRole } from '@/hooks/useRole'

export function HomeRedirect() {
  const role = useRole()
  if (role) return <Navigate to={homePathFor(role)} replace />
  return <Outlet />
}