// The collection deadline: Share food asks for a date and a time separately
// and sends one value. Both are Lagos time (UTC+1 all year, no daylight saving).

const LAGOS_OFFSET = '+01:00'

const lagosDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const lagosTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Lagos',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// "2026-10-26" and "19:00" give
// "2026-10-26T19:00:00+01:00".
export function combineDeadline(
  date: string,
  time: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null
  }

  const iso = `${date}T${time}:00${LAGOS_OFFSET}`

  return Number.isNaN(Date.parse(iso)) ? null : iso
}

export function isLaterThanNow(
  iso: string,
  now: Date = new Date(),
): boolean {
  return Date.parse(iso) > now.getTime()
}

// Today's date in Lagos as "YYYY-MM-DD".
export function lagosToday(now: Date = new Date()): string {
  return lagosDay.format(now)
}

// Convert a stored ISO deadline into the date and time fields
// used by the Share food and Edit listing forms.
export function splitDeadline(iso: string): {
  date: string
  time: string
} {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' }
  }

  return {
    date: lagosDay.format(date),
    time: lagosTime.format(date),
  }
}