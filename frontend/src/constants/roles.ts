// What each role sees: its home page, organisation name, role label and navigation.
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
  // TODO: comes from the signed-in account once auth exists.
  organisationName: string
  roleLabel: string
  nav: NavItem[]
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  donor: {
    homePath: ROUTES.yourListings,
    organisationName: "Mama's Oven",
    roleLabel: 'Donor',
    nav: [
      { label: 'Your listings', to: ROUTES.yourListings, icon: 'home' },
      { label: 'Share food', to: ROUTES.createListing, icon: 'share' },
      { label: 'Requests', to: ROUTES.requests, icon: 'inbox' },
    ],
  },
  recipient: {
    homePath: ROUTES.listings,
    organisationName: 'Hope Community Kitchen',
    roleLabel: 'Recipient',
    nav: [
      { label: 'Find food', to: ROUTES.listings, icon: 'search' },
      { label: 'Your requests', to: ROUTES.yourRequests, icon: 'requests-list' },
    ],
  },
  // Not designed yet (after Monday): the same frame with its own two links.
  admin: {
    homePath: ROUTES.admin,
    organisationName: 'FoodBridge demo admin',
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
