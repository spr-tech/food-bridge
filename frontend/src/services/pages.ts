// Reading a paged list endpoint (GET /api/listings, GET /api/admin/requests) more than
// one page at a time. The service answers 400 INVALID_PAGE for a limit above 100, so a
// longer list is read 100 rows at a time, using X-Total-Count to stop.
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query'

// The most rows the service returns in one call.
export const SERVICE_PAGE_LIMIT = 100
// A guard against a service that never reports its last page.
const MAX_PAGES = 50

// The baseQuery a queryFn receives.
export type BaseQuery = (
  arg: string | FetchArgs,
) => ReturnType<BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, object, FetchBaseQueryMeta>>

type Params = Record<string, string | number | boolean>

// Up to maxRows rows (every row when it's left out), in pages of at most 100. total is
// X-Total-Count when the service sends it, otherwise the number of rows read.
export async function readPages<Row>(
  baseQuery: BaseQuery,
  url: string,
  params: Params = {},
  maxRows = Infinity,
): Promise<{ data: { rows: Row[]; total: number } } | { error: FetchBaseQueryError }> {
  const rows: Row[] = []
  let total = NaN

  for (let page = 0; page < MAX_PAGES && rows.length < maxRows; page += 1) {
    const pageSize = Math.min(SERVICE_PAGE_LIMIT, maxRows - rows.length)
    const result = await baseQuery({
      url,
      params: { ...params, offset: rows.length, limit: pageSize },
    })
    if (result.error) return { error: result.error }

    const pageRows = Array.isArray(result.data) ? (result.data as Row[]) : []
    rows.push(...pageRows)

    total = Number(result.meta?.response?.headers.get('x-total-count') ?? NaN)
    if (pageRows.length < pageSize || (Number.isFinite(total) && rows.length >= total)) break
  }

  return { data: { rows, total: Number.isFinite(total) ? total : rows.length } }
}

// Every row of a list endpoint.
export async function readAllPages<Row>(
  baseQuery: BaseQuery,
  url: string,
  params: Params = {},
): Promise<{ data: Row[] } | { error: FetchBaseQueryError }> {
  const result = await readPages<Row>(baseQuery, url, params)
  return 'error' in result ? result : { data: result.data.rows }
}
