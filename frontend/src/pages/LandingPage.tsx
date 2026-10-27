import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { LandingClosing } from '@/sections/landing/LandingClosing'
import { LandingHero } from '@/sections/landing/LandingHero'
import { LandingMiddle } from '@/sections/landing/LandingMiddle'
import '@/styles/landing.css'

export function LandingPage() {
  useDocumentTitle('Good food deserves another table')
  return (
    <div className='bg-surface font-sans text-ink'>
      <LandingHero />
      <main id='main'>
        <LandingMiddle />
      </main>
      <LandingClosing />
    </div>
  )
}