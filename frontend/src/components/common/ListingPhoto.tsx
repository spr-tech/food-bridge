// A listing's photo, or the placeholder the spec asks for when there is none (S3, S4).
// Decorative: the food name next to it already says what it shows. The caller sets the
// size and corners through className.
import { cn } from '@/lib/cn'

type ListingPhotoProps = {
  photoUrl: string | null
  className?: string
  // The placeholder's picture icon, in pixels.
  iconSize?: number
}

export function ListingPhoto({ photoUrl, className, iconSize = 26 }: ListingPhotoProps) {
  if (photoUrl) return <img src={photoUrl} alt="" className={cn(className, 'object-cover')} />
  return (
    <div aria-hidden="true" className={cn(className, 'flex items-center justify-center bg-surface-hover text-text-muted')}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" focusable="false">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 16-5-5-9 9" />
      </svg>
    </div>
  )
}
