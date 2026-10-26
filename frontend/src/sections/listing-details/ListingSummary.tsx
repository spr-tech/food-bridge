// The listing itself, the same for every viewer (spec S4, 4-recipient-listing-details and
// m4): the photo or placeholder (260px high, 200px on a phone), the food name as the page's
// h1 with its status badge, "category · donor", then quantity, pickup time and area (one
// row on desktop with the day under the time; a list on a phone), when it was listed, the
// description and the category chip. The action (S4) or nothing follows, from the caller.
import { ListingPhoto } from '@/components/common/ListingPhoto'
import { ClockIcon, PinIcon, QuantityIcon } from '@/components/common/MetaIcons'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CATEGORIES, optionLabel, PICKUP_AREAS } from '@/constants/listingOptions'
import { formatDay, formatListed, formatListingQuantity, formatTime } from '@/lib/format'
import type { Listing } from '@/types/api'

// "Pickup by 7:00 PM today" on a phone, as in m4; "on Mon 26 Oct" further out.
function phoneDay(day: string): string {
  return ['Today', 'Tomorrow', 'Yesterday'].includes(day) ? day.toLowerCase() : `on ${day}`
}

const SUBHEADING = 'font-sans text-[15px] font-bold'

export function ListingSummary({ listing }: { listing: Listing }) {
  const time = `Pickup by ${formatTime(new Date(listing.deadline))}`
  const day = formatDay(listing.deadline)
  const category = optionLabel(CATEGORIES, listing.category)

  return (
    <>
      <ListingPhoto photoUrl={listing.photoUrl} iconSize={48} className="h-50 w-full rounded-[14px] md:h-65 md:rounded-xl" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 md:mt-5">
        <h1 className="min-w-0 text-[26px] leading-[1.08] tracking-[-0.015em] wrap-break-word md:text-[32px]">
          {listing.foodName}
        </h1>
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <p className="mt-1 mb-3.5 text-text-muted md:mb-4.5">
        {category} · {listing.donorName}
      </p>

      <ul className="mb-4.5 grid gap-2 text-text-body md:mb-5.5 md:flex md:gap-7.5">
        <li className="flex items-center gap-2">
          <QuantityIcon size={17} />
          {formatListingQuantity(listing)}
        </li>
        <li className="flex items-center gap-2 md:items-start">
          <ClockIcon size={17} />
          <span className="md:hidden">
            {time} {phoneDay(day)}
          </span>
          <span className="hidden md:block">
            {time}
            <span className="block text-xs text-text-muted">{day}</span>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <PinIcon size={17} />
          {optionLabel(PICKUP_AREAS, listing.pickupArea)}, Lagos
        </li>
      </ul>
      <p className="-mt-2 mb-4.5 text-[13px] text-text-muted md:-mt-3">{formatListed(listing.createdAt)}</p>

      {listing.description && (
        <>
          <h2 className={`mb-1.5 ${SUBHEADING}`}>Description</h2>
          <p className="mb-4 text-[14.5px] leading-[1.6] wrap-break-word text-text-body md:mb-4.5 md:text-[15px] md:leading-[1.65]">
            {listing.description}
          </p>
        </>
      )}

      <h2 className={`mb-2 ${SUBHEADING}`}>Food category</h2>
      <p className="mb-5 md:mb-6">
        <span className="inline-flex rounded-full bg-chip-bg px-2.75 py-1.25 text-xs font-bold text-chip-text">{category}</span>
      </p>
    </>
  )
}
