
import type {
  BackendFoodRequest,
  BackendListingResponse,
  Listing,
  ListingRequest,
  ListingSummary,
} from '@/types/api'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

// Convert backend listing response into the frontend Listing type.
export function mapBackendListing(dto: BackendListingResponse): Listing {
  const rawState = asString(dto.status, 'AVAILABLE').toUpperCase()

  const status: Listing['status'] =
    rawState === 'REVERSED'
      ? 'AVAILABLE'
      : rawState === 'RESERVED' ||
          rawState === 'COLLECTED' ||
          rawState === 'EXPIRED'
        ? rawState
        : 'AVAILABLE'

  return {
    id: asString(dto.id),
    foodName: asString(dto.foodName, 'Untitled listing'),
    description: asString(dto.description),
    category: asString(dto.category),
    quantity: Number(dto.quantity ?? 0),
    unit: asString(dto.unit),
    pickupArea: asString(dto.pickupArea),
    deadline: asString(dto.collectionDeadline),
    photoUrl: dto.imageReference ?? null,
    status,
    donorId: asString(dto.donorId),
    donorName: asString(dto.donorName, 'Food donor'),
    createdAt: asString(dto.createdAt, new Date().toISOString()),
    pendingRequestCount: Number(dto.pendingRequestCount ?? 0),
  }
}

// Convert a full listing into the summary required by a food request.
export function toListingSummary(listing: Listing): ListingSummary {
  return {
    id: listing.id,
    foodName: listing.foodName,
    quantity: listing.quantity,
    unit: listing.unit,
    pickupArea: listing.pickupArea,
    deadline: listing.deadline,
    donorName: listing.donorName,
    status: listing.status,

    // Preserve the picture when creating the request summary.
    photoUrl: listing.photoUrl,
  }
}

type BackendRequestWithExtras = BackendFoodRequest & {
  note?: string | null
  recipientArea?: string
  listing?: Partial<ListingSummary> & {
    imageReference?: string | null
    collectionDeadline?: string
  }
}

// Convert the backend request into the frontend ListingRequest type.
export function mapBackendRequest(
  dto: BackendFoodRequest,
  listing?: Listing,
): ListingRequest {
  const extra = dto as BackendRequestWithExtras

  const summary: ListingSummary = listing
    ? toListingSummary(listing)
    : {
        id: dto.listingId,
        foodName: asString(extra.listing?.foodName, 'Food listing'),
        quantity: Number(extra.listing?.quantity ?? 0),
        unit: asString(extra.listing?.unit),
        pickupArea: asString(extra.listing?.pickupArea),
        deadline: asString(
          extra.listing?.deadline ??
          extra.listing?.collectionDeadline,
        ),
        donorName: asString(
          extra.listing?.donorName,
          'Food donor',
        ),
        status: extra.listing?.status ?? 'AVAILABLE',

        // Preserve an image if the backend includes a listing summary.
        photoUrl:
          extra.listing?.photoUrl ??
          extra.listing?.imageReference ??
          null,
      }

  const rawState = asString(dto.status, 'PENDING').toUpperCase()

  const status: ListingRequest['status'] = [
    'APPROVED',
    'DECLINED',
    'CANCELLED',
    'EXPIRED',
  ].includes(rawState)
    ? rawState as ListingRequest['status']
    : 'PENDING'

  return {
    id: asString(dto.id),
    listingId: asString(dto.listingId),
    listing: summary,
    recipientId: asString(dto.recipientId),
    recipientName: asString(
      dto.recipientName,
      'Community organisation',
    ),
    recipientArea: asString(extra.recipientArea),
    note: extra.note ?? null,
    status,
    createdAt: asString(
      dto.createdAt,
      new Date().toISOString(),
    ),
  }
}

// Extract a Cloudinary image URL from the upload response.
export function extractImageReference(payload: unknown): string {
  if (typeof payload === 'string' && isHttpUrl(payload)) {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('The upload service did not return an image URL.')
  }

  const record = payload as Record<string, unknown>

  const preferredKeys = [
    'imageReference',
    'imageUrl',
    'url',
    'secure_url',
    'secureUrl',
    'location',
  ]

  for (const key of preferredKeys) {
    const value = record[key]

    if (typeof value === 'string' && isHttpUrl(value)) {
      return value
    }
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'string' && isHttpUrl(value)) {
      return value
    }

    if (value && typeof value === 'object') {
      try {
        return extractImageReference(value)
      } catch {
        // Continue checking other properties.
      }
    }
  }

  throw new Error(
    'The upload response did not contain a usable image URL.',
  )
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
