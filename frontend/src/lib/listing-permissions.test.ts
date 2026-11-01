// Who is offered Delete listing, for every role and listing status.
import { describe, expect, it } from 'vitest'
import { canDeleteListing } from '@/lib/listing-permissions'
import type { Listing } from '@/types/api'

const OWNER = '6b1f6c1e-3c43-4a59-9d1e-0d6c8a1f2b11'
const OTHER = '0f3a9e52-7d1b-4f0e-8a2c-5b9d4e6f7a88'
const STATUSES: Listing['status'][] = ['AVAILABLE', 'EXPIRED', 'RESERVED', 'COLLECTED']

const listing = (status: Listing['status']) => ({ donorId: OWNER, status })

describe('canDeleteListing', () => {
  it.each([
    ['AVAILABLE', true],
    ['EXPIRED', true],
    ['RESERVED', false],
    ['COLLECTED', false],
  ] as const)('the owning donor, %s listing: %s', (status, expected) => {
    expect(canDeleteListing({ role: 'donor', accountId: OWNER }, listing(status))).toBe(expected)
  })

  it.each(STATUSES)("another donor, %s listing: never", (status) => {
    expect(canDeleteListing({ role: 'donor', accountId: OTHER }, listing(status))).toBe(false)
  })

  it.each(STATUSES)('an administrator, %s listing: always', (status) => {
    expect(canDeleteListing({ role: 'admin', accountId: OTHER }, listing(status))).toBe(true)
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
