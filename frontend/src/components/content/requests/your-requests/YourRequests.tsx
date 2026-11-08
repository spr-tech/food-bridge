import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { History, Inbox, PackageCheck } from 'lucide-react'
import { LoadingState } from '@/components/ui/loading-state/LoadingState'
import { SummaryStrip } from '@/components/ui/summary-strip/SummaryStrip'
import { ViewTabs } from '@/components/ui/view-tabs/ViewTabs'
import { EmptyState } from '@/components/ui/empty-state/empty-state'
import { ErrorState } from '@/components/ui/error-state/error-state'
import { Skeleton } from '@/components/ui/skeleton/skeleton'
import { ROUTES } from '@/utilities/constants/routes'
import { useNow } from '@/utilities/hooks/useNow'
import { useSessionEnded } from '@/utilities/hooks/useSessionEnded'
import { formatUpdated } from '@/utilities/helpers/format'
import { getRecipientRequestStatus } from '@/utilities/helpers/request-status'
import { RequestItem } from '@/components/content/requests/your-requests/RequestItem'
import { errorStatus } from '@/utilities/helpers/apiErrors'
import { useMyRequests } from '@/services/requests'
import type { ListingRequest } from '@/models/api'

type RequestView = 'open' | 'history'

const newestFirst = (
  a: ListingRequest,
  b: ListingRequest,
) => Date.parse(b.createdAt) - Date.parse(a.createdAt)

function isSuccessfullyCollected(request: ListingRequest): boolean {
  return (
    request.status === 'APPROVED' &&
    request.listing.status === 'COLLECTED'
  )
}

// An approval whose handover was later reversed: nothing more will happen to it.
function wasReversed(request: ListingRequest): boolean {
  return (
    request.status === 'APPROVED' &&
    request.listing.status === 'REVERSED'
  )
}

function isOpenRequest(request: ListingRequest): boolean {
  const status = getRecipientRequestStatus(
    request.status,
    request.listing.status,
  )

  return (
    !isSuccessfullyCollected(request) &&
    !wasReversed(request) &&
    (status === 'PENDING' || status === 'APPROVED')
  )
}

function isHistoryRequest(request: ListingRequest): boolean {
  return !isOpenRequest(request)
}

function RequestList({ requests }: { requests: ListingRequest[] }) {
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

  // Approved and awaiting collection: part of the open requests, not counted again.
  const approvedToCollect = openRequests.filter(
    (request) => getRecipientRequestStatus(request.status, request.listing.status) === 'APPROVED',
  ).length

  return (
    <>
      {requests.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">
          {formatUpdated(requests.fulfilledTimeStamp, now)}
        </p>
      )}

      <SummaryStrip
        label="Your requests at a glance"
        figures={[
          { label: 'Open requests', value: openRequests.length, hint: 'Pending or approved', icon: <Inbox size={18} /> },
          { label: 'Approved', value: approvedToCollect, hint: 'Ready to collect', icon: <PackageCheck size={18} /> },
          { label: 'History', value: historyRequests.length, hint: 'Finished requests', icon: <History size={18} /> },
        ]}
      />

      <ViewTabs
        label="Your request views"
        tabs={[
          {
            id: 'open-requests-tab',
            panelId: 'open-requests-panel',
            label: 'Open Requests',
            count: openRequests.length,
            selected: activeView === 'open',
            onSelect: () => setActiveView('open'),
          },
          {
            id: 'request-history-tab',
            panelId: 'request-history-panel',
            label: 'Request History',
            count: historyRequests.length,
            selected: activeView === 'history',
            onSelect: () => setActiveView('history'),
          },
        ]}
      />

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
            <p className="rounded-3xl border border-border bg-surface p-5 text-sm text-text-muted shadow-card">
              No open requests right now. Your pending and approved requests will appear here.
            </p>
          )}
        </section>
      )}

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
            <p className="rounded-3xl border border-border bg-surface p-5 text-sm text-text-muted shadow-card">
              No request history yet. Collected, declined, cancelled and expired requests will appear here.
            </p>
          )}
        </section>
      )}
    </>
  )
}