// The signed-in shell for every route except /sign-in: skip link, header, main area.
import { Outlet } from 'react-router'
import { Header } from '@/components/layout/Header'
import { SkipLink } from '@/components/layout/SkipLink'

const MAIN_ID = 'main-content'

export function AppLayout() {
  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <Header />
      {/* tabIndex -1 lets the skip link move focus here in every browser */}
      <main id={MAIN_ID} tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </>
  )
}
