// The one container every signed-in page sits in (spec section 12): the page's heading and
// content, up to the page's max width and centred in the content area, so wide screens
// don't leave it hugging the left. Phones are narrower than every width, so it fills them.
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const MAX_WIDTH = {
  details: 'max-w-200', // 800px: Listing details
  form: 'max-w-215', // 860px: Share food
  wide: 'max-w-270', // 1080px: Find food and lists
} as const

export type PageWidth = keyof typeof MAX_WIDTH

export function PageContainer({ width = 'wide', children }: { width?: PageWidth; children: ReactNode }) {
  return (
    <div data-page-width={width} className={cn('mx-auto w-full', MAX_WIDTH[width])}>
      {children}
    </div>
  )
}
