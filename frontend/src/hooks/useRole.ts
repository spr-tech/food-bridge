// The signed-in user's role. Reads the temporary DEV_ROLE until auth exists;
// components call this hook so only this file changes when it does.
import { DEV_ROLE } from '@/app/devRole'
import type { Role } from '@/types/role'

export function useRole(): Role {
  return DEV_ROLE
}
