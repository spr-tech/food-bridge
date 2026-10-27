// Signs the user out: goes to the sign-in page, then clears the session, this session's
// sidebar state (so the next sign-in starts dark green) and the cached data, so the
// next account never sees the last one's. The simulated data itself is kept.
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { signOutSession } from '@/app/session'
import { ROUTES } from '@/constants/routes'
import { useAppDispatch } from '@/hooks/useAppStore'
import { resetSidebarTheme } from '@/hooks/useSidebarTheme'
import { api } from '@/services/api'

export function useSignOut() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  return useCallback(async () => {
    // TODO(auth): end the session with the service before leaving.
    // Sign in with no ?next=, so the next person starts on their own home page. The
    // page being left may render once more without a session before the sign-in page
    // shows; signOutSession tells RequireSession not to add ?next= then either.
    await navigate(ROUTES.signIn, { replace: true })
    signOutSession()
    resetSidebarTheme()
    dispatch(api.util.resetApiState())
  }, [navigate, dispatch])
}
