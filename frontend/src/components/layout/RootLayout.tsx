// Wraps every route, including /sign-in: navigation progress, the demo banner,
// and the one toast container for the whole app.
import { Outlet } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { NavProgress } from '@/components/layout/NavProgress'

export function RootLayout() {
  return (
    <>
      <NavProgress />
      <DemoBanner />
      <Outlet />
      <Toaster />
    </>
  )
}
