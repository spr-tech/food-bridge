// The recipient's requests (spec S7): open ones (Pending and Approved) first, then
// past ones (Declined, Expired and Cancelled), newest first in each group. States:
// skeletons while loading; the error with Try again; an empty start that points to
// Find food; a 401 goes to sign in.
import { useEffect } from 'react'
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

const newestFirst = (a: ListingRequest, b: ListingRequest) => Date.parse(b.createdAt) - Date.parse(a.createdAt)

function Group({ title, requests }: { title: string; requests: ListingRequest[] }) {
  if (requests.length === 0) return null
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-xl">{title}</h2>
      <ul className="grid gap-3">
        {requests.map((request) => (
          <li key={request.id}>
            <RequestItem request={request} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function YourRequests() {
  const requests = useMyRequests()
  const navigate = useNavigate()
  const sessionEnded = useSessionEnded()
  const now = useNow()

  useEffect(() => {
    if (errorStatus(requests.error) === 401) void sessionEnded()
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
        action={{ label: 'Find food', onClick: () => void navigate(ROUTES.listings) }}
      />
    )
  }

  const open = all.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED').sort(newestFirst)
  const past = all.filter((r) => r.status !== 'PENDING' && r.status !== 'APPROVED').sort(newestFirst)

  return (
    <>
      {requests.fulfilledTimeStamp && (
        <p className="mb-4 text-[13px] text-text-muted">{formatUpdated(requests.fulfilledTimeStamp, now)}</p>
      )}
      <Group title="Open requests" requests={open} />
      <Group title="Past requests" requests={past} />
    </>
  )
}