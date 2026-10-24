// What each role sees: its home page, organisation name and navigation.
import { ROUTES } from '@/constants/routes'
import type { Role } from '@/types/role'

export type NavItem = {
  label: string
  to: string
}

type RoleConfig = {
  homePath: string
  // TODO: comes from the signed-in account once auth exists.
  organisationName: string
  nav: NavItem[]
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  donor: {
    homePath: ROUTES.yourListings,
    organisationName: "Mama's Oven",
    nav: [
      { label: 'Your listings', to: ROUTES.yourListings },
      { label: 'Share food', to: ROUTES.createListing },
    ],
  },
  recipient: {
    homePath: ROUTES.listings,
    organisationName: 'Hope Community Kitchen',
    nav: [
      { label: 'Find food', to: ROUTES.listings },
      { label: 'Your requests', to: ROUTES.yourRequests },
    ],
  },
  admin: {
    homePath: ROUTES.admin,
    organisationName: 'FoodBridge demo admin',
    nav: [
      { label: 'Dashboard', to: ROUTES.admin },
      { label: 'All listings', to: ROUTES.listings },
    ],
  },
}
