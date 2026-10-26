// Signs the user out: goes to the sign-in page, then clears the session, this session's
// sidebar state (so the next sign-in starts dark green) and the cached data, so the
// next account never sees the last one's. The simulated data itself is kept.
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { clearSession } from '@/app/session'
import { ROUTES } from '@/constants/routes'
import { useAppDispatch } from '@/hooks/useAppStore'
import { resetSidebarTheme } from '@/hooks/useSidebarTheme'
import { api } from '@/services/api'

export function useSignOut() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  return useCallback(async () => {
    // TODO(auth): end the session with the service before leaving.
    // Leave first, so the page being left doesn't redirect with ?next= when the
    // session disappears.
    await navigate(ROUTES.signIn, { replace: true })
    clearSession()
    resetSidebarTheme()
    dispatch(api.util.resetApiState())
  }, [navigate, dispatch])
}
