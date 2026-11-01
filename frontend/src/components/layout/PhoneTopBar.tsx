// The mobile top bar: permanent dark-green background,
// FoodBridge logo and account menu.
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
      <Logo variant="sidebar" />
      <AccountMenu {...props} />
    </header>
  )
}