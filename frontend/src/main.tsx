// App entry point: sets up translations, loads global styles and renders the providers
// into #root. The translation setup comes first so text is ready before anything renders.
import '@/configs/i18nConfig'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { Providers } from '@/app/providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
)
