// What each role sees: its home page, role label and navigation. The organisation name
// comes from the signed-in session.
import type { NavIconName } from '@/components/layout/NavIcons'
import { ROUTES } from '@/constants/routes'
import type { Role } from '@/types/role'

export type NavItem = {
  label: string
  to: string
  icon: NavIconName
}

type RoleConfig = {
  homePath: string
  roleLabel: string
  nav: NavItem[]
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  donor: {
    homePath: ROUTES.yourListings,
    roleLabel: 'Donor',
    nav: [
      { label: 'Your listings', to: ROUTES.yourListings, icon: 'home' },
      { label: 'Share food', to: ROUTES.createListing, icon: 'share' },
      { label: 'Requests', to: ROUTES.requests, icon: 'inbox' },
    ],
  },
  recipient: {
    homePath: ROUTES.listings,
    roleLabel: 'Recipient',
    nav: [
      { label: 'Find food', to: ROUTES.listings, icon: 'search' },
      { label: 'Your requests', to: ROUTES.yourRequests, icon: 'requests-list' },
    ],
  },
  // Not designed yet (after Monday): the same frame with its own two links.
  admin: {
    homePath: ROUTES.admin,
    roleLabel: 'Administrator',
    nav: [
      { label: 'Dashboard', to: ROUTES.admin, icon: 'home' },
      { label: 'All listings', to: ROUTES.listings, icon: 'search' },
    ],
  },
}

// The links shown disabled under "Coming soon" for every role.
export const COMING_SOON: { label: string; icon: NavIconName }[] = [
  { label: 'Collections', icon: 'calendar' },
  { label: 'Impact', icon: 'impact' },
]

// Where "home" is: the role's home page, or sign in when signed out.
export function homePathFor(role: Role | null): string {
  return role ? ROLE_CONFIG[role].homePath : ROUTES.signIn
}
