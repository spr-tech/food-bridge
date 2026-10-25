// Runs before every test file: adds DOM matchers (toHaveAttribute, toBeInTheDocument),
// fills in browser APIs jsdom lacks, and unmounts rendered components after each test.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { resetMockDb } from '@/mocks/db'

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
afterEach(() => {
  cleanup()
  sessionStorage.clear()
  resetMockDb()
  window.history.replaceState(null, '', '/')
})
