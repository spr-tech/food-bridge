// The signed-in frame for every route except /sign-in (spec section 12).
// Desktop: permanent dark-green sidebar and top bar.
// Phone: top bar and bottom tab bar.
import { Outlet } from 'react-router'
import { DemoBanner } from '@/components/layouts/DemoBanner'
import { PhoneTopBar } from '@/components/layouts/PhoneTopBar'
import { Sidebar } from '@/components/layouts/Sidebar'
import { SkipLink } from '@/components/layouts/SkipLink'
import { TabBar } from '@/components/layouts/TabBar'
import { TopBar } from '@/components/layouts/TopBar'
import { ROLE_CONFIG } from '@/utilities/constants/roles'
import { useMediaQuery } from '@/utilities/hooks/useMediaQuery'
import { useNavCounts } from '@/utilities/hooks/useNavCounts'
import { useSignOut } from '@/utilities/hooks/useSignOut'
import type { Session } from '@/models/api'

const MAIN_ID = 'main-content'
export const DESKTOP_QUERY = '(min-width: 768px)'

// Rendered by RequireSession, which only does so with a session.
export function AppLayout({ session }: { session: Session }) {
  const { organisationName } = session
  const { roleLabel, nav } = ROLE_CONFIG[session.role]
  const counts = useNavCounts()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const signOut = useSignOut()

  const main = (
    <main id={MAIN_ID} tabIndex={-1} className="fb-main">
      <Outlet />
      <DemoBanner />
    </main>
  )

  if (!isDesktop) {
    return (
      <div className="fb-phone">
        <SkipLink targetId={MAIN_ID} />
        <PhoneTopBar
          organisationName={organisationName}
          roleLabel={roleLabel}
          onSignOut={signOut}
        />
        {main}
        <TabBar items={nav} counts={counts} />
      </div>
    )
  }

  return (
    <div className="fb-app" data-sidebar="dark">
      <SkipLink targetId={MAIN_ID} />
      <Sidebar items={nav} counts={counts} />
      <div className="fb-body">
        <TopBar
          organisationName={organisationName}
          roleLabel={roleLabel}
          onSignOut={signOut}
        />
        {main}
      </div>
    </div>
  )
}