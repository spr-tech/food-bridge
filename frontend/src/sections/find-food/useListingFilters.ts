// Find food's filters, kept in the page address (spec S3) so a filtered view survives a
// refresh and can be shared: ?q=rice&category=bakery&area=yaba&status=reserved.
// Status starts on Available, which is left out of the address; "All statuses" is
// status=all. Values that aren't real options are ignored. Other parameters (such as the
// dev-only ?simulate=) are left alone.
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { CATEGORIES, PICKUP_AREAS } from '@/constants/listingOptions'
import type { ListingStatus } from '@/types/status'

export type StatusFilter = 'available' | 'reserved' | 'collected' | 'expired' | 'all'

export const DEFAULT_STATUS: StatusFilter = 'available'

const STATUSES: StatusFilter[] = ['available', 'reserved', 'collected', 'expired', 'all']

type FilterKey = 'q' | 'category' | 'area' | 'status'

const isOption = (options: { value: string }[], value: string | null) =>
  value !== null && options.some((option) => option.value === value)

export function useListingFilters() {
  const [params, setParams] = useSearchParams()

  const raw = {
    q: params.get('q'),
    category: params.get('category'),
    area: params.get('area'),
    status: params.get('status'),
  }
  const q = raw.q?.trim() ?? ''
  const category = isOption(CATEGORIES, raw.category) ? (raw.category ?? undefined) : undefined
  const area = isOption(PICKUP_AREAS, raw.area) ? (raw.area ?? undefined) : undefined
  const status = STATUSES.includes(raw.status as StatusFilter) ? (raw.status as StatusFilter) : DEFAULT_STATUS

  const update = useCallback(
    (changes: Partial<Record<FilterKey, string | undefined>>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(changes)) {
            if (!value || (key === 'status' && value === DEFAULT_STATUS)) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const clearAll = useCallback(
    () => update({ q: undefined, category: undefined, area: undefined, status: undefined }),
    [update],
  )

  // The filters in FilterBar's slot that differ from their defaults (search is counted
  // by FilterBar itself).
  const activeCount = (category ? 1 : 0) + (area ? 1 : 0) + (status !== DEFAULT_STATUS ? 1 : 0)

  // What to ask the service for.
  const apiStatus: ListingStatus | 'all' = status === 'all' ? 'all' : (status.toUpperCase() as ListingStatus)
  const query = useMemo(() => ({ q, category, area, status: apiStatus }), [q, category, area, apiStatus])

  return {
    q,
    category,
    area,
    status,
    query,
    update,
    clearAll,
    activeCount,
    isFiltered: Boolean(q) || activeCount > 0,
  }
}
