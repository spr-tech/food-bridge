// The demo accounts shown on the sign-in page (spec S1): one per role, matching the
// service's. The emails are TBC until the service engineers confirm theirs. Every
// organisation is fictional.

// The demo accounts' shared password, also listed in the root README. Choosing an account
// on the sign-in page fills it in, so it ships with the app; that is fine for public demo
// accounts only. It must match the password the service gives its demo accounts.
export const DEMO_PASSWORD = 'FoodBridge-demo-2026'

export type DemoAccount = {
  label: string
  email: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Donor', email: 'donor@foodbridge.test' },
  { label: 'Recipient', email: 'recipient@foodbridge.test' },
  { label: 'Administrator', email: 'admin@foodbridge.test' },
]
