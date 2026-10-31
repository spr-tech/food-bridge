import { describe, expect, it } from 'vitest'
import { extractImageReference, mapBackendListing, mapBackendRequest } from '@/services/backend-mappers'

describe('backend response adapters', () => {
  it('maps backend listing fields into the existing frontend listing shape', () => {
    const listing = mapBackendListing({
      id: 'listing-1',
      foodName: 'Fresh bread',
      description: 'Unsold loaves',
      category: 'bakery',
      quantity: 12,
      unit: 'loaves',
      imageReference: 'https://res.cloudinary.com/demo/bread.jpg',
      pickupArea: 'yaba',
      collectionDeadline: '2026-10-31T16:00:00+01:00',
      status: 'AVAILABLE',
      donorId: 'donor-1',
      donorName: "Mama's Oven",
      createdAt: '2026-10-30T10:00:00Z',
      pendingRequestCount: 2,
    })

    expect(listing).toMatchObject({
      id: 'listing-1',
      foodName: 'Fresh bread',
      deadline: '2026-10-31T16:00:00+01:00',
      photoUrl: 'https://res.cloudinary.com/demo/bread.jpg',
      status: 'AVAILABLE',
      pendingRequestCount: 2,
    })
  })

  it('extracts a Cloudinary URL from common upload response fields', () => {
    expect(extractImageReference({ secure_url: 'https://res.cloudinary.com/demo/food.jpg' }))
      .toBe('https://res.cloudinary.com/demo/food.jpg')
  })

  it('maps recipient fields and preserves a request note when the API returns one', () => {
    const request = mapBackendRequest({
      id: 'request-1',
      listingId: 'listing-1',
      recipientId: 'recipient-1',
      recipientName: 'Hope Kitchen',
      status: 'PENDING',
      createdAt: '2026-10-30T10:00:00Z',
      note: 'We can collect before 4pm',
    })
    expect(request).toMatchObject({
      recipientId: 'recipient-1',
      recipientName: 'Hope Kitchen',
      note: 'We can collect before 4pm',
      status: 'PENDING',
    })
  })
})

// ---------------------------------------------------------------------------
// Explanation
// - Checks the mapper functions with made-up service responses. It does not call the
//   real service, so a passing test does not prove the live replies match.
// - Save as src/services/backend-mappers.test.ts.