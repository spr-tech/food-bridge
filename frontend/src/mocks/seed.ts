// TEMPORARY: simulated until the API exists.
// The sample data the simulated store starts from: the demo accounts (one donor, three
// recipients, one administrator), other fictional donors in real Lagos areas, and
// listings and requests in every status. Deadlines are set relative to when the store is
// first created, so the data always looks current.
import type { Role } from '@/types/role'

// Every demo account uses this password; it is listed in the root README.
export const DEMO_PASSWORD = 'FoodBridge-demo-2026'

export type MockAccount = {
  id: string
  email: string
  password: string
  role: Role
  organisationName: string
  area: string
}

// Donors who list food but have no demo login.
export type MockDonor = {
  id: string
  organisationName: string
  area: string
}

export type StoredListing = {
  id: string
  foodName: string
  description: string
  category: string
  quantity: number
  unit: string
  pickupArea: string
  deadline: string
  photoUrl: string | null
  donorId: string
  createdAt: string
  collected: boolean
}

// EXPIRED is never stored: a pending request on a listing past its deadline reads as
// EXPIRED (see db.ts), so it changes on its own as time passes.
export type StoredRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED'

export type StoredRequest = {
  id: string
  listingId: string
  recipientId: string
  note: string | null
  status: StoredRequestStatus
  createdAt: string
}

export type MockDb = {
  version: number
  accounts: MockAccount[]
  donors: MockDonor[]
  listings: StoredListing[]
  requests: StoredRequest[]
  // "kind:key" to the id first created with that idempotency key.
  idempotency: Record<string, string>
}

export const DB_VERSION = 1

export const ACCOUNTS: MockAccount[] = [
  { id: 'acc-donor', email: 'donor@foodbridge.test', password: DEMO_PASSWORD, role: 'donor', organisationName: "Mama's Oven", area: 'yaba' },
  { id: 'acc-recipient', email: 'recipient@foodbridge.test', password: DEMO_PASSWORD, role: 'recipient', organisationName: 'Hope Community Kitchen', area: 'yaba' },
  { id: 'acc-recipient-2', email: 'recipient2@foodbridge.test', password: DEMO_PASSWORD, role: 'recipient', organisationName: 'Ajegunle Food Bank', area: 'ajegunle' },
  { id: 'acc-recipient-3', email: 'recipient3@foodbridge.test', password: DEMO_PASSWORD, role: 'recipient', organisationName: 'Grace Shelter', area: 'ikeja' },
  { id: 'acc-admin', email: 'admin@foodbridge.test', password: DEMO_PASSWORD, role: 'admin', organisationName: 'FoodBridge demo admin', area: 'yaba' },
]

const DONORS: MockDonor[] = [
  { id: 'don-eko', organisationName: 'Eko Caterers', area: 'surulere' },
  { id: 'don-basira', organisationName: 'Iya Basira Kitchen', area: 'ikeja' },
  { id: 'don-crumbs', organisationName: 'Sweet Crumbs Bakery', area: 'lekki' },
  { id: 'don-plate', organisationName: 'Daily Plate Restaurant', area: 'surulere' },
  { id: 'don-tejuosho', organisationName: 'Tejuosho Stall 4', area: 'yaba' },
  { id: 'don-lekki', organisationName: 'Lekki Fresh Market', area: 'lekki' },
  { id: 'don-grill', organisationName: 'Ikeja Grill House', area: 'ikeja' },
  { id: 'don-bakehouse', organisationName: 'Surulere Bakehouse', area: 'surulere' },
]

const PHOTO = {
  bakery: '/mock-photos/bakery.svg',
  pastries: '/mock-photos/pastries.svg',
  cooked: '/mock-photos/cooked-meals.svg',
  produce: '/mock-photos/produce.svg',
}

const HOUR = 60 * 60 * 1000
const HALF_HOUR = HOUR / 2

type ListingSeed = Omit<StoredListing, 'deadline' | 'createdAt'> & {
  // Hours from the store's creation; negative is in the past.
  deadlineInHours: number
  listedHoursAgo: number
}

type RequestSeed = Omit<StoredRequest, 'createdAt'> & { madeHoursAgo: number }

const LISTINGS: ListingSeed[] = [
  // Mama's Oven, the demo donor: three requests waiting, one reserved, one collected,
  // one that expired while a request was pending, and one with no requests yet.
  { id: 'lst-01', foodName: 'Wholewheat bread loaves', description: 'Baked this morning and bagged in tens. Collect from the side door and bring your own crates.', category: 'bakery', quantity: 40, unit: 'loaves', pickupArea: 'yaba', photoUrl: PHOTO.bakery, donorId: 'acc-donor', collected: false, deadlineInHours: 5, listedHoursAgo: 2 },
  { id: 'lst-02', foodName: 'Assorted pastries', description: 'Doughnuts, sausage rolls and cinnamon twists from the morning bake.', category: 'pastries', quantity: 12, unit: 'boxes', pickupArea: 'yaba', photoUrl: PHOTO.pastries, donorId: 'acc-donor', collected: false, deadlineInHours: 3, listedHoursAgo: 4 },
  { id: 'lst-03', foodName: 'Meat pies', description: 'Yesterday’s meat pies, kept chilled overnight.', category: 'pastries', quantity: 30, unit: 'pieces', pickupArea: 'yaba', photoUrl: PHOTO.pastries, donorId: 'acc-donor', collected: true, deadlineInHours: -20, listedHoursAgo: 28 },
  { id: 'lst-04', foodName: 'Agege bread', description: 'Soft Agege loaves, wrapped in pairs.', category: 'bakery', quantity: 20, unit: 'loaves', pickupArea: 'yaba', photoUrl: PHOTO.bakery, donorId: 'acc-donor', collected: false, deadlineInHours: -3, listedHoursAgo: 9 },
  { id: 'lst-05', foodName: 'Sausage rolls', description: 'Freshly baked this afternoon. Ready from 4:00 PM.', category: 'pastries', quantity: 24, unit: 'pieces', pickupArea: 'yaba', photoUrl: PHOTO.pastries, donorId: 'acc-donor', collected: false, deadlineInHours: 26, listedHoursAgo: 1 },

  // Other donors.
  { id: 'lst-06', foodName: 'Jollof rice and chicken', description: 'Party-size trays left from an event lunch. Kept hot until collection.', category: 'cooked-meals', quantity: 15, unit: 'portions', pickupArea: 'surulere', photoUrl: PHOTO.cooked, donorId: 'don-eko', collected: false, deadlineInHours: 6, listedHoursAgo: 3 },
  { id: 'lst-07', foodName: 'Vegetable stew', description: 'Efo riro in sealed trays, enough for about forty people.', category: 'cooked-meals', quantity: 10, unit: 'trays', pickupArea: 'ikeja', photoUrl: PHOTO.cooked, donorId: 'don-basira', collected: false, deadlineInHours: 4, listedHoursAgo: 5 },
  // The long food name.
  { id: 'lst-08', foodName: 'Assorted small chops platters: puff-puff, spring rolls, samosas and peppered gizzard', description: 'Six party platters from a cancelled event, never opened.', category: 'pastries', quantity: 6, unit: 'trays', pickupArea: 'lekki', photoUrl: PHOTO.pastries, donorId: 'don-crumbs', collected: false, deadlineInHours: 7, listedHoursAgo: 2 },
  { id: 'lst-09', foodName: 'Moi moi and fried plantain', description: 'Wrapped moi moi with dodo on the side.', category: 'cooked-meals', quantity: 25, unit: 'portions', pickupArea: 'surulere', photoUrl: PHOTO.cooked, donorId: 'don-plate', collected: false, deadlineInHours: 5, listedHoursAgo: 1 },
  // Expired while a request was pending (the second one).
  { id: 'lst-10', foodName: 'Fresh tomatoes and peppers', description: 'Firm tomatoes and tatashe, sorted into baskets.', category: 'produce', quantity: 3, unit: 'baskets', pickupArea: 'yaba', photoUrl: PHOTO.produce, donorId: 'don-tejuosho', collected: false, deadlineInHours: -20, listedHoursAgo: 30 },
  // The listing with no photo.
  { id: 'lst-11', foodName: 'Ugwu and spinach bundles', description: 'Washed and bundled this morning.', category: 'produce', quantity: 6, unit: 'baskets', pickupArea: 'lekki', photoUrl: null, donorId: 'don-lekki', collected: false, deadlineInHours: 8, listedHoursAgo: 2 },
  { id: 'lst-12', foodName: 'Fried rice and turkey', description: 'Packed in single portions with cutlery.', category: 'cooked-meals', quantity: 18, unit: 'portions', pickupArea: 'ikeja', photoUrl: PHOTO.cooked, donorId: 'don-grill', collected: false, deadlineInHours: 2, listedHoursAgo: 4 },
  { id: 'lst-13', foodName: 'Coconut bread', description: 'Sweet coconut loaves, sliced.', category: 'bakery', quantity: 16, unit: 'loaves', pickupArea: 'surulere', photoUrl: PHOTO.bakery, donorId: 'don-bakehouse', collected: false, deadlineInHours: 30, listedHoursAgo: 6 },
  { id: 'lst-14', foodName: 'Akara and pap', description: 'Breakfast leftovers in insulated flasks.', category: 'cooked-meals', quantity: 20, unit: 'portions', pickupArea: 'surulere', photoUrl: PHOTO.cooked, donorId: 'don-plate', collected: false, deadlineInHours: -2, listedHoursAgo: 7 },
  { id: 'lst-15', foodName: 'Ripe plantain', description: 'Very ripe, best used today.', category: 'produce', quantity: 4, unit: 'baskets', pickupArea: 'ajegunle', photoUrl: PHOTO.produce, donorId: 'don-tejuosho', collected: false, deadlineInHours: 9, listedHoursAgo: 3 },
  { id: 'lst-16', foodName: 'Chin chin', description: 'Crunchy chin chin in sealed bags.', category: 'pastries', quantity: 40, unit: 'pieces', pickupArea: 'lekki', photoUrl: PHOTO.pastries, donorId: 'don-crumbs', collected: false, deadlineInHours: 28, listedHoursAgo: 5 },
  { id: 'lst-17', foodName: 'Ofada rice and ayamase', description: 'Leftover from the lunch service, still warm.', category: 'cooked-meals', quantity: 12, unit: 'portions', pickupArea: 'yaba', photoUrl: PHOTO.cooked, donorId: 'don-eko', collected: false, deadlineInHours: 4, listedHoursAgo: 1 },
  { id: 'lst-18', foodName: 'Wholemeal rolls', description: 'Soft rolls, bagged in twelves.', category: 'bakery', quantity: 8, unit: 'boxes', pickupArea: 'ikeja', photoUrl: PHOTO.bakery, donorId: 'don-bakehouse', collected: false, deadlineInHours: 10, listedHoursAgo: 8 },
  { id: 'lst-19', foodName: 'Garden eggs and okra', description: 'Mixed vegetables from the morning market.', category: 'produce', quantity: 5, unit: 'baskets', pickupArea: 'ajegunle', photoUrl: PHOTO.produce, donorId: 'don-lekki', collected: false, deadlineInHours: 12, listedHoursAgo: 2 },
]

const REQUESTS: RequestSeed[] = [
  // Three recipients asking for the same loaves: the "three requests" demo.
  { id: 'req-01', listingId: 'lst-01', recipientId: 'acc-recipient', note: 'We need this for our weekend feeding programme. Thank you!', status: 'PENDING', madeHoursAgo: 1.5 },
  { id: 'req-02', listingId: 'lst-01', recipientId: 'acc-recipient-2', note: 'Our van is in Yaba this afternoon.', status: 'PENDING', madeHoursAgo: 1 },
  { id: 'req-03', listingId: 'lst-01', recipientId: 'acc-recipient-3', note: 'For our evening meal service.', status: 'PENDING', madeHoursAgo: 0.5 },
  // Reserved: one approved, the other declined.
  { id: 'req-04', listingId: 'lst-02', recipientId: 'acc-recipient', note: null, status: 'APPROVED', madeHoursAgo: 3.5 },
  { id: 'req-05', listingId: 'lst-02', recipientId: 'acc-recipient-2', note: 'We can collect within the hour.', status: 'DECLINED', madeHoursAgo: 3 },
  // Collected.
  { id: 'req-06', listingId: 'lst-03', recipientId: 'acc-recipient-3', note: null, status: 'APPROVED', madeHoursAgo: 27 },
  // Pending when the listing expired: reads as EXPIRED.
  { id: 'req-07', listingId: 'lst-04', recipientId: 'acc-recipient', note: 'Could we collect after 6?', status: 'PENDING', madeHoursAgo: 6 },
  { id: 'req-08', listingId: 'lst-10', recipientId: 'acc-recipient-3', note: null, status: 'PENDING', madeHoursAgo: 25 },
  // Another donor's listings.
  { id: 'req-09', listingId: 'lst-06', recipientId: 'acc-recipient', note: 'For the children’s lunch club.', status: 'PENDING', madeHoursAgo: 2 },
  { id: 'req-10', listingId: 'lst-07', recipientId: 'acc-recipient-2', note: null, status: 'APPROVED', madeHoursAgo: 4 },
  { id: 'req-11', listingId: 'lst-12', recipientId: 'acc-recipient-3', note: null, status: 'CANCELLED', madeHoursAgo: 3 },
]

// Times are rounded to the half hour, like real collection times.
function at(now: number, hours: number): string {
  return new Date(Math.round((now + hours * HOUR) / HALF_HOUR) * HALF_HOUR).toISOString()
}

export function createSeed(now: Date): MockDb {
  const time = now.getTime()
  return {
    version: DB_VERSION,
    accounts: ACCOUNTS.map((account) => ({ ...account })),
    donors: DONORS.map((donor) => ({ ...donor })),
    listings: LISTINGS.map(({ deadlineInHours, listedHoursAgo, ...listing }) => ({
      ...listing,
      deadline: at(time, deadlineInHours),
      createdAt: new Date(time - listedHoursAgo * HOUR).toISOString(),
    })),
    requests: REQUESTS.map(({ madeHoursAgo, ...request }) => ({
      ...request,
      createdAt: new Date(time - madeHoursAgo * HOUR).toISOString(),
    })),
    idempotency: {},
  }
}
