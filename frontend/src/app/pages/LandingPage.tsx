import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { LandingClosing } from '@/components/content/landing/LandingClosing'
import { LandingHero } from '@/components/content/landing/LandingHero'
import { LandingMiddle } from '@/components/content/landing/LandingMiddle'
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