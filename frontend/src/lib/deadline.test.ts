// Date and time combine into one Lagos-time deadline. Tests run in New York time (see
// vite.config.ts), so these fail if the device's zone leaks in.
import { describe, expect, it } from 'vitest'
import { combineDeadline, isLaterThanNow, lagosToday } from '@/lib/deadline'

describe('combineDeadline', () => {
  it('joins a date and a time as Lagos time', () => {
    expect(combineDeadline('2026-10-26', '19:00')).toBe('2026-10-26T19:00:00+01:00')
  })

  it('is 6:00 PM UTC for 7:00 PM in Lagos', () => {
    expect(new Date(combineDeadline('2026-10-26', '19:00') ?? '').toISOString()).toBe('2026-10-26T18:00:00.000Z')
  })

  it.each([
    ['', '19:00'],
    ['2026-10-26', ''],
    ['26/10/2026', '19:00'],
    ['2026-13-40', '19:00'],
  ])('gives null for date "%s" and time "%s"', (date, time) => {
    expect(combineDeadline(date, time)).toBeNull()
  })
})

describe('isLaterThanNow', () => {
  const now = new Date('2026-10-26T12:00:00Z')

  it('accepts a deadline after now and refuses one at or before it', () => {
    expect(isLaterThanNow('2026-10-26T13:01:00+01:00', now)).toBe(true)
    expect(isLaterThanNow('2026-10-26T13:00:00+01:00', now)).toBe(false)
    expect(isLaterThanNow('2026-10-26T12:00:00+01:00', now)).toBe(false)
  })
})

describe('lagosToday', () => {
  it("is already tomorrow in Lagos at 11:30 PM UTC", () => {
    expect(lagosToday(new Date('2026-10-26T23:30:00Z'))).toBe('2026-10-27')
  })

  it('is the same day in Lagos at 10:00 PM UTC', () => {
    expect(lagosToday(new Date('2026-10-26T22:00:00Z'))).toBe('2026-10-26')
  })
})
