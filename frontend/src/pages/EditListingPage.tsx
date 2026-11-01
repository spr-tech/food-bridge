
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/app/session'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useSessionEnded } from '@/hooks/useSessionEnded'
import { listingDetailPath } from '@/constants/routes'
import { ShareFoodForm } from '@/sections/share-food/ShareFoodForm'
import { errorStatus } from '@/services/errors'
import { useListing } from '@/services/listings'

const TITLE = 'Edit listing'

function unavailableMessage(status: string): string {
  switch (status.toUpperCase()) {
    case 'RESERVED':
      return 'A recipient has reserved this food. You cannot edit the listing while it is reserved.'

    case 'COLLECTED':
      return 'This food has already been collected. The listing can no longer be edited.'

    case 'EXPIRED':
      return 'The collection deadline has passed. This listing can no longer be edited.'

    default:
      return 'Only available listings can be edited.'
  }
}

export function EditListingPage() {
  useDocumentTitle(TITLE)

  const { id } = useParams()
  const session = useSession()
  const sessionEnded = useSessionEnded()

  const listing = useListing(id ?? '', {
    skip: !id,
  })

  useEffect(() => {
    if (errorStatus(listing.error) === 401) {
      void sessionEnded()
    }
  }, [listing.error, sessionEnded])

  if (!id) {
    return (
      <PageContainer width="form">
        <PageHeader title={TITLE} />
        <p role="alert" className="text-sm text-danger">
          We couldn't find the listing you're trying to edit.
        </p>
      </PageContainer>
    )
  }

  if (listing.isLoading) {
    return (
      <PageContainer width="form">
        <PageHeader title={TITLE} />
        <Skeleton shape="card" />
      </PageContainer>
    )
  }

  if (listing.isError || !listing.data) {
    return (
      <PageContainer width="form">
        <PageHeader title={TITLE} />
        <ErrorState
          title="We couldn't load this listing."
          description="Check your connection and try again."
          onRetry={() => void listing.refetch()}
          retrying={listing.isFetching}
        />
      </PageContainer>
    )
  }

  const currentListing = listing.data

  const canEdit =
    session?.role === 'admin' ||
    (
      session?.role === 'donor' &&
      session.accountId === currentListing.donorId
    )

  if (!canEdit) {
    return (
      <PageContainer width="form">
        <PageHeader title={TITLE} />

        <div role="alert" className="flex flex-col gap-3">
          <p className="text-sm text-danger">
            You don't have permission to edit this listing.
            Only its owning donor or an administrator can edit it.
          </p>

          <Link
            to={listingDetailPath(currentListing.id)}
            className="text-sm font-semibold text-primary underline"
          >
            Back to listing
          </Link>
        </div>
      </PageContainer>
    )
  }

  const status = String(currentListing.status).toUpperCase()

  if (status !== 'AVAILABLE') {
    return (
      <PageContainer width="form">
        <PageHeader
          title={TITLE}
          description="This listing is no longer available for editing."
        />

        <div role="alert" className="flex flex-col gap-3">
          <p className="rounded-md border-2 border-danger px-4 py-3 text-sm font-medium text-danger">
            {unavailableMessage(status)}
          </p>

          <Link
            to={listingDetailPath(currentListing.id)}
            className="text-sm font-semibold text-primary underline"
          >
            Back to listing
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer width="form">
      <PageHeader
        title={TITLE}
        description="Update the food listing details below."
      />

      <ShareFoodForm listing={currentListing} />
    </PageContainer>
  )
}
