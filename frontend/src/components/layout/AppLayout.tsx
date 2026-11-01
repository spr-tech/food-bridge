// The signed-in frame for every route except /sign-in (spec section 12).
// Desktop: permanent dark-green sidebar and top bar.
// Phone: top bar and bottom tab bar.
import { Outlet } from 'react-router'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { PhoneTopBar } from '@/components/layout/PhoneTopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { SkipLink } from '@/components/layout/SkipLink'
import { TabBar } from '@/components/layout/TabBar'
import { TopBar } from '@/components/layout/TopBar'
import { ROLE_CONFIG } from '@/constants/roles'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useNavCounts } from '@/hooks/useNavCounts'
import { useSignOut } from '@/hooks/useSignOut'
import type { Session } from '@/types/api'

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