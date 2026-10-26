// The demo accounts (spec S1). Desktop: a box listing each role and email. Phone: chips
// that fill in the email when tapped, so the page fits one screen.
import { DEMO_ACCOUNTS } from '@/constants/demoAccounts'

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="shrink-0">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </svg>
  )
}

export function DemoAccountsBox() {
  return (
    <section aria-labelledby="demo-accounts" className="mt-6 rounded-2xl border border-border bg-surface px-5 py-4.5">
      <h2 id="demo-accounts" className="font-sans text-[15px] font-bold">
        Demo accounts
      </h2>
      <p className="mt-0.5 mb-2 text-[13px] text-text-muted">
        Use these accounts to explore the app. Password in the README.
      </p>
      <ul>
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email} className="flex items-center gap-3 py-2">
            <PersonIcon />
            <div>
              <div className="text-sm font-semibold">{account.label}</div>
              <div className="text-[13px] text-text-muted">{account.email}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function DemoAccountChips({ onPick }: { onPick: (email: string) => void }) {
  return (
    <section aria-labelledby="demo-chips" className="mt-5">
      <h2 id="demo-chips" className="mb-1 font-sans text-[13px] font-bold text-text-secondary">
        Try a demo account
      </h2>
      <p className="mb-2.5 text-[12.5px] text-text-muted">Tap one to fill in the email. Password in the README.</p>
      <ul className="flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              onClick={() => onPick(account.email)}
              className="rounded-full border border-border-input bg-surface px-3 py-2 text-[13px] font-semibold whitespace-nowrap text-primary hover:bg-status-available-bg"
            >
              {account.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
