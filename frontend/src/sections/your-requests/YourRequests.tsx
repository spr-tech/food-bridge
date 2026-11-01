
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/constants/routes'
import { useNow } from '@/hooks/useNow'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { formatUpdated } from '@/lib/format'
import { RequestItem } from '@/sections/your-requests/RequestItem'
import { errorStatus } from '@/services/errors'
import { useMyRequests } from '@/services/requests'
import type { ListingRequest } from '@/types/api'

type RequestView = 'open' | 'history'

const newestFirst = (
  a: ListingRequest,
  b: ListingRequest,
) => Date.parse(b.createdAt) - Date.parse(a.createdAt)

function isCollected(request: ListingRequest): boolean {
  return request.listing.status === 'COLLECTED'
}

function isOpenRequest(request: ListingRequest): boolean {
  return (
    !isCollected(request) &&
    (request.status === 'PENDING' ||
      request.status === 'APPROVED')
  )
}

function isHistoryRequest(request: ListingRequest): boolean {
  return (
    isCollected(request) ||
    (request.status !== 'PENDING' &&
      request.status !== 'APPROVED')
  )
}

function RequestList({
  requests,
}: {
  requests: ListingRequest[]
}) {
  return (
    <ul className="grid gap-3">
      {requests.map((request) => (
        <li key={request.id}>
          <RequestItem request={request} />
        </li>
      ))}
    </ul>
  )
}

export function YourRequests() {
  const requests = useMyRequests()
  const navigate = useNavigate()
  const sessionEnded = useSessionEnded()
  const now = useNow()

  const [activeView, setActiveView] = useState<RequestView>('open')

  useEffect(() => {
    if (errorStatus(requests.error) === 401) {
      void sessionEnded()
    }
  }, [requests.error, sessionEnded])

  if (requests.isLoading) {
    return (
      <LoadingState label="Loading your requests">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </LoadingState>
    )
  }

  if (requests.isError) {
    return (
      <ErrorState
        title="We couldn't load your requests."
        description="Check your connection and try again."
        onRetry={() => void requests.refetch()}
        retrying={requests.isFetching}
      />
    )
  }

  const all = requests.data ?? []

  if (all.length === 0) {
    return (
      <EmptyState
        title="You haven't requested any food yet."
        description="Find surplus food nearby and request what your organisation can collect."
        action={{
          label: 'Find food',
          onClick: () => void navigate(ROUTES.listings),
        }}
      />
    )
  }

  const openRequests = all
    .filter(isOpenRequest)
    .sort(newestFirst)

  const historyRequests = all
    .filter(isHistoryRequest)
    .sort(newestFirst)

  return (
    <>
      {requests.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">
          {formatUpdated(requests.fulfilledTimeStamp, now)}
        </p>
      )}

      {/* Request view toggler */}
      <div
        role="tablist"
        aria-label="Your request views"
        className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-surface-hover p-1"
      >
        <button
          id="open-requests-tab"
          type="button"
          role="tab"
          aria-selected={activeView === 'open'}
          aria-controls="open-requests-panel"
          onClick={() => setActiveView('open')}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
            activeView === 'open'
              ? 'bg-[#174B3B] text-white shadow-sm'
              : 'bg-transparent text-text-secondary hover:bg-surface'
          }`}
        >
          Open Requests

          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              activeView === 'open'
                ? 'bg-white/15 text-white'
                : 'bg-surface text-text-muted'
            }`}
          >
            {openRequests.length}
          </span>
        </button>

        <button
          id="request-history-tab"
          type="button"
          role="tab"
          aria-selected={activeView === 'history'}
          aria-controls="request-history-panel"
          onClick={() => setActiveView('history')}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
            activeView === 'history'
              ? 'bg-[#174B3B] text-white shadow-sm'
              : 'bg-transparent text-text-secondary hover:bg-surface'
          }`}
        >
          Request History

          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              activeView === 'history'
                ? 'bg-white/15 text-white'
                : 'bg-surface text-text-muted'
            }`}
          >
            {historyRequests.length}
          </span>
        </button>
      </div>

      {/* Open requests panel */}
      {activeView === 'open' && (
        <section
          id="open-requests-panel"
          role="tabpanel"
          aria-labelledby="open-requests-tab"
          tabIndex={0}
        >
          <h2 className="mb-3 font-display text-xl">
            Open requests
          </h2>

          {openRequests.length > 0 ? (
            <RequestList requests={openRequests} />
          ) : (
            <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-muted">
              No open requests right now. Your pending and approved requests will appear here.
            </p>
          )}
        </section>
      )}

      {/* Request history panel */}
      {activeView === 'history' && (
        <section
          id="request-history-panel"
          role="tabpanel"
          aria-labelledby="request-history-tab"
          tabIndex={0}
        >
          <h2 className="mb-3 font-display text-xl">
            Request history
          </h2>

          {historyRequests.length > 0 ? (
            <RequestList requests={historyRequests} />
          ) : (
            <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-muted">
              No request history yet. Collected, declined, cancelled and expired requests will appear here.
            </p>
          )}
        </section>
      )}
    </>
  )
}
