// StatusBadge shows the agreed on-screen word for every request status.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { RequestStatus } from '@/types/status'

// Written out here rather than read from constants/status.ts, so a wrong label there fails.
const REQUEST_LABELS: [RequestStatus, string][] = [
  ['PENDING', 'Pending'],
  ['APPROVED', 'Approved'],
  ['DECLINED', 'Declined'],
  ['EXPIRED', 'Expired'],
]

describe('StatusBadge', () => {
  it.each(REQUEST_LABELS)('shows %s as "%s"', (status, label) => {
    render(<StatusBadge kind="request" status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText(status)).not.toBeInTheDocument()
  })
})
