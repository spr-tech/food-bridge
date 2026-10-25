// The navigation, account and footer icons, copied exactly from the design files
// (docs/design/foodbridge-final/source-html/). All are decorative: the link or button
// next to them carries the words.
import type { ReactNode, SVGProps } from 'react'

export type NavIconName =
  | 'search'
  | 'requests-list'
  | 'home'
  | 'share'
  | 'inbox'
  | 'calendar'
  | 'impact'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

const PATHS: Record<NavIconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  'requests-list': (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  share: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  inbox: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 13h5l2 3h4l2-3h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  impact: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 17c0-6 4-10 10-10 0 6-4 10-10 10z" />
      <path d="M7 17 13 11" />
    </>
  ),
}

export function NavIcon({ name, size }: { name: NavIconName; size?: number }) {
  return <Icon size={size}>{PATHS[name]}</Icon>
}

export function SignOutIcon() {
  return (
    <Icon size={16}>
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />
    </Icon>
  )
}

// The arch mark in the sidebar footer.
export function ArchMark() {
  return (
    <svg
      width="34"
      height="30"
      viewBox="0 0 34 30"
      fill="none"
      stroke="var(--color-count)"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path d="M2 28 C2 12 10 4 17 4 C24 4 32 12 32 28" />
      <path d="M7 28 C7 16 12 10 17 10 C22 10 27 16 27 28" />
      <path d="M2 28 H32" />
      <path d="M12 28 V20 M17 28 V16 M22 28 V20" />
    </svg>
  )
}
