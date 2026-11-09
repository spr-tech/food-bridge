// Find food's search and pickup area filter, applied to listings already loaded. The live
// service's keyword search only looks at the food name and description, and its area
// filter only matches the exact stored text, so services/listings.ts applies these two
// here instead (spec S3: "Search by food name, donor or area").
import { CATEGORIES, optionLabel, PICKUP_AREAS } from '@/utilities/constants/listingOptions'
import type { Listing } from '@/models/entities/listing'

// Whether the search text appears in the food name, description, donor, area or category.
export function matchesListingSearch(listing: Listing, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  return [
    listing.foodName,
    listing.description,
    listing.donorName,
    optionLabel(PICKUP_AREAS, listing.pickupArea),
    optionLabel(CATEGORIES, listing.category),
  ].some((value) => value.toLowerCase().includes(needle))
}

// Whether the listing is in the pickup area (an option value such as "surulere").
// mapBackendListing has already turned "Surulere, Lagos - …" into "surulere".
export function matchesPickupArea(listing: Listing, area: string | undefined): boolean {
  return !area || listing.pickupArea === area
}
