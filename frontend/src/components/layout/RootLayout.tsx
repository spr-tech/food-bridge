// Wraps every route, including /sign-in: navigation progress, the demo banner, and
// the shared ToastProvider, so useToast() works on every page.
import { Outlet } from 'react-router'
import { ToastProvider } from '@/components/ui/toast'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { NavProgress } from '@/components/layout/NavProgress'

export function RootLayout() {
  return (
    <ToastProvider>
      <NavProgress />
      <DemoBanner />
      <Outlet />
    </ToastProvider>
  )
}
