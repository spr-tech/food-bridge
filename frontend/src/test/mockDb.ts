// Changes the simulated store behind a rendered screen, as if time had passed or someone
// else had acted in the meantime. The screen only finds out on its next call, so use these
// after the screen has loaded (the store is saved on first use).
import * as db from '@/mocks/db'

type StoredDb = { listings: { id: string; deadline: string }[] }

// Moves a listing's collection deadline, e.g. into the past to make it expire.
export function moveDeadline(listingId: string, iso: string) {
  const stored = JSON.parse(sessionStorage.getItem(db.MOCK_DB_STORAGE_KEY) ?? '{}') as StoredDb
  const listing = stored.listings.find((item) => item.id === listingId)
  if (!listing) throw new Error(`No stored listing ${listingId}`)
  listing.deadline = iso
  sessionStorage.setItem(db.MOCK_DB_STORAGE_KEY, JSON.stringify(stored))
}
