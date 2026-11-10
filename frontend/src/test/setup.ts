// Runs before every test file: adds DOM matchers (toHaveAttribute, toBeInTheDocument),
// fills in browser APIs jsdom lacks, sets up translations (English, as in the app), and
// unmounts rendered components after each test.
import i18next from '@/configs/i18nConfig'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { clearSession } from '@/stores/sessionStore'
import { LANGUAGE_STORAGE_KEY } from '@/utilities/helpers/language'

// Radix (the shared Checkbox and Select) measures elements and captures the pointer.
// jsdom has neither, so these stand-ins do nothing, as a browser would in a test.
class ResizeObserverStandIn {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStandIn
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

// jsdom has no media queries. By default nothing matches (a phone-width screen); tests
// that need the desktop layout replace window.matchMedia with one that matches.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

// Each test starts signed out, with the simulated data back at its seed.
// The simulated store is imported here, after the test file's imports, not at the top:
// it loads src/utilities/constants/listingOptions, which picks its units and categories from env
// once. Imported up front it would load before a *.live.test's vi.mock('@/configs/env')
// applies, so live tests would see the simulated units ("loaves") instead of the
// service's ("PORTIONS" shown as "portions").
afterEach(async () => {
  cleanup()
  clearSession()
  sessionStorage.clear()
  // Back to English with nothing saved, so no test leaks French into the next. In this
  // order: switching to English saves 'en', which the removal then clears.
  await i18next.changeLanguage('en')
  localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  const [{ resetMockDb }, { resetSimulateSwitches }] = await Promise.all([
    import('@/mocks/db'),
    import('@/mocks/simulate'),
  ])
  resetMockDb()
  resetSimulateSwitches()
  window.history.replaceState(null, '', '/')
})
