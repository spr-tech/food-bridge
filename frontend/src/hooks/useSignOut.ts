// Signs the user out: clears this session's sidebar state (so the next sign-in starts
// dark green) and goes to the sign-in page.
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants/routes'
import { resetSidebarTheme } from '@/hooks/useSidebarTheme'

export function useSignOut() {
  const navigate = useNavigate()

  return useCallback(() => {
    // TODO(auth): end the session with the service before leaving.
    resetSidebarTheme()
    void navigate(ROUTES.signIn)
  }, [navigate])
}
