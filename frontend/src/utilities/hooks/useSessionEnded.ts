// For a 401 from the service (spec section 4): clears the session and cached data and
// goes to sign in with "Your session ended. Sign in again.", coming back here afterwards.
import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { clearSession } from '@/app/session'
import { ROUTES } from '@/utilities/constants/routes'
import { useAppDispatch } from '@/utilities/hooks/useAppStore'
import { api } from '@/services/api'

export function useSessionEnded() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()

  return useCallback(async () => {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    // flushSync: leave the page before the session is cleared. Otherwise RequireSession,
    // still on screen during the router's transition, would see no session and send the
    // user to sign in again without "Your session ended".
    await navigate(`${ROUTES.signIn}?reason=session-ended&next=${next}`, { replace: true, flushSync: true })
    clearSession()
    dispatch(api.util.resetApiState())
  }, [navigate, location, dispatch])
}
