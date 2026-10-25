// Dates are shown in Lagos time. Tests run in New York time (see vite.config.ts),
// so these fail if formatting ever falls back to the device's zone.
import { describe, expect, it } from 'vitest'
import { formatDateTime, initials } from '@/lib/format'

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
