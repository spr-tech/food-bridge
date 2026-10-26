// The simulated store enforces the rules the real service must: one approval per listing,
// no requests on expired listings, one request per recipient, owner-only decisions and
// recipient-only cancelling, repeat-safe writes, and sign-in.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearSession } from '@/app/session'
import * as db from '@/mocks/db'
import { ACCOUNTS, DEMO_PASSWORD } from '@/mocks/seed'
import { simulate, simulateRivalApproval, simulateWrite } from '@/mocks/simulate'
import { signInAs } from '@/test/render'
import type { CreateListingInput } from '@/types/api'

// Expects fn to throw a MockApiError with this status and code.
function expectError(fn: () => unknown, status: number, code: string) {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(db.MockApiError)
    expect(error).toMatchObject({ status, code })
    return
  }
  throw new Error(`Expected ${status} ${code}, but nothing was thrown`)
}

function requestStatus(id: string, listingId: string) {
  const donor = signInAs('donor')
  return db.listListingRequests(donor, listingId).find((r) => r.id === id)?.status
}

const IN_TWO_HOURS = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

function listingInput(overrides: Partial<CreateListingInput> = {}): CreateListingInput {
  return {
    foodName: 'Puff-puff',
    description: '',
    category: 'pastries',
    quantity: 30,
    unit: 'pieces',
    pickupArea: 'yaba',
    deadline: IN_TWO_HOURS(),
    photoUrl: null,
    ...overrides,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('sign in', () => {
  it('signs a demo account in with its role and organisation', () => {
    const session = db.signIn('Recipient@FoodBridge.test', DEMO_PASSWORD)

    expect(session).toMatchObject({ role: 'recipient', organisationName: 'Hope Community Kitchen' })
    expect(session.token).toBeTruthy()
  })

  it('has one demo account per role; the other organisations have no login', () => {
    expect(ACCOUNTS.map((account) => account.role)).toEqual(['donor', 'recipient', 'admin'])
    expectError(() => db.signIn('recipient2@foodbridge.test', DEMO_PASSWORD), 401, 'INVALID_CREDENTIALS')
  })

  it('refuses a wrong password with 401 INVALID_CREDENTIALS', () => {
    expectError(() => db.signIn('donor@foodbridge.test', 'wrong'), 401, 'INVALID_CREDENTIALS')
  })

  it('refuses every call without a session with 401', () => {
    expectError(() => db.listListings(null), 401, 'SESSION_EXPIRED')
  })
})

describe('one approved request per listing', () => {
  it('approves one request and declines the other pending ones', () => {
    const donor = signInAs('donor')

    db.decideRequest(donor, { requestId: 'req-01', decision: 'APPROVED' })

    expect(requestStatus('req-01', 'lst-01')).toBe('APPROVED')
    expect(requestStatus('req-02', 'lst-01')).toBe('DECLINED')
    expect(requestStatus('req-03', 'lst-01')).toBe('DECLINED')
    expect(db.getListing(donor, 'lst-01').status).toBe('RESERVED')
  })

  it('refuses a second approval with 409 LISTING_ALREADY_RESERVED', () => {
    const donor = signInAs('donor')
    db.decideRequest(donor, { requestId: 'req-01', decision: 'APPROVED' })

    expectError(
      () => db.decideRequest(donor, { requestId: 'req-02', decision: 'APPROVED' }),
      409,
      'LISTING_ALREADY_RESERVED',
    )
  })

  it('declines one request and leaves the others pending', () => {
    const donor = signInAs('donor')

    db.decideRequest(donor, { requestId: 'req-02', decision: 'DECLINED' })

    expect(requestStatus('req-02', 'lst-01')).toBe('DECLINED')
    expect(requestStatus('req-01', 'lst-01')).toBe('PENDING')
  })

  it('lets only the owning donor approve or decline (403)', () => {
    // req-09 is on Eko Caterers' listing, not Mama's Oven's.
    expectError(() => db.decideRequest(signInAs('donor'), { requestId: 'req-09', decision: 'APPROVED' }), 403, 'NOT_OWNER')
    expectError(() => db.decideRequest(signInAs('recipient'), { requestId: 'req-01', decision: 'DECLINED' }), 403, 'NOT_OWNER')
  })
})

describe('making a request', () => {
  it('refuses a request on an expired listing with 409 LISTING_EXPIRED', () => {
    // lst-14 (Akara and pap) passed its deadline two hours ago.
    expectError(() => db.createRequest(signInAs('recipient'), { listingId: 'lst-14' }, 'key-1'), 409, 'LISTING_EXPIRED')
  })

  it('refuses a request on a reserved listing with 409 LISTING_NOT_AVAILABLE', () => {
    expectError(() => db.createRequest(signInAs('recipient'), { listingId: 'lst-07' }, 'key-1'), 409, 'LISTING_NOT_AVAILABLE')
  })

  it('refuses the same recipient requesting twice with 409 ALREADY_REQUESTED', () => {
    // Hope Community Kitchen already asked for the loaves (req-01).
    expectError(() => db.createRequest(signInAs('recipient'), { listingId: 'lst-01' }, 'key-1'), 409, 'ALREADY_REQUESTED')
  })

  it('lets only recipients request (403)', () => {
    expectError(() => db.createRequest(signInAs('donor'), { listingId: 'lst-06' }, 'key-1'), 403, 'NOT_ALLOWED')
  })

  it('records one request for a repeated idempotency key', () => {
    const recipient = signInAs('recipient')

    const first = db.createRequest(recipient, { listingId: 'lst-09' }, 'same-key')
    const again = db.createRequest(recipient, { listingId: 'lst-09' }, 'same-key')

    expect(again.id).toBe(first.id)
    expect(db.listMyRequests(recipient).filter((r) => r.listingId === 'lst-09')).toHaveLength(1)
  })

  it('reads a pending request as EXPIRED once its listing passes its deadline', () => {
    const recipient = signInAs('recipient')
    db.createRequest(recipient, { listingId: 'lst-09' }, 'key-1')

    vi.useFakeTimers({ now: Date.now() + 7 * 60 * 60 * 1000 })

    expect(db.listMyRequests(recipient).find((r) => r.listingId === 'lst-09')?.status).toBe('EXPIRED')
    expect(db.getListing(recipient, 'lst-09').status).toBe('EXPIRED')
  })
})

describe('cancelling a request', () => {
  it('lets the recipient who made a pending request cancel it', () => {
    const recipient = signInAs('recipient')

    const cancelled = db.cancelRequest(recipient, { requestId: 'req-01' })

    expect(cancelled.status).toBe('CANCELLED')
  })

  it('refuses anyone else with 403', () => {
    // req-02 is Ajegunle Food Bank's, not Hope Community Kitchen's.
    expectError(() => db.cancelRequest(signInAs('recipient'), { requestId: 'req-02' }), 403, 'NOT_OWNER')
    expectError(() => db.cancelRequest(signInAs('donor'), { requestId: 'req-01' }), 403, 'NOT_OWNER')
  })

  it('refuses a request that is no longer pending with 409 REQUEST_NOT_PENDING', () => {
    const recipient = signInAs('recipient')
    // req-04 is approved and req-07 expired.
    expectError(() => db.cancelRequest(recipient, { requestId: 'req-04' }), 409, 'REQUEST_NOT_PENDING')
    expectError(() => db.cancelRequest(recipient, { requestId: 'req-07' }), 409, 'REQUEST_NOT_PENDING')
  })

  it('no longer counts a cancelled request as pending', () => {
    const recipient = signInAs('recipient')

    db.cancelRequest(recipient, { requestId: 'req-01' })

    expect(db.getListing(recipient, 'lst-01').pendingRequestCount).toBe(2)
  })

  it('lets the recipient request the same listing again after cancelling', () => {
    const recipient = signInAs('recipient')
    db.cancelRequest(recipient, { requestId: 'req-01' })

    const again = db.createRequest(recipient, { listingId: 'lst-01' }, 'key-again')

    expect(again.status).toBe('PENDING')
  })

  it('cannot cancel, approve or decline a cancelled request', () => {
    const recipient = signInAs('recipient')
    db.cancelRequest(recipient, { requestId: 'req-01' })

    expectError(() => db.cancelRequest(recipient, { requestId: 'req-01' }), 409, 'REQUEST_NOT_PENDING')
    expectError(() => db.decideRequest(signInAs('donor'), { requestId: 'req-01', decision: 'APPROVED' }), 409, 'REQUEST_NOT_PENDING')
  })
})

describe('creating a listing', () => {
  it('creates an available listing for the signed-in donor', () => {
    const donor = signInAs('donor')

    const listing = db.createListing(donor, listingInput(), 'key-1')

    expect(listing).toMatchObject({ status: 'AVAILABLE', donorName: "Mama's Oven", foodName: 'Puff-puff' })
    expect(db.listMyListings(donor).map((l) => l.id)).toContain(listing.id)
  })

  it('records one listing for a repeated idempotency key', () => {
    const donor = signInAs('donor')

    const first = db.createListing(donor, listingInput(), 'same-key')
    const again = db.createListing(donor, listingInput(), 'same-key')

    expect(again.id).toBe(first.id)
    expect(db.listMyListings(donor).filter((l) => l.foodName === 'Puff-puff')).toHaveLength(1)
  })

  it("refuses invalid fields with 400 and the spec's message for each", () => {
    const donor = signInAs('donor')
    const past = new Date(Date.now() - 60_000).toISOString()

    try {
      db.createListing(donor, listingInput({ foodName: 'ab', quantity: 0, deadline: past }), 'key-1')
      throw new Error('Expected a 400')
    } catch (error) {
      expect(error).toMatchObject({
        status: 400,
        code: 'VALIDATION_FAILED',
        fields: {
          foodName: 'Enter the food name',
          quantity: 'Enter a quantity of 1 or more',
          deadline: 'The deadline must be later than now',
        },
      })
    }
  })

  it('lets only donors create listings (403)', () => {
    expectError(() => db.createListing(signInAs('recipient'), listingInput(), 'key-1'), 403, 'NOT_ALLOWED')
  })
})

describe('browsing', () => {
  it('combines search, category, area and status', () => {
    const recipient = signInAs('recipient')

    const page = db.listListings(recipient, { q: 'rice', category: 'cooked-meals', area: 'surulere', status: 'AVAILABLE' })

    expect(page.items.map((l) => l.foodName)).toEqual(['Jollof rice and chicken'])
  })

  it('returns the first page and the total', () => {
    const page = db.listListings(signInAs('recipient'), { status: 'all', limit: 12 })

    expect(page.items).toHaveLength(12)
    expect(page.total).toBe(19)
  })
})

describe('storage', () => {
  it('keeps the data in sessionStorage under its own key, through signing out', () => {
    const donor = signInAs('donor')
    const listing = db.createListing(donor, listingInput(), 'key-1')

    clearSession()

    expect(sessionStorage.getItem(db.MOCK_DB_STORAGE_KEY)).toContain(listing.id)
    expect(db.getListing(signInAs('recipient'), listing.id).foodName).toBe('Puff-puff')
  })
})

describe('simulate switches', () => {
  it('?simulate=error fails the call with a 500', async () => {
    window.history.replaceState(null, '', '/?simulate=error')

    const result = await simulate(() => 'never')

    expect(result).toMatchObject({ error: { status: 500 } })
  })

  it('?simulate=empty returns an empty list', async () => {
    window.history.replaceState(null, '', '/?simulate=empty')

    const result = await simulate(() => ['seeded'], () => [])

    expect(result).toEqual({ data: [] })
  })

  it('?simulate=slow waits two seconds', async () => {
    vi.useFakeTimers()
    window.history.replaceState(null, '', '/?simulate=slow')
    let settled = false

    const pending = simulate(() => 'done').then((result) => {
      settled = true
      return result
    })
    await vi.advanceTimersByTimeAsync(1999)
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(1)

    expect(await pending).toEqual({ data: 'done' })
  })

  it('?simulate=offline fails saves as a dropped connection and leaves reads alone', async () => {
    window.history.replaceState(null, '', '/?simulate=offline')
    let saved = false

    const save = await simulateWrite(() => {
      saved = true
    })
    const read = await simulate(() => 'listings')

    expect(save).toMatchObject({ error: { status: 'FETCH_ERROR' } })
    expect(saved).toBe(false)
    expect(read).toEqual({ data: 'listings' })
  })

  it('?simulate=conflict approves another pending request first, once per page load', () => {
    window.history.replaceState(null, '', '/?simulate=conflict')
    const donor = signInAs('donor')

    simulateRivalApproval('req-02')
    expectError(() => db.decideRequest(donor, { requestId: 'req-02', decision: 'APPROVED' }), 409, 'LISTING_ALREADY_RESERVED')
    expect(requestStatus('req-01', 'lst-01')).toBe('APPROVED')
    expect(requestStatus('req-02', 'lst-01')).toBe('DECLINED')

  })

  it('?simulate=conflict fires only once per page load', () => {
    window.history.replaceState(null, '', '/?simulate=conflict')
    signInAs('donor')

    // The first approval spends it, even on a listing with no other pending request.
    simulateRivalApproval('req-09')
    simulateRivalApproval('req-02')

    expect(requestStatus('req-01', 'lst-01')).toBe('PENDING')
    expect(requestStatus('req-02', 'lst-01')).toBe('PENDING')
  })

  it("passes the store's errors on as RTK Query errors", async () => {
    const result = await simulate(() => db.listListings(null))

    expect(result).toEqual({
      error: { status: 401, data: { code: 'SESSION_EXPIRED', message: 'Your session ended. Sign in again.', fields: undefined } },
    })
  })
})
