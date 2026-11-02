// The demo accounts (spec S1) in three equal columns side by side: Admin | Donor | Recipient.
// Each column holds a button per account, showing only its name. Choosing one fills in
// the email and password; the form then moves focus to Sign in, so the user still signs
// in themselves. On short windows the box is more compact.
import { DEMO_ACCOUNT_GROUPS, type DemoAccount } from '@/constants/demoAccounts'

type DemoAccountsProps = {
  onPick: (account: DemoAccount) => void
}

export function DemoAccountsBox({ onPick }: DemoAccountsProps) {
  return (
    <section
      aria-labelledby='demo-accounts'
      className='mt-5 rounded-2xl border border-border bg-surface px-4 py-4 lg:mt-6 lg:px-5 lg:py-4.5 short:mt-4 short:py-3'
    >
      <h2 id='demo-accounts' className='font-sans text-[15px] font-bold'>
        Demo accounts
      </h2>
      <p className='mt-0.5 text-[13px] text-text-muted'>Choose an account to fill in the email and password.</p>
      <div className='mt-3 flex short:mt-2'>
        {DEMO_ACCOUNT_GROUPS.map((group) => {
          const headingId = `demo-${group.role.toLowerCase()}`
          return (
            <section
              key={group.role}
              aria-labelledby={headingId}
              className='min-w-0 flex-1 basis-0 border-l border-border px-2 first:border-l-0 first:pl-0 last:pr-0 sm:px-3'
            >
              <h3 id={headingId} className='font-sans text-[12.5px] font-bold tracking-wide text-text-secondary uppercase'>
                {group.role}
              </h3>
              <ul className='mt-2 flex flex-col gap-1.5 short:mt-1.5'>
                {group.accounts.map((account) => (
                  <li key={account.email}>
                    <button
                      type='button'
                      onClick={() => onPick(account)}
                      className='w-full cursor-pointer rounded-md border border-border-input bg-surface px-2 py-1.5 text-left text-[13px] font-semibold text-primary hover:bg-status-available-bg short:py-1'
                    >
                      {account.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </section>
  )
}
