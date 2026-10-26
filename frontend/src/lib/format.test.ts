// Dates are shown in Lagos time. Tests run in New York time (see vite.config.ts),
// so these fail if formatting ever falls back to the device's zone.
import { describe, expect, it } from 'vitest'
import {
  formatDateTime,
  formatDay,
  formatListingQuantity,
  formatPickup,
  formatRequested,
  formatUpdated,
  initials,
} from '@/lib/format'

// 2:00 PM in Lagos (UTC+1), 9:00 AM in New York.
const NOW = new Date('2026-10-24T13:00:00Z')

describe('formatDateTime', () => {
  it('formats a time later today as "Today, 7:00 PM" in Lagos time', () => {
    expect(formatDateTime('2026-10-24T18:00:00Z', NOW)).toBe('Today, 7:00 PM')
  })

  it('moves past Lagos midnight to "Tomorrow"', () => {
    expect(formatDateTime('2026-10-24T23:30:00Z', NOW)).toBe('Tomorrow, 12:30 AM')
  })
})

describe('initials', () => {
  it.each([
    ["Mama's Oven", 'MO'],
    ['Hope Community Kitchen', 'HC'],
    ['ajegunle food bank', 'AF'],
    ['  Grace   Shelter ', 'GS'],
    ['Tejuosho', 'T'],
    ['', ''],
  ])('gives "%s" the initials "%s"', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})

describe('formatPickup', () => {
  // 10:00 AM in Lagos.
  const now = new Date('2026-10-26T09:00:00Z')

  it.each([
    ['2026-10-26T18:00:00Z', 'Pickup by 7:00 PM'],
    ['2026-10-27T09:00:00Z', 'Pickup by tomorrow, 10:00 AM'],
    ['2026-10-25T16:00:00Z', 'Pickup by yesterday, 5:00 PM'],
    ['2026-10-29T18:00:00Z', 'Pickup by Thu 29 Oct, 7:00 PM'],
  ])('shows %s as "%s"', (iso, expected) => {
    expect(formatPickup(iso, now)).toBe(expected)
  })
})

describe('formatUpdated', () => {
  const now = Date.parse('2026-10-26T18:30:00Z')

  it.each([
    [now - 20_000, 'Updated just now'],
    [now - 60_000, 'Updated 1 minute ago'],
    [now - 12 * 60_000, 'Updated 12 minutes ago'],
    [Date.parse('2026-10-26T16:00:00Z'), 'Updated at 5:00 PM'],
  ])('shows %i as "%s"', (timestamp, expected) => {
    expect(formatUpdated(timestamp, now)).toBe(expected)
  })
})

describe('formatDay', () => {
  it.each([
    ['2026-10-24T18:00:00Z', 'Today'],
    ['2026-10-25T09:00:00Z', 'Tomorrow'],
    ['2026-10-23T09:00:00Z', 'Yesterday'],
    ['2026-10-29T09:00:00Z', 'Thu 29 Oct'],
  ])('gives %s as "%s" in Lagos', (iso, expected) => {
    expect(formatDay(iso, NOW)).toBe(expected)
  })
})

describe('formatRequested', () => {
  it('says when a request was made: "Requested Today, 1:10 PM"', () => {
    expect(formatRequested('2026-10-24T12:10:00Z', NOW)).toBe('Requested Today, 1:10 PM')
  })
})

describe('formatListingQuantity', () => {
  it.each([
    [{ quantity: 40, unit: 'loaves' }, '40 loaves'],
    [{ quantity: 1, unit: 'loaves' }, '1 loaf'],
    [{ quantity: 1200, unit: 'pieces' }, '1,200 pieces'],
    [{ quantity: 3, unit: 'crates' }, '3 crates'],
  ])('gives %o as "%s"', (listing, expected) => {
    expect(formatListingQuantity(listing)).toBe(expected)
  })
})
