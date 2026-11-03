// What a recipient's request shows, given its listing. The service leaves a request
// PENDING after its listing has been reserved, collected, reversed, deleted or expired.
import { describe, expect, it } from 'vitest'
import { getRecipientRequestStatus, REQUEST_NOT_APPROVED, wasNotApprovedAndListingClosed } from '@/lib/request-status'

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

describe('wasNotApprovedAndListingClosed', () => {
  it.each([
    ['PENDING', 'RESERVED'],
    ['PENDING', 'COLLECTED'],
    ['DECLINED', 'RESERVED'],
    ['DECLINED', 'COLLECTED'],
  ] as const)('a %s request on a %s listing: yes', (status, listingStatus) => {
    expect(wasNotApprovedAndListingClosed(status, listingStatus)).toBe(true)
  })

  // Approved and cancelled requests keep their own wording; Expired and Deleted listings have
  // their own explanations; a listing still Available is still open to requests.
  it.each([
    ['APPROVED', 'RESERVED'],
    ['APPROVED', 'COLLECTED'],
    ['CANCELLED', 'RESERVED'],
    ['CANCELLED', 'COLLECTED'],
    ['EXPIRED', 'RESERVED'],
    ['DECLINED', 'AVAILABLE'],
    ['DECLINED', 'EXPIRED'],
    ['DECLINED', 'DELETED'],
    ['PENDING', 'AVAILABLE'],
  ] as const)('a %s request on a %s listing: no', (status, listingStatus) => {
    expect(wasNotApprovedAndListingClosed(status, listingStatus)).toBe(false)
  })

  // The service sends no decline reason, so the message gives none.
  it('states what is known without claiming who was approved', () => {
    expect(REQUEST_NOT_APPROVED).toBe(
      'This request was not approved. The food listing is no longer available for requests.',
    )
    expect(REQUEST_NOT_APPROVED).not.toMatch(/another organisation/i)
  })
})
