// Translation setup (i18next): English, French and Spanish, all bundled up front from
// src/locales/<lang>/<namespace>.json, so nothing loads over the network. Imported once at
// the top of main.tsx and in the test setup; components get text with useTranslation().
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import enAdmin from '@/locales/en/admin.json'
import enAuth from '@/locales/en/auth.json'
import enCommon from '@/locales/en/common.json'
import enLanding from '@/locales/en/landing.json'
import enListings from '@/locales/en/listings.json'
import enRequests from '@/locales/en/requests.json'
import enValidation from '@/locales/en/validation.json'
import esAdmin from '@/locales/es/admin.json'
import esAuth from '@/locales/es/auth.json'
import esCommon from '@/locales/es/common.json'
import esLanding from '@/locales/es/landing.json'
import esListings from '@/locales/es/listings.json'
import esRequests from '@/locales/es/requests.json'
import esValidation from '@/locales/es/validation.json'
import frAdmin from '@/locales/fr/admin.json'
import frAuth from '@/locales/fr/auth.json'
import frCommon from '@/locales/fr/common.json'
import frLanding from '@/locales/fr/landing.json'
import frListings from '@/locales/fr/listings.json'
import frRequests from '@/locales/fr/requests.json'
import frValidation from '@/locales/fr/validation.json'

export const defaultNS = 'common'

// English is the source: i18next.d.ts types every key from it.
export const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    auth: enAuth,
    listings: enListings,
    requests: enRequests,
    admin: enAdmin,
    validation: enValidation,
  },
  fr: {
    common: frCommon,
    landing: frLanding,
    auth: frAuth,
    listings: frListings,
    requests: frRequests,
    admin: frAdmin,
    validation: frValidation,
  },
  es: {
    common: esCommon,
    landing: esLanding,
    auth: esAuth,
    listings: esListings,
    requests: esRequests,
    admin: esAdmin,
    validation: esValidation,
  },
} as const

// Screen readers pick their pronunciation from <html lang>. Registered before init, so the
// languageChanged that init fires sets it at start-up as well.
i18next.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

void i18next.use(initReactI18next).init({
  resources,
  // Choosing a language comes later; until then everyone sees English.
  lng: 'en',
  // Required since v27 (the default became false): a key missing in French or Spanish
  // shows the English text instead of the key itself.
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr', 'es'],
  ns: Object.keys(resources.en),
  defaultNS,
  // React escapes text itself; escaping here too would show "&amp;".
  interpolation: { escapeValue: false },
  // The resources are already in memory, so finish init now: t() works on the first render
  // and useTranslation never suspends.
  initAsync: false,
})

export default i18next
