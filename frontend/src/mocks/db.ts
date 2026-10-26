// TEMPORARY: simulated until the API exists.
// The simulated service: the same rules the real one must enforce, on data kept in
// sessionStorage (its own key, so it survives signing out and in as another account in
// the same tab). Each function either returns what the endpoint would, or throws a
// MockApiError with the status and code the endpoint would send.
// Error codes are proposals for the service engineers (docs/decisions.md, 2026-10-25).
import { CATEGORIES, PICKUP_AREAS, UNITS } from '@/constants/listingOptions'
import {
  createSeed,
  DB_VERSION,
  type MockDb,
  type StoredListing,
  type StoredRequest,
} from '@/mocks/seed'
import type {
  CreateListingInput,
  Listing,
  ListingFilters,
  ListingPage,
  ListingRequest,
  Session,
} from '@/types/api'
import type { ListingStatus, RequestStatus } from '@/types/status'

export const MOCK_DB_STORAGE_KEY = 'foodbridge.mock-db'

const PAGE_SIZE = 12

export class MockApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

// ---- Storage ---------------------------------------------------------------------------

// Used when sessionStorage is blocked or full, so the app still works for this page.
let memoryDb: MockDb | null = null

function load(): MockDb {
  if (memoryDb) return memoryDb
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(MOCK_DB_STORAGE_KEY)
  } catch {
    // Blocked storage: start from the seed, kept in memory below.
  }
  if (raw) {
    try {
      const stored = JSON.parse(raw) as MockDb
      if (stored.version === DB_VERSION) return stored
    } catch {
      // Unreadable: start again from the seed.
    }
  }
  const seeded = createSeed(new Date())
  save(seeded)
  return seeded
}

function save(db: MockDb) {
  try {
    sessionStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db))
    memoryDb = null
  } catch {
    memoryDb = db
  }
}

// Starts the simulated data again from the seed (tests, and a fresh demo).
export function resetMockDb() {
  memoryDb = null
  try {
    sessionStorage.removeItem(MOCK_DB_STORAGE_KEY)
  } catch {
    // Nothing stored.
  }
}

// ---- Derived statuses ------------------------------------------------------------------

function isPast(iso: string, now: Date): boolean {
  return Date.parse(iso) <= now.getTime()
}

function findListing(db: MockDb, id: string): StoredListing {
  const listing = db.listings.find((item) => item.id === id)
  if (!listing) throw new MockApiError(404, 'LISTING_NOT_FOUND', 'This listing no longer exists.')
  return listing
}

function listingStatus(db: MockDb, listing: StoredListing, now: Date): ListingStatus {
  if (listing.collected) return 'COLLECTED'
  if (db.requests.some((r) => r.listingId === listing.id && r.status === 'APPROVED')) return 'RESERVED'
  if (isPast(listing.deadline, now)) return 'EXPIRED'
  return 'AVAILABLE'
}

// A request still pending when its listing's deadline passes reads as EXPIRED.
function requestStatus(db: MockDb, request: StoredRequest, now: Date): RequestStatus {
  if (request.status === 'PENDING' && isPast(findListing(db, request.listingId).deadline, now)) {
    return 'EXPIRED'
  }
  return request.status
}

function organisation(db: MockDb, id: string): { organisationName: string; area: string } {
  const owner = db.accounts.find((a) => a.id === id) ?? db.organisations.find((o) => o.id === id)
  return owner ?? { organisationName: 'Unknown organisation', area: '' }
}

function toListing(db: MockDb, listing: StoredListing, now: Date): Listing {
  return {
    id: listing.id,
    foodName: listing.foodName,
    description: listing.description,
    category: listing.category,
    quantity: listing.quantity,
    unit: listing.unit,
    pickupArea: listing.pickupArea,
    deadline: listing.deadline,
    photoUrl: listing.photoUrl,
    donorId: listing.donorId,
    createdAt: listing.createdAt,
    status: listingStatus(db, listing, now),
    donorName: organisation(db, listing.donorId).organisationName,
    pendingRequestCount: db.requests.filter(
      (r) => r.listingId === listing.id && requestStatus(db, r, now) === 'PENDING',
    ).length,
  }
}

function toRequest(db: MockDb, request: StoredRequest, now: Date): ListingRequest {
  const listing = toListing(db, findListing(db, request.listingId), now)
  const recipient = organisation(db, request.recipientId)
  return {
    id: request.id,
    listingId: request.listingId,
    listing: {
      id: listing.id,
      foodName: listing.foodName,
      quantity: listing.quantity,
      unit: listing.unit,
      pickupArea: listing.pickupArea,
      deadline: listing.deadline,
      donorName: listing.donorName,
      status: listing.status,
    },
    recipientId: request.recipientId,
    recipientName: recipient.organisationName,
    recipientArea: recipient.area,
    note: request.note,
    status: requestStatus(db, request, now),
    createdAt: request.createdAt,
  }
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt)

// ---- Who is asking ---------------------------------------------------------------------

function requireActor(db: MockDb, actor: Session | null): Session {
  if (!actor || !db.accounts.some((a) => a.id === actor.accountId)) {
    throw new MockApiError(401, 'SESSION_EXPIRED', 'Your session ended. Sign in again.')
  }
  return actor
}

function requireRole(actor: Session, role: Session['role']) {
  if (actor.role !== role) throw new MockApiError(403, 'NOT_ALLOWED', "You don't have access to this.")
}

// ---- Endpoints -------------------------------------------------------------------------

export function signIn(email: string, password: string): Session {
  const db = load()
  const account = db.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!account || account.password !== password) {
    throw new MockApiError(401, 'INVALID_CREDENTIALS', "That email or password isn't right.")
  }
  return {
    token: crypto.randomUUID(),
    accountId: account.id,
    role: account.role,
    organisationName: account.organisationName,
    email: account.email,
  }
}

const label = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? ''

export function listListings(actor: Session | null, filters: ListingFilters = {}): ListingPage {
  const db = load()
  requireActor(db, actor)
  const now = new Date()
  const q = filters.q?.trim().toLowerCase() ?? ''
  const status = filters.status ?? 'all'

  const matches = db.listings
    .map((listing) => toListing(db, listing, now))
    .filter((listing) => !filters.category || listing.category === filters.category)
    .filter((listing) => !filters.area || listing.pickupArea === filters.area)
    .filter((listing) => status === 'all' || listing.status === status)
    .filter(
      (listing) =>
        !q ||
        [listing.foodName, listing.donorName, label(PICKUP_AREAS, listing.pickupArea), label(CATEGORIES, listing.category)]
          .some((text) => text.toLowerCase().includes(q)),
    )
    .sort(newestFirst)

  return { items: matches.slice(0, filters.limit ?? PAGE_SIZE), total: matches.length }
}

export function getListing(actor: Session | null, id: string): Listing {
  const db = load()
  requireActor(db, actor)
  return toListing(db, findListing(db, id), new Date())
}

// Messages are the spec's (S2), so the form can show them under the field as they are.
function validateListing(input: CreateListingInput, now: Date): Record<string, string> {
  const fields: Record<string, string> = {}
  const name = input.foodName.trim()
  if (name.length < 3 || name.length > 80) fields.foodName = 'Enter the food name'
  if (!CATEGORIES.some((option) => option.value === input.category)) fields.category = 'Choose a category'
  if (!Number.isInteger(input.quantity) || input.quantity < 1) fields.quantity = 'Enter a quantity of 1 or more'
  if (!UNITS.some((option) => option.value === input.unit)) fields.unit = 'Choose a unit'
  if (!PICKUP_AREAS.some((option) => option.value === input.pickupArea)) fields.pickupArea = 'Choose a pickup area'
  if (Number.isNaN(Date.parse(input.deadline)) || isPast(input.deadline, now)) {
    fields.deadline = 'The deadline must be later than now'
  }
  return fields
}

export function createListing(actor: Session | null, input: CreateListingInput, idempotencyKey: string): Listing {
  const db = load()
  const donor = requireActor(db, actor)
  requireRole(donor, 'donor')
  const now = new Date()

  const keyId = `listing:${idempotencyKey}`
  const earlier = db.idempotency[keyId]
  if (earlier) return toListing(db, findListing(db, earlier), now)

  const fields = validateListing(input, now)
  if (Object.keys(fields).length > 0) {
    throw new MockApiError(400, 'VALIDATION_FAILED', 'Some fields need changing.', fields)
  }

  const listing: StoredListing = {
    ...input,
    foodName: input.foodName.trim(),
    description: input.description.trim(),
    id: crypto.randomUUID(),
    donorId: donor.accountId,
    createdAt: now.toISOString(),
    collected: false,
  }
  db.listings.push(listing)
  db.idempotency[keyId] = listing.id
  save(db)
  return toListing(db, listing, now)
}

export function listMyListings(actor: Session | null): Listing[] {
  const db = load()
  const donor = requireActor(db, actor)
  requireRole(donor, 'donor')
  const now = new Date()
  return db.listings
    .filter((listing) => listing.donorId === donor.accountId)
    .map((listing) => toListing(db, listing, now))
    .sort(newestFirst)
}

// The approved request first, then the rest oldest first (the order they arrived).
export function listListingRequests(actor: Session | null, listingId: string): ListingRequest[] {
  const db = load()
  const viewer = requireActor(db, actor)
  const listing = findListing(db, listingId)
  if (listing.donorId !== viewer.accountId && viewer.role !== 'admin') {
    throw new MockApiError(403, 'NOT_OWNER', "You don't have access to this.")
  }
  const now = new Date()
  return db.requests
    .filter((r) => r.listingId === listingId)
    .map((r) => toRequest(db, r, now))
    .sort((a, b) =>
      a.status === 'APPROVED' ? -1 : b.status === 'APPROVED' ? 1 : Date.parse(a.createdAt) - Date.parse(b.createdAt),
    )
}

export function createRequest(
  actor: Session | null,
  input: { listingId: string; note?: string | null },
  idempotencyKey: string,
): ListingRequest {
  const db = load()
  const recipient = requireActor(db, actor)
  requireRole(recipient, 'recipient')
  const now = new Date()

  const keyId = `request:${idempotencyKey}`
  const earlier = db.idempotency[keyId]
  const earlierRequest = earlier && db.requests.find((r) => r.id === earlier)
  if (earlierRequest) return toRequest(db, earlierRequest, now)

  const listing = findListing(db, input.listingId)
  const status = listingStatus(db, listing, now)
  if (status === 'EXPIRED') {
    throw new MockApiError(409, 'LISTING_EXPIRED', 'This listing expired before your request was saved.')
  }
  if (status !== 'AVAILABLE') {
    throw new MockApiError(409, 'LISTING_NOT_AVAILABLE', 'This listing is no longer available.')
  }
  // A cancelled request doesn't block asking again.
  if (
    db.requests.some(
      (r) => r.listingId === listing.id && r.recipientId === recipient.accountId && r.status !== 'CANCELLED',
    )
  ) {
    throw new MockApiError(409, 'ALREADY_REQUESTED', 'You have already requested this listing.')
  }

  const request: StoredRequest = {
    id: crypto.randomUUID(),
    listingId: listing.id,
    recipientId: recipient.accountId,
    note: input.note?.trim() || null,
    status: 'PENDING',
    createdAt: now.toISOString(),
  }
  db.requests.push(request)
  db.idempotency[keyId] = request.id
  save(db)
  return toRequest(db, request, now)
}

function findRequest(db: MockDb, id: string): StoredRequest {
  const request = db.requests.find((r) => r.id === id)
  if (!request) throw new MockApiError(404, 'REQUEST_NOT_FOUND', 'This request no longer exists.')
  return request
}

const notPending = () => new MockApiError(409, 'REQUEST_NOT_PENDING', 'This request is no longer pending.')

// Approving one request declines every other pending request on the listing.
export function decideRequest(
  actor: Session | null,
  input: { requestId: string; decision: 'APPROVED' | 'DECLINED' },
): ListingRequest {
  const db = load()
  const donor = requireActor(db, actor)
  const request = findRequest(db, input.requestId)
  const listing = findListing(db, request.listingId)
  if (listing.donorId !== donor.accountId) {
    throw new MockApiError(403, 'NOT_OWNER', "You don't have access to this.")
  }
  const now = new Date()

  if (input.decision === 'APPROVED') {
    // Checked before "still pending": the other requests were declined by that approval,
    // and the donor needs to hear why.
    if (db.requests.some((r) => r.listingId === listing.id && r.status === 'APPROVED')) {
      throw new MockApiError(409, 'LISTING_ALREADY_RESERVED', 'This listing already has an approved request.')
    }
    if (isPast(listing.deadline, now)) {
      throw new MockApiError(409, 'LISTING_EXPIRED', 'This listing expired before your approval was saved.')
    }
  }
  if (requestStatus(db, request, now) !== 'PENDING') throw notPending()

  request.status = input.decision
  if (input.decision === 'APPROVED') {
    for (const other of db.requests) {
      if (other.listingId === listing.id && other.id !== request.id && other.status === 'PENDING') {
        other.status = 'DECLINED'
      }
    }
  }
  save(db)
  return toRequest(db, request, now)
}

// Only the recipient who made a request can cancel it, and only while it is pending.
// Cancelling an approved request is out of scope for now.
export function cancelRequest(actor: Session | null, input: { requestId: string }): ListingRequest {
  const db = load()
  const recipient = requireActor(db, actor)
  const request = findRequest(db, input.requestId)
  if (request.recipientId !== recipient.accountId) {
    throw new MockApiError(403, 'NOT_OWNER', "You don't have access to this.")
  }
  const now = new Date()
  if (requestStatus(db, request, now) !== 'PENDING') throw notPending()

  request.status = 'CANCELLED'
  save(db)
  return toRequest(db, request, now)
}

export function listMyRequests(actor: Session | null): ListingRequest[] {
  const db = load()
  const recipient = requireActor(db, actor)
  requireRole(recipient, 'recipient')
  const now = new Date()
  return db.requests
    .filter((r) => r.recipientId === recipient.accountId)
    .map((r) => toRequest(db, r, now))
    .sort(newestFirst)
}
