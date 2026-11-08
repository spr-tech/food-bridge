// A recipient's request card on Your requests. When the request wasn't approved and its
// listing is Reserved or Collected, the card says so for as long as it shows, whether the
// service left the request Pending or stored it as Declined. The service sends no decline
// reason, so the card never says why, and never that another organisation was approved.
// Approved, collected and cancelled requests keep their own wording.
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { RequestItem } from '@/components/content/requests/your-requests/RequestItem'
import { renderRoutes, signInAs } from '@/test/render'
import type { ListingRequest } from '@/models/api'
import type { ListingStatus, RequestStatus } from '@/utilities/enums/status'

const MESSAGE = 'This request was not approved. The food listing is no longer available for requests.'

const request = (status: RequestStatus, listingStatus: ListingStatus): ListingRequest => ({
  id: 'req-test',
  listingId: 'lst-test',
  listing: {
    id: 'lst-test',
    foodName: 'Jollof rice',
    quantity: 20,
    unit: 'portions',
    pickupArea: 'yaba',
    deadline: '2030-01-01T18:00:00Z',
    donorName: "Mama's Oven",
    status: listingStatus,
    photoUrl: null,
  },
  recipientId: 'acc-recipient',
  recipientName: 'Hope Community Kitchen',
  recipientArea: 'yaba',
  note: null,
  status,
  createdAt: '2030-01-01T10:00:00Z',
})

function renderItem(item: ListingRequest) {
  renderRoutes([{ path: '/', element: <RequestItem request={item} /> }])
}

beforeEach(() => {
  signInAs('recipient')
})

describe('RequestItem: a request that was not approved', () => {
  it.each([
    ['DECLINED', 'RESERVED'],
    ['DECLINED', 'COLLECTED'],
    ['PENDING', 'RESERVED'],
    ['PENDING', 'COLLECTED'],
  ] as const)('a %s request on a %s listing says it was not approved, giving no reason', (status, listingStatus) => {
    renderItem(request(status, listingStatus))

    expect(screen.getByText('Declined')).toBeInTheDocument()
    expect(screen.getByText(MESSAGE)).toBeInTheDocument()
    expect(screen.queryByText(/another organisation/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancel/ })).not.toBeInTheDocument()
  })

  it('a declined request on a listing still available shows Declined only', () => {
    renderItem(request('DECLINED', 'AVAILABLE'))
    expect(screen.getByText('Declined')).toBeInTheDocument()
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })

  it('an approved request on a reserved listing shows its pickup details, not the message', () => {
    renderItem(request('APPROVED', 'RESERVED'))
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText(/^Approved\. Collect from/)).toBeInTheDocument()
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })

  it('a collected request shows Collected, not the message', () => {
    renderItem(request('APPROVED', 'COLLECTED'))
    expect(screen.getByText('Collected')).toBeInTheDocument()
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })

  it.each(['RESERVED', 'COLLECTED'] as const)('a cancelled request on a %s listing shows Cancelled, not the message', (listingStatus) => {
    renderItem(request('CANCELLED', listingStatus))
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })

  it('a declined request on an expired listing shows Declined, not the message', () => {
    renderItem(request('DECLINED', 'EXPIRED'))
    expect(screen.getByText('Declined')).toBeInTheDocument()
    expect(screen.queryByText(MESSAGE)).not.toBeInTheDocument()
  })
})
