// StatusBadge shows the agreed on-screen word for every status, never the API value,
// and gives each status its spec section 12 colours through the shared badge's tone.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { ListingStatus, RequestStatus } from '@/types/status'

// Written out here rather than read from constants/status.ts, so a wrong label or tone
// there fails. Each row: status, on-screen word, the background variable its shared tone
// reads, and the FoodBridge colour that variable must be set to on the badge.
const REQUEST_ROWS: [RequestStatus, string, string, string][] = [
  ['PENDING', 'Pending', '--color-warning', 'pending'],
  ['APPROVED', 'Approved', '--color-success', 'available'],
  ['DECLINED', 'Declined', '--color-surface', 'expired'],
  ['EXPIRED', 'Expired', '--color-surface', 'expired'],
  ['CANCELLED', 'Cancelled', '--color-surface', 'expired'],
]

const LISTING_ROWS: [ListingStatus, string, string, string][] = [
  ['AVAILABLE', 'Available', '--color-success', 'available'],
  ['RESERVED', 'Reserved', '--color-primary', 'reserved'],
  ['COLLECTED', 'Collected', '--color-surface', 'expired'],
  ['EXPIRED', 'Expired', '--color-surface', 'expired'],
]

function badgeFor(label: string): HTMLElement {
  const badge = screen.getByText(label).closest<HTMLElement>('[data-status]')
  if (!badge) throw new Error(`No badge around "${label}"`)
  return badge
}

describe('StatusBadge', () => {
  it.each(REQUEST_ROWS)('shows request %s as "%s"', (status, label, variable, colours) => {
    render(<StatusBadge kind="request" status={status} />)

    expect(screen.queryByText(status)).not.toBeInTheDocument()
    expect(badgeFor(label).style.getPropertyValue(variable)).toBe(
      `var(--color-status-${colours}-bg)`,
    )
  })

  it.each(LISTING_ROWS)('shows listing %s as "%s"', (status, label, variable, colours) => {
    render(<StatusBadge kind="listing" status={status} />)

    expect(screen.queryByText(status)).not.toBeInTheDocument()
    expect(badgeFor(label).style.getPropertyValue(variable)).toBe(
      `var(--color-status-${colours}-bg)`,
    )
  })

  it('never shows Reserved in the same colours as Available', () => {
    render(
      <>
        <StatusBadge kind="listing" status="AVAILABLE" />
        <StatusBadge kind="listing" status="RESERVED" />
      </>,
    )

    expect(badgeFor('Available').getAttribute('style')).not.toBe(
      badgeFor('Reserved').getAttribute('style'),
    )
  })
})
