// Loading pattern (spec section 4): skeletons in a region marked aria-busy, plus a
// start-up note after 8 seconds because the free host can take a minute to wake.
import { useEffect, useState, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const SLOW_AFTER_MS = 8000

type LoadingStateProps = {
  // Read by screen readers, e.g. "Loading listings".
  label: string
  // Skeleton shapes that match the content. Defaults to three rows.
  children?: ReactNode
}

export function LoadingState({ label, children }: LoadingStateProps) {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsSlow(true), SLOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {children ?? (
        <>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </>
      )}
      <p role="status" className="text-sm text-text-muted">
        {isSlow && 'FoodBridge is starting up. This can take up to a minute.'}
      </p>
    </div>
  )
}
