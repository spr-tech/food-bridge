// The signed-in account's role, from the session, or null when signed out.
import { useSession } from '@/app/session'
import type { Role } from '@/types/role'

export function useRole(): Role | null {
  return useSession()?.role ?? null
}
