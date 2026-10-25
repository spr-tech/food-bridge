// Whether the sidebar is dark green (just signed in) or cream (after the first sidebar
// click). Kept in sessionStorage so a refresh stays cream; signing out clears it, so the
// next sign-in starts dark green again. Storage can be blocked (private windows), so
// every access is guarded and the sidebar simply starts dark green.
import { useCallback, useState } from 'react'

export type SidebarTheme = 'dark' | 'cream'

export const SIDEBAR_STORAGE_KEY = 'foodbridge.sidebar'

function readSidebarTheme(): SidebarTheme {
  try {
    return sessionStorage.getItem(SIDEBAR_STORAGE_KEY) === 'cream' ? 'cream' : 'dark'
  } catch {
    return 'dark'
  }
}

export function resetSidebarTheme() {
  try {
    sessionStorage.removeItem(SIDEBAR_STORAGE_KEY)
  } catch {
    // Nothing stored, nothing to clear.
  }
}

export function useSidebarTheme() {
  const [theme, setTheme] = useState<SidebarTheme>(readSidebarTheme)

  const turnCream = useCallback(() => {
    setTheme('cream')
    try {
      sessionStorage.setItem(SIDEBAR_STORAGE_KEY, 'cream')
    } catch {
      // Stays cream until the page reloads.
    }
  }, [])

  return { theme, turnCream }
}
