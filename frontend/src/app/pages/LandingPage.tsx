import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/utilities/hooks/useDocumentTitle'
import { LandingClosing } from '@/components/content/landing/LandingClosing'
import { LandingHero } from '@/components/content/landing/LandingHero'
import { LandingMiddle } from '@/components/content/landing/LandingMiddle'
import '@/styles/landing.css'

export function LandingPage() {
  const { t } = useTranslation('landing')
  useDocumentTitle(t('title'))
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
