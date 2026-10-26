// "/": sends each role to its home page (donor, recipient or admin), or to sign in.
import { Navigate } from 'react-router'
import { homePathFor } from '@/constants/roles'
import { useRole } from '@/hooks/useRole'

export function HomeRedirect() {
  return <Navigate to={homePathFor(useRole())} replace />
}
