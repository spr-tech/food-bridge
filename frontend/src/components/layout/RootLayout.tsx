// Wraps every route, including /sign-in: navigation progress and the shared
// ToastProvider, so useToast() works on every page. The demonstration line sits under
// each page's content (AppLayout, and the sign-in page itself).
import { Outlet } from 'react-router'
import { ToastProvider } from '@/components/ui/toast'
import { NavProgress } from '@/components/layout/NavProgress'

export function RootLayout() {
  return (
    <ToastProvider>
      <NavProgress />
      <Outlet />
    </ToastProvider>
  )
}
