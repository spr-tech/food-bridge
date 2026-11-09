import type { BackendRole } from '@/utilities/enums/role'

// Backend API types — based on Esther's latest Swagger contract.

export type BackendLoginResponse = {
  token: string
  id: string
  name: string
  role: BackendRole
  organisationName: string
  email?: string
}

export type BackendMeResponse = {
  id: string
  name: string
  role: BackendRole
  organisationName: string
  email?: string
}
