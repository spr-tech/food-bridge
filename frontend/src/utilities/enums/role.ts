// The three roles an account can have. The service decides what each may do.
export type Role = 'donor' | 'recipient' | 'admin'

// Backend API types — based on Esther's latest Swagger contract.

export type BackendRole = 'DONOR' | 'RECIPIENT' | 'ADMIN'
