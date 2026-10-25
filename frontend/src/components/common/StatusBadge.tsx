// A status shown as a word, on the shared StatusBadge. Always the word, never colour alone.
// Each status maps to a shared tone; the badge's colours are then set to the spec
// section 12 pair by overriding, on this one element, the variables that tone reads.
// That keeps the copied component untouched and the global role colours strong.
import type { CSSProperties } from 'react'
import { StatusBadge as SharedStatusBadge } from '@/components/ui/status-badge'
import { LISTING_STATUS, REQUEST_STATUS } from '@/constants/status'
import type { ListingStatus, RequestStatus, StatusTone } from '@/types/status'

// kind is needed because EXPIRED is both a request and a listing status.
type StatusBadgeProps =
  | { kind: 'request'; status: RequestStatus; className?: string }
  | { kind: 'listing'; status: ListingStatus; className?: string }

type BadgeColours = 'available' | 'reserved' | 'pending' | 'expired'

// The variables each shared tone reads for its background, text and border.
// info reads the primary pair today and --color-info once the shared repo's
// complete-tokens change lands, so both are set.
function toneVariables(tone: StatusTone, colours: BadgeColours): CSSProperties {
  const bg = `var(--color-status-${colours}-bg)`
  const text = `var(--color-status-${colours}-text)`
  const vars: Record<StatusTone, Record<string, string>> = {
    success: { '--color-success': bg, '--color-on-success': text },
    warning: { '--color-warning': bg, '--color-on-warning': text },
    info: {
      '--color-primary': bg,
      '--color-on-primary': text,
      '--color-info': bg,
      '--color-on-info': text,
    },
    // neutral also draws a border; matching it to the background hides it, as designed.
    neutral: { '--color-surface': bg, '--color-text': text, '--color-border-input': bg },
  }
  return vars[tone] as CSSProperties
}

const COLOURS: Record<string, BadgeColours> = {
  'request:PENDING': 'pending',
  'request:APPROVED': 'available',
  'request:DECLINED': 'expired',
  'request:EXPIRED': 'expired',
  'listing:AVAILABLE': 'available',
  'listing:RESERVED': 'reserved',
  'listing:COLLECTED': 'expired',
  'listing:EXPIRED': 'expired',
}

export function StatusBadge(props: StatusBadgeProps) {
  const { label, tone } =
    props.kind === 'request' ? REQUEST_STATUS[props.status] : LISTING_STATUS[props.status]
  const colours = COLOURS[`${props.kind}:${props.status}`]

  return (
    <SharedStatusBadge
      tone={tone}
      className={props.className}
      style={toneVariables(tone, colours)}
      data-status={props.status.toLowerCase()}
    >
      {label}
    </SharedStatusBadge>
  )
}
