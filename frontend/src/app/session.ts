// The signed-in session (token, account, role, organisation), kept in sessionStorage so a
// refresh stays signed in and closing the tab signs out. Signing out clears only this,
// not the simulated data. Storage can be blocked, so every access is guarded.
// The token stays in sessionStorage until the auth approach is agreed (docs/decisions.md).
import { useSyncExternalStore } from 'react'
import type { Session } from '@/types/api'

export const SESSION_STORAGE_KEY = 'foodbridge.session'

const listeners = new Set<() => void>()

// useSyncExternalStore needs the same object back while nothing has changed.
let cachedRaw: string | null = null
let cachedSession: Session | null = null

// Set when the user signs out on purpose, until the next sign-in. The page being left
// can still render once without a session; this tells RequireSession not to add ?next=.
let signedOut = false

function readRaw(): string | null {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return null
  }
}

export function getSession(): Session | null {
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    try {
      cachedSession = raw ? (JSON.parse(raw) as Session) : null
    } catch {
      cachedSession = null
    }
  }
  return cachedSession
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function saveSession(session: Session) {
  signedOut = false
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Signed in for this page only; a refresh will ask again.
  }
  notify()
}

function endSession(onPurpose: boolean) {
  signedOut = onPurpose
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Nothing stored, nothing to clear.
  }
  notify()
}

// The session ended without the user choosing to (a 401): ?next= still brings them back.
export function clearSession() {
  endSession(false)
}

// The user signed out.
export function signOutSession() {
  endSession(true)
}

export function wasSignedOut(): boolean {
  return signedOut
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession)
}
