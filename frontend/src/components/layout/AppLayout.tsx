// The signed-in frame for every route except /sign-in (spec section 12).
// Desktop (768px and up): sidebar, top bar and the sidebar flood. Phone: cream top bar
// with the account menu and a bottom tab bar. Only one of the two is ever rendered, so
// there is always exactly one main navigation.
import { useEffect, useState } from 'react'
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
import { useRole } from '@/hooks/useRole'
import { useSidebarTheme } from '@/hooks/useSidebarTheme'
import { useSignOut } from '@/hooks/useSignOut'

const MAIN_ID = 'main-content'
export const DESKTOP_QUERY = '(min-width: 768px)'

// The flood's last step (the green line fading) ends at 2.25s + 0.3s.
const FLOOD_MS = 2600

export function AppLayout() {
  const { organisationName, roleLabel, nav } = ROLE_CONFIG[useRole()]
  const counts = useNavCounts()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const signOut = useSignOut()
  const { theme, turnCream } = useSidebarTheme()
  const [flooding, setFlooding] = useState(false)

  // The first sidebar click of the session plays the flood; later clicks do nothing here.
  function handleSidebarLinkClick() {
    if (theme === 'cream') return
    setFlooding(true)
    turnCream()
  }

  // After the flood, drop its timed transitions so hovers respond straight away.
  useEffect(() => {
    if (!flooding) return
    const timer = window.setTimeout(() => setFlooding(false), FLOOD_MS)
    return () => window.clearTimeout(timer)
  }, [flooding])

  const main = (
    // tabIndex -1 lets the skip link move focus here in every browser
    <main id={MAIN_ID} tabIndex={-1} className="fb-main">
      <Outlet />
      <DemoBanner />
    </main>
  )

  if (!isDesktop) {
    return (
      <div className="fb-phone">
        <SkipLink targetId={MAIN_ID} />
        <PhoneTopBar organisationName={organisationName} roleLabel={roleLabel} onSignOut={signOut} />
        {main}
        <TabBar items={nav} counts={counts} />
      </div>
    )
  }

  return (
    <div className="fb-app" data-sidebar={flooding ? 'flooding' : theme}>
      <SkipLink targetId={MAIN_ID} />
      <div className="fb-stream" aria-hidden="true" />
      <Sidebar items={nav} counts={counts} onLinkClick={handleSidebarLinkClick} />
      <div className="fb-body">
        <TopBar organisationName={organisationName} roleLabel={roleLabel} onSignOut={signOut} />
        {main}
      </div>
    </div>
  )
}
