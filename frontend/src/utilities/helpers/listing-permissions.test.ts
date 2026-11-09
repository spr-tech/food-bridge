// Who is offered Delete listing, and when a listing can be edited, for every role and
// listing status.
import { describe, expect, it } from 'vitest'
import { canDeleteListing, deleteBlockedReason, isListingEditable } from '@/utilities/helpers/listing-permissions'
import type { Listing } from '@/models/entities/listing'

const OWNER = '6b1f6c1e-3c43-4a59-9d1e-0d6c8a1f2b11'
const OTHER = '0f3a9e52-7d1b-4f0e-8a2c-5b9d4e6f7a88'
// Offered (Collected is offered disabled; see deleteBlockedReason).
const LIVE: Listing['status'][] = ['AVAILABLE', 'EXPIRED', 'COLLECTED']
const STATUSES: Listing['status'][] = [...LIVE, 'RESERVED', 'DELETED']

const listing = (status: Listing['status']) => ({ donorId: OWNER, status })

describe('canDeleteListing', () => {
  it.each(LIVE)('the owning donor, %s listing: offered', (status) => {
    expect(canDeleteListing({ role: 'donor', accountId: OWNER }, listing(status))).toBe(true)
  })

  // The service refuses Reserved (409), so it isn't offered; nor is a listing already deleted.
  it.each(['RESERVED', 'DELETED'] as const)('the owning donor, %s listing: not offered', (status) => {
    expect(canDeleteListing({ role: 'donor', accountId: OWNER }, listing(status))).toBe(false)
  })

  it.each(STATUSES)("another donor, %s listing: never", (status) => {
    expect(canDeleteListing({ role: 'donor', accountId: OTHER }, listing(status))).toBe(false)
  })

  it.each(LIVE)('an administrator, %s listing: offered', (status) => {
    expect(canDeleteListing({ role: 'admin', accountId: OTHER }, listing(status))).toBe(true)
  })

  it.each(['RESERVED', 'DELETED'] as const)('an administrator, %s listing: not offered', (status) => {
    expect(canDeleteListing({ role: 'admin', accountId: OTHER }, listing(status))).toBe(false)
  })

  it.each(STATUSES)('a recipient, %s listing: never', (status) => {
    expect(canDeleteListing({ role: 'recipient', accountId: OWNER }, listing(status))).toBe(false)
  })

  it('nobody signed in: never', () => {
    expect(canDeleteListing(null, listing('AVAILABLE'))).toBe(false)
  })

  it('a listing with no donorId never matches a donor', () => {
    expect(canDeleteListing({ role: 'donor', accountId: '' }, { donorId: '', status: 'AVAILABLE' })).toBe(false)
  })
})

describe('deleteBlockedReason', () => {
  it('disables Delete on a Collected listing, with the reason', () => {
    expect(deleteBlockedReason({ status: 'COLLECTED' })).toBe(
      "Collected listings can't be deleted. They're kept as a record of the handover.",
    )
  })

  it('disables Delete on a Reversed listing, which the service refuses too', () => {
    expect(deleteBlockedReason({ status: 'REVERSED' })).toBe(
      "Listings whose handover was reversed can't be deleted. They're kept as a record of the handover.",
    )
  })

  it.each(['AVAILABLE', 'RESERVED', 'EXPIRED'] as const)('leaves it enabled on a %s listing', (status) => {
    expect(deleteBlockedReason({ status })).toBeNull()
  })
})

describe('isListingEditable', () => {
  it.each([
    ['AVAILABLE', true],
    ['RESERVED', false],
    ['COLLECTED', false],
    ['REVERSED', false],
    ['EXPIRED', false],
    ['DELETED', false],
  ] as const)('%s: %s', (status, expected) => {
    expect(isListingEditable({ status })).toBe(expected)
  })
})
