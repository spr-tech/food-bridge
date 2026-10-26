// The small icons beside a listing's details: quantity, pickup time and pickup area.
// Decorative; the text beside each one says the same.
import type { ReactNode } from 'react'

type IconProps = { size?: number }

function Icon({ size = 14, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="shrink-0">
      {children}
    </svg>
  )
}

export function QuantityIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </Icon>
  )
}

export function ClockIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  )
}

export function PinIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  )
}
