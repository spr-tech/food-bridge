// The demo accounts shown on the sign-in page (spec S1). Their password is in the root
// README. Every organisation is fictional.
export type DemoAccount = {
  label: string
  email: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Donor', email: 'donor@foodbridge.test' },
  { label: 'Recipient', email: 'recipient@foodbridge.test' },
  { label: 'Recipient 2', email: 'recipient2@foodbridge.test' },
  { label: 'Recipient 3', email: 'recipient3@foodbridge.test' },
  { label: 'Administrator', email: 'admin@foodbridge.test' },
]
