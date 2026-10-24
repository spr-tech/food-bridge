// Display formatting for dates and quantities. Times are always shown in Lagos
// time, so everyone sees the same "Collect by" time whatever their device's zone.
import type { UnitOption } from '@/constants/listingOptions'

const TIME_ZONE = 'Africa/Lagos'
const DAY_MS = 24 * 60 * 60 * 1000

const timeParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const dateParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

// en-CA gives YYYY-MM-DD, which compares and parses cleanly.
const dayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((p) => p.type === type)?.value ?? ''
}

// "7:00 PM". Built from parts because ICU puts a narrow no-break space before PM.
export function formatTime(date: Date): string {
  const parts = timeParts.formatToParts(date)
  return `${part(parts, 'hour')}:${part(parts, 'minute')} ${part(parts, 'dayPeriod').toUpperCase()}`
}

// Whole calendar days from `now` to `date`, counted in Lagos.
function daysFrom(now: Date, date: Date): number {
  return Math.round((Date.parse(dayKey.format(date)) - Date.parse(dayKey.format(now))) / DAY_MS)
}

// "Today, 7:00 PM", "Tomorrow, 10:00 AM", "Yesterday, 2:10 PM" or "Mon 26 Oct, 7:00 PM".
export function formatDateTime(value: Date | string, now: Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const time = formatTime(date)
  const days = daysFrom(now, date)

  if (days === 0) return `Today, ${time}`
  if (days === 1) return `Tomorrow, ${time}`
  if (days === -1) return `Yesterday, ${time}`

  const parts = dateParts.formatToParts(date)
  return `${part(parts, 'weekday')} ${part(parts, 'day')} ${part(parts, 'month')}, ${time}`
}

const numberFormat = new Intl.NumberFormat('en-GB')

// "40 loaves", "1 loaf".
export function formatQuantity(count: number, unit: UnitOption): string {
  return `${numberFormat.format(count)} ${count === 1 ? unit.singular : unit.label}`
}
