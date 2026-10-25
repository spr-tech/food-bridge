// The phone top bar (below 768px): cream, with the logo and the account menu.
import { AccountMenu } from '@/components/layout/AccountMenu'
import { Logo } from '@/components/layout/Logo'

type PhoneTopBarProps = {
  organisationName: string
  roleLabel: string
  onSignOut: () => void
}

export function PhoneTopBar(props: PhoneTopBarProps) {
  return (
    <header className="fb-ptop">
      <Logo variant="cream" />
      <AccountMenu {...props} />
    </header>
  )
}
