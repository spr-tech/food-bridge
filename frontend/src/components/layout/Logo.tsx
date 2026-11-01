// FoodBridge logo: uses the dark icon on the green sidebar
// and sign-in panel, and the light icon on the cream phone bar.
import iconDark from '@/assets/logo-icon-dark.svg'
import iconLight from '@/assets/logo-icon-light.svg'
import { cn } from '@/lib/cn'

type LogoProps = {
  variant: 'sidebar' | 'cream' | 'dark'
  size?: 'lg' | 'md'
  className?: string
}

export function Logo({ variant, size, className }: LogoProps) {
  const icon = variant === 'cream' ? iconLight : iconDark

  return (
    <span
      className={cn(
        'fb-logo',
        `fb-logo--${variant}`,
        size && `fb-logo--${size}`,
        className,
      )}
    >
      <span className="fb-logo__icon" aria-hidden="true">
        <img src={icon} alt="" className="fb-logo__img" />
      </span>

      <span className="fb-logo__word">
        <span className="fb-logo__food">Food</span>
        <span className="fb-logo__bridge">Bridge</span>
      </span>
    </span>
  )
}