// Signs the user out, clears the session and cached API data,
// so the next account never sees the previous account's data.
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { signOutSession } from '@/app/session'
import { ROUTES } from '@/constants/routes'
import { useAppDispatch } from '@/hooks/useAppStore'
import { api } from '@/services/api'

export function useSignOut() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  return useCallback(async () => {
    // TODO(auth): end the session with the service before leaving.
    // Sign in with no ?next=, so the next person starts on their own home page.
    await navigate(ROUTES.signIn, { replace: true })
    signOutSession()
    dispatch(api.util.resetApiState())
  }, [navigate, dispatch])
}