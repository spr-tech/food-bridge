// The demo accounts shown on the sign-in page (spec S1), grouped Admin | Donor | Recipient.
// Every organisation is fictional.

import { env } from '@/configs/env'

// Shared password for simulated demo accounts.
export const DEMO_PASSWORD = 'FoodBridge-demo-2026'

export type DemoAccount = {
  label: string
  email: string
  password: string
}

export type DemoAccountGroup = {
  role: 'Admin' | 'Donor' | 'Recipient'
  password: string
  accounts: DemoAccount[]
}

function group(role: DemoAccountGroup['role'], password: string, accounts: Omit<DemoAccount, 'password'>[]): DemoAccountGroup {
  return { role, password, accounts: accounts.map((account) => ({ ...account, password })) }
}

// Mock accounts use one shared password.
const MOCK_DEMO_ACCOUNT_GROUPS: DemoAccountGroup[] = [
  group('Admin', DEMO_PASSWORD, [{ label: 'Administrator', email: 'admin@foodbridge.test' }]),
  group('Donor', DEMO_PASSWORD, [{ label: 'Donor', email: 'donor@foodbridge.test' }]),
  group('Recipient', DEMO_PASSWORD, [{ label: 'Recipient', email: 'recipient@foodbridge.test' }]),
]

// Live accounts seeded in the deployed FoodBridge backend.
const LIVE_DEMO_ACCOUNT_GROUPS: DemoAccountGroup[] = [
  group('Admin', 'admin123', [{ label: 'Admin', email: 'admin@demo.foodbridge.invalid' }]),
  group('Donor', 'donor123', [
    { label: 'Donor 1', email: 'donor1@demo.foodbridge.invalid' },
    { label: 'Donor 2', email: 'donor2@demo.foodbridge.invalid' },
  ]),
  group('Recipient', 'recipient123', [
    { label: 'Recipient 1', email: 'recipient1@demo.foodbridge.invalid' },
    { label: 'Recipient 2', email: 'recipient2@demo.foodbridge.invalid' },
    { label: 'Recipient 3', email: 'recipient3@demo.foodbridge.invalid' },
  ]),
]

// Select accounts according to the active application mode.
export const DEMO_ACCOUNT_GROUPS: DemoAccountGroup[] = env.useMocks
  ? MOCK_DEMO_ACCOUNT_GROUPS
  : LIVE_DEMO_ACCOUNT_GROUPS
