// The FoodBridge logo: the icon plus the wordmark as real text in DM Sans 700 (never the
// full logo SVG, which can't load web fonts). Its colours follow the sidebar state
// through classes in styles/layout.css: the dark icon fades to the light one, "Bridge"
// changes colour and "Food" fills green from the bottom up during the flood.
import iconDark from '@/assets/logo-icon-dark.svg'
import iconLight from '@/assets/logo-icon-light.svg'
import { cn } from '@/lib/cn'

type LogoProps = {
  // "sidebar" follows the flood; "cream" is always the light version (phone top bar);
  // "dark" is always the dark version (the sign-in panel).
  variant: 'sidebar' | 'cream' | 'dark'
  // Sign-in sizes: "lg" (icon 48px, wordmark 28px) and "md" (32px, 21px).
  size?: 'lg' | 'md'
  className?: string
}

export function Logo({ variant, size, className }: LogoProps) {
  return (
    <span className={cn('fb-logo', `fb-logo--${variant}`, size && `fb-logo--${size}`, className)}>
      <span className="fb-logo__icon" aria-hidden="true">
        {variant !== 'dark' && <img src={iconLight} alt="" className="fb-logo__img" />}
        {variant !== 'cream' && <img src={iconDark} alt="" className="fb-logo__img fb-logo__img--dark" />}
      </span>
      <span className="fb-logo__word">
        <span className="fb-logo__food">Food</span>
        <span className="fb-logo__bridge">Bridge</span>
      </span>
    </span>
  )
}
