// The desktop top bar: the account on the right (avatar, organisation, role) and Sign out.
// White before the flood; its cream layer flows in from the left during it.
import { SignOutIcon } from '@/components/layout/NavIcons'
import { initials } from '@/lib/format'

type TopBarProps = {
  organisationName: string
  roleLabel: string
  onSignOut: () => void
}

export function TopBar({ organisationName, roleLabel, onSignOut }: TopBarProps) {
  return (
    <header className="fb-top">
      <div className="fb-flow" aria-hidden="true" />
      <span className="fb-avatar" aria-hidden="true">
        {initials(organisationName)}
      </span>
      <div>
        <div className="fb-account__name">{organisationName}</div>
        <div className="fb-account__role">{roleLabel}</div>
      </div>
      <span className="fb-divider" aria-hidden="true" />
      <button type="button" className="fb-signout" onClick={onSignOut}>
        <SignOutIcon />
        Sign out
      </button>
    </header>
  )
}
