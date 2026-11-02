// What a recipient's request shows, given its listing. The service leaves a request
// PENDING after its listing has been reserved, collected, reversed, deleted or expired.
import { describe, expect, it } from 'vitest'
import { getRecipientRequestStatus } from '@/lib/request-status'

describe('getRecipientRequestStatus', () => {
  it.each([
    ['AVAILABLE', 'PENDING'],
    ['RESERVED', 'DECLINED'],
    ['COLLECTED', 'DECLINED'],
    ['EXPIRED', 'EXPIRED'],
    ['DELETED', 'EXPIRED'],
    ['REVERSED', 'EXPIRED'],
  ] as const)('a pending request on a %s listing shows %s', (listingStatus, shown) => {
    expect(getRecipientRequestStatus('PENDING', listingStatus)).toBe(shown)
  })

  it.each(['APPROVED', 'DECLINED', 'CANCELLED', 'EXPIRED'] as const)(
    'a %s request keeps its own status',
    (status) => {
      expect(getRecipientRequestStatus(status, 'RESERVED')).toBe(status)
    },
  )
})
