// TEMPORARY until auth exists: the signed-in role comes from this one constant.
// Change it to see the app as a donor, recipient or admin. Delete it once sign in works.
import type { Role } from '@/types/role'

export const DEV_ROLE: Role = 'donor'
