// What each role sees: its home page, role label and navigation. The organisation name
// comes from the signed-in session.
import { matchPath } from 'react-router'
import type { NavIconName } from '@/components/layout/NavIcons'
import { ROUTES } from '@/constants/routes'
import type { Role } from '@/types/role'

export type NavItem = {
  label: string
  to: string
  icon: NavIconName
  // Pages under this link that have no link of their own, e.g. a listing opened from it.
  // It stays highlighted there, so the highlight follows the address alone (refresh,
  // Back and Forward included).
  includes?: string[]
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
      {
        label: 'Your listings',
        to: ROUTES.yourListings,
        icon: 'home',
        includes: [ROUTES.listingDetail, ROUTES.editListing],
      },
      { label: 'Share food', to: ROUTES.createListing, icon: 'share' },
      { label: 'Requests', to: ROUTES.requests, icon: 'inbox' },
    ],
  },
  recipient: {
    homePath: ROUTES.listings,
    roleLabel: 'Recipient',
    nav: [
      { label: 'Find food', to: ROUTES.listings, icon: 'search', includes: [ROUTES.listingDetail] },
      { label: 'Your requests', to: ROUTES.yourRequests, icon: 'requests-list' },
    ],
  },
  // Not designed yet (after Monday): the same frame with its own two links.
  admin: {
    homePath: ROUTES.admin,
    roleLabel: 'Administrator',
    nav: [
      { label: 'Dashboard', to: ROUTES.admin, icon: 'home' },
      { label: 'All listings', to: ROUTES.listings, icon: 'search', includes: [ROUTES.listingDetail] },
    ],
  },
}

// The links shown disabled under "Coming soon" for every role.
export const COMING_SOON: { label: string; icon: NavIconName }[] = [
  { label: 'Collections', icon: 'calendar' },
  { label: 'Impact', icon: 'impact' },
]

// The link to highlight at pathname: one whose own page it is wins, so /listings/new stays
// Share food rather than a listing; otherwise the first that includes it. None for pages
// outside the menu.
export function activeNavItem(items: NavItem[], pathname: string): NavItem | undefined {
  return (
    items.find((item) => matchPath({ path: item.to, end: true }, pathname)) ??
    items.find((item) => item.includes?.some((path) => matchPath({ path, end: true }, pathname)))
  )
}

// Where "home" is: the role's home page, or sign in when signed out.
export function homePathFor(role: Role | null): string {
  return role ? ROLE_CONFIG[role].homePath : ROUTES.signIn
}
