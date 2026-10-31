
// The demo accounts shown on the sign-in page (spec S1).
// Every organisation is fictional.

import { env } from '@/config/env'

// Shared password for simulated demo accounts.
export const DEMO_PASSWORD = 'FoodBridge-demo-2026'

export type DemoAccount = {
  label: string
  email: string
  password?: string
}

// Mock accounts use one shared password.
const MOCK_DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Donor', email: 'donor@foodbridge.test' },
  { label: 'Recipient', email: 'recipient@foodbridge.test' },
  { label: 'Administrator', email: 'admin@foodbridge.test' },
]

// Live accounts seeded in the deployed FoodBridge backend.
const LIVE_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Donor',
    email: 'donor1@demo.foodbridge.invalid',
    password: 'donor123',
  },
  {
    label: 'Recipient',
    email: 'recipient1@demo.foodbridge.invalid',
    password: 'recipient123',
  },
  {
    label: 'Administrator',
    email: 'admin@demo.foodbridge.invalid',
    password: 'admin123',
  },
]

// Select accounts according to the active application mode.
export const DEMO_ACCOUNTS: DemoAccount[] = env.useMocks
  ? MOCK_DEMO_ACCOUNTS
  : LIVE_DEMO_ACCOUNTS
