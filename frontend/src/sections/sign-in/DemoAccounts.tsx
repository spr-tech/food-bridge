// The demo accounts (spec S1). Desktop: a box with a button per account (icon, role and
// email). Phone: chips, so the page fits one screen. Choosing either fills in the email
// and the demo password; the form then moves focus to Sign in.
import { DEMO_ACCOUNTS, type DemoAccount } from '@/constants/demoAccounts'

type DemoAccountsProps = {
  onPick: (account: DemoAccount) => void
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="shrink-0">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </svg>
  )
}

export function DemoAccountsBox({ onPick }: DemoAccountsProps) {
  return (
    <section aria-labelledby="demo-accounts" className="mt-6 rounded-2xl border border-border bg-surface px-5 py-4.5">
      <h2 id="demo-accounts" className="font-sans text-[15px] font-bold">
        Demo accounts
      </h2>
      <p className="mt-0.5 mb-2 text-[13px] text-text-muted">
        Use these accounts to explore the app. Choose one to fill in the email and password. Password in the README.
      </p>
      <ul>
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            {/* -mx-2 px-2: the hover background reaches past the text, which stays aligned. */}
            <button
              type="button"
              onClick={() => onPick(account)}
              className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-hover"
            >
              <PersonIcon />
              <span>
                <span className="block text-sm font-semibold">{account.label}</span>
                {/* Read as "Donor, donor@foodbridge.test". */}
                <span className="sr-only">,</span>{' '}
                <span className="block text-[13px] text-text-muted">{account.email}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function DemoAccountChips({ onPick }: DemoAccountsProps) {
  return (
    <section aria-labelledby="demo-chips" className="mt-5">
      <h2 id="demo-chips" className="mb-1 font-sans text-[13px] font-bold text-text-secondary">
        Try a demo account
      </h2>
      <p className="mb-2.5 text-[12.5px] text-text-muted">Tap one to fill in the email and password. Password in the README.</p>
      <ul className="flex flex-wrap gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              onClick={() => onPick(account)}
              className="rounded-full border border-border-input bg-surface px-3 py-2 text-[13px] font-semibold whitespace-nowrap text-primary hover:bg-status-available-bg hover:cursor-pointer"
            >
              {account.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
