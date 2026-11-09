import type { Role } from '@/utilities/enums/role'

export type Session = {
  token: string
  accountId: string
  role: Role
  organisationName: string
  email: string
}

// The signed-in account as GET /api/auth/me describes it: the session without its token.
export type Account = Omit<Session, 'token'>
