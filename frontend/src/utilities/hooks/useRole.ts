// The signed-in account's role, from the session, or null when signed out.
import { useSession } from '@/stores/sessionStore'
import type { Role } from '@/utilities/enums/role'

export function useRole(): Role | null {
  return useSession()?.role ?? null
}
