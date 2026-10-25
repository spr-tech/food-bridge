// Runs before every test file: adds DOM matchers (toHaveAttribute, toBeInTheDocument),
// fills in browser APIs jsdom lacks, and unmounts rendered components after each test.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

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

afterEach(() => {
  cleanup()
})
