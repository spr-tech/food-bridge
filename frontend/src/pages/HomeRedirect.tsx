// "/": sends each role to its home page (donor, recipient or admin).
import { Navigate } from 'react-router'
import { ROLE_CONFIG } from '@/constants/roles'
import { useRole } from '@/hooks/useRole'

export function HomeRedirect() {
  return <Navigate to={ROLE_CONFIG[useRole()].homePath} replace />
}
