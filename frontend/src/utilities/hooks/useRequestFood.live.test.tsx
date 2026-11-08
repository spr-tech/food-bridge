// Requesting food against the live service (mocks off, fetch stubbed): each refusal the
// service actually sends (DefaultReservationOperations, DefaultListingOperations) gets its
// own message. Refusals a retry can't change offer no Try again; a dropped connection does.
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequestFood } from '@/utilities/hooks/useRequestFood'
import { findToastAction, renderRoutes, signInAs } from '@/test/render'

vi.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test', useMocks: false },
}))

const LISTING_ID = '00000000-0000-4000-8000-000000000001'

function Harness() {
  const { request, isRequested } = useRequestFood(LISTING_ID)
  return (
    <>
      <button type="button" onClick={() => void request()}>
        Request this food
      </button>
      {isRequested && <p>Requested</p>}
    </>
  )
}

const fetchMock = vi.fn<typeof fetch>()

function refuseWith(status: number, code: string) {
  fetchMock.mockImplementation(async (input) => {
    const request = input as Request
    if (request.method === 'POST') {
      return Response.json({ code, message: code, timestamp: '2026-11-02T09:00:00Z' }, { status })
    }
    return new Response(null, { status: 404 })
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  signInAs('recipient')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function requestFood() {
  renderRoutes([{ path: '/', element: <Harness /> }])
  await userEvent.click(screen.getByRole('button', { name: 'Request this food' }))
}

describe('requesting food (live service)', () => {
  it.each([
    [409, 'LISTING_ALREADY_RESERVED', 'This food has just been reserved by another organisation.'],
    [404, 'LISTING_NOT_FOUND', 'This listing is no longer available.'],
    [403, 'FORBIDDEN', "Your account can't request food."],
    [409, 'LISTING_EXPIRED', 'This listing expired before your request was saved.'],
  ])('a %i %s says so, with no Try again', async (status, code, message) => {
    refuseWith(status, code)
    await requestFood()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    expect(screen.queryByText('Requested')).not.toBeInTheDocument()
  })

  it('treats ALREADY_REQUESTED as requested (kept for the planned service check)', async () => {
    refuseWith(409, 'ALREADY_REQUESTED')
    await requestFood()

    expect(await screen.findByText('Requested')).toBeInTheDocument()
  })

  it('offers Try again, with the same idempotency key, when the service is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await requestFood()

    await userEvent.click(await findToastAction("Your request wasn't sent. Try again.", 'Try again'))

    const keys = fetchMock.mock.calls.map(([input]) => (input as Request).headers.get('Idempotency-Key'))
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBeTruthy()
    expect(keys[1]).toBe(keys[0])
  })
})
