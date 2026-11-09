// Backend API types — based on Esther's latest Swagger contract.

export type BackendErrorResponse = {
  code: string
  message: string
  timestamp: string
}

export type ApiErrorBody = {
  code: string
  message: string
  fields?: Record<string, string>
}
