// A status shown as a word with a tone colour. Always the word, never colour alone.
import { Badge } from '@/components/ui/badge'
import { LISTING_STATUS, REQUEST_STATUS } from '@/constants/status'
import { cn } from '@/lib/utils'
import type { ListingStatus, RequestStatus, StatusTone } from '@/types/status'

// kind is needed because EXPIRED is both a request and a listing status.
type StatusBadgeProps =
  | { kind: 'request'; status: RequestStatus; className?: string }
  | { kind: 'listing'; status: ListingStatus; className?: string }

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  info: 'bg-info-bg text-info',
  neutral: 'bg-neutral-bg text-neutral',
}

export function StatusBadge(props: StatusBadgeProps) {
  const { label, tone } =
    props.kind === 'request' ? REQUEST_STATUS[props.status] : LISTING_STATUS[props.status]

  return (
    <Badge className={cn('gap-1.5 px-2.5', TONE_CLASSES[tone], props.className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
