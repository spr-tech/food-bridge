// The demo accounts shown on the sign-in page (spec S1): one per role, matching the
// service's. The emails are TBC until the service engineers confirm theirs. The password
// is in the root README. Every organisation is fictional.
export type DemoAccount = {
  label: string
  email: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Donor', email: 'donor@foodbridge.test' },
  { label: 'Recipient', email: 'recipient@foodbridge.test' },
  { label: 'Administrator', email: 'admin@foodbridge.test' },
]
