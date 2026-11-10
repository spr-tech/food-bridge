// The chosen language, remembered in localStorage. Unlike the session (sessionStorage,
// gone with the tab), a language preference should outlast the tab and the visit.
// Storage can be blocked, so every access is guarded: reading falls back to English and a
// failed save carries on quietly (the language still changes for this page).
import { LANGUAGES, type Language } from '@/utilities/constants/languages'

export const LANGUAGE_STORAGE_KEY = 'foodbridge.language'

const DEFAULT_LANGUAGE: Language = 'en'

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.code === value)
}

// The saved language, or English when nothing valid is saved or storage is blocked.
export function readSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function saveLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Not remembered; the next visit starts in English.
  }
}
