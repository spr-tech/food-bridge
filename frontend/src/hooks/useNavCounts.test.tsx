// useNavCounts: the donor's count is pending requests across their listings; the
// recipient's is their own pending requests. Cancelled, declined and expired don't count.
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { describe, expect, it } from 'vitest'
import { makeStore } from '@/app/store'
import { ROUTES } from '@/constants/routes'
import { useNavCounts } from '@/hooks/useNavCounts'
import * as db from '@/mocks/db'
import { signInAs } from '@/test/render'

function renderCounts() {
  const store = makeStore()
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return renderHook(() => useNavCounts(), { wrapper })
}

describe('useNavCounts', () => {
  it("counts a donor's pending requests across all their listings", async () => {
    signInAs('donor')
    const { result } = renderCounts()

    // Seed: three on the wholewheat loaves; the expired and decided ones don't count.
    await waitFor(() => expect(result.current).toEqual({ [ROUTES.requests]: 3 }))
  })

  it("counts a recipient's own pending requests", async () => {
    signInAs('recipient')
    const { result } = renderCounts()

    // Seed: req-01 and req-09 pending; req-04 approved and req-07 expired don't count.
    await waitFor(() => expect(result.current).toEqual({ [ROUTES.yourRequests]: 2 }))
  })

  it('stops counting a request once it is cancelled', async () => {
    const recipient = signInAs('recipient')
    db.cancelRequest(recipient, { requestId: 'req-09' })
    const { result } = renderCounts()

    await waitFor(() => expect(result.current).toEqual({ [ROUTES.yourRequests]: 1 }))
  })

  it('shows no counts when signed out', () => {
    const { result } = renderCounts()

    expect(result.current).toEqual({})
  })
})
