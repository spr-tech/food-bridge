// What each role sees: its home page, role label and navigation. The organisation name
// comes from the signed-in session. Nav labels are translation keys in
// src/locales/<lang>/common.json; the sidebar and tab bar turn them into text with t().
import type { ParseKeys } from 'i18next'
import { matchPath } from 'react-router'
import type { NavIconName } from '@/components/layouts/NavIcons'
import { ROUTES } from '@/utilities/constants/routes'
import type { Role } from '@/utilities/enums/role'

export type NavItem = {
  labelKey: ParseKeys<'common'>
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
        labelKey: 'nav.yourListings',
        to: ROUTES.yourListings,
        icon: 'home',
        includes: [ROUTES.listingDetail, ROUTES.editListing],
      },
      { labelKey: 'nav.shareFood', to: ROUTES.createListing, icon: 'share' },
      { labelKey: 'nav.requests', to: ROUTES.requests, icon: 'inbox' },
    ],
  },
  recipient: {
    homePath: ROUTES.listings,
    roleLabel: 'Recipient',
    nav: [
      { labelKey: 'nav.findFood', to: ROUTES.listings, icon: 'search', includes: [ROUTES.listingDetail] },
      { labelKey: 'nav.yourRequests', to: ROUTES.yourRequests, icon: 'requests-list' },
    ],
  },
  admin: {
    homePath: ROUTES.admin,
    roleLabel: 'Administrator',
    nav: [
      { labelKey: 'nav.dashboard', to: ROUTES.admin, icon: 'home', includes: [ROUTES.adminRequests] },
      { labelKey: 'nav.allListings', to: ROUTES.listings, icon: 'search', includes: [ROUTES.listingDetail] },
      { labelKey: 'nav.handovers', to: ROUTES.completedHandovers, icon: 'handover' },
    ],
  },
}

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
