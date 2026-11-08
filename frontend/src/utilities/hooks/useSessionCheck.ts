// Confirms a stored session with the service (GET /api/auth/me) once per signed-in
// account, without holding up the page. A 401 means the token has expired or is invalid:
// the session ends as for any other 401. Otherwise the stored account details follow the
// service's, so a changed role or organisation name takes effect without signing in again.
import { useEffect } from 'react'
import { saveSession } from '@/stores/sessionStore'
import { useSessionEnded } from '@/utilities/hooks/useSessionEnded'
import { useCurrentAccount } from '@/services/auth'
import { errorStatus } from '@/services/errors'
import type { Session } from '@/types/api'

export function useSessionCheck(session: Session | null) {
  const me = useCurrentAccount(session?.accountId)
  const sessionEnded = useSessionEnded()

  useEffect(() => {
    if (session && errorStatus(me.error) === 401) void sessionEnded()
  }, [session, me.error, sessionEnded])

  useEffect(() => {
    if (!session || !me.data) return
    const confirmed: Session = {
      ...session,
      accountId: me.data.accountId,
      role: me.data.role,
      organisationName: me.data.organisationName || session.organisationName,
      email: me.data.email || session.email,
    }
    const changed = (Object.keys(confirmed) as (keyof Session)[]).some(
      (key) => confirmed[key] !== session[key],
    )
    if (changed) saveSession(confirmed)
  }, [session, me.data])
}
