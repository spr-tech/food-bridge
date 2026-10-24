// Site header: logo, navigation for the signed-in role, organisation name, Sign out.
import { Link, NavLink } from 'react-router'
import logo from '@/assets/logo.svg'
import { ROLE_CONFIG } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils'

export function Header() {
  const { homePath, organisationName, nav } = ROLE_CONFIG[useRole()]

  return (
    <header className="border-b bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link to={homePath} className="flex items-center gap-2 rounded-md">
          <img src={logo} alt="" width={28} height={28} />
          <span className="font-display text-xl font-semibold text-brand-dark">FoodBridge</span>
        </Link>

        <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <ul className="flex flex-wrap justify-center gap-1">
            {nav.map((item) => (
              <li key={item.to}>
                {/* end: only the exact page is marked current, not its sub-pages */}
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-muted hover:text-text',
                      isActive && 'bg-success-bg font-semibold text-primary hover:bg-success-bg',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="font-semibold text-text">{organisationName}</span>
          {/* TODO(auth): sign the user out before leaving. */}
          <Link to={ROUTES.signIn} className="rounded-md text-text-muted hover:text-text hover:underline">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  )
}
