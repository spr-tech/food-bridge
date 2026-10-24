// A thin bar at the top while the next page loads. Purely visual, so hidden from
// screen readers; with reduced motion it appears without animating.
import { useNavigation } from 'react-router'
import { cn } from '@/lib/utils'

export function NavProgress() {
  const isLoading = useNavigation().state === 'loading'

  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary transition-[transform,opacity] ease-out motion-reduce:transition-none',
        // Grows most of the way while loading, never claiming to be finished.
        isLoading ? 'scale-x-75 opacity-100 duration-[2000ms]' : 'scale-x-0 opacity-0 duration-200',
      )}
    />
  )
}
