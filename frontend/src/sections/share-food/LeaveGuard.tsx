// The unsaved-changes confirmation (spec S2): leaving Share food with changes asks "Leave
// without publishing? Your details will be lost." with Stay and Leave. Focus starts on
// Stay (danger tone). Closing or reloading the tab gets the browser's own warning.
import { useEffect } from 'react'
import { useBlocker } from 'react-router'
import { ConfirmDialog } from '@/components/ui/dialog'

type LeaveGuardProps = {
  // True while there are changes that would be lost.
  active: boolean
}

export function LeaveGuard({ active }: LeaveGuardProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => active && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!active) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset()
      }}
      title="Leave without publishing?"
      description="Your details will be lost."
      cancelLabel="Stay"
      confirmLabel="Leave"
      tone="danger"
      onConfirm={() => {
        if (blocker.state === 'blocked') blocker.proceed()
      }}
    />
  )
}
