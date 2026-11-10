// The language switcher: the shared Select with a globe, showing the current language in
// its own name. Choosing one only calls changeLanguage; the config saves it, sets
// <html lang> and every t() re-renders. It never reads the session, so it works signed out
// (landing, sign-in) and signed in (top bar, phone account menu).
// variant "dark" sits on dark green or the photo (landing header, sign-in); "light" on
// white (top bar, account menu). iconOnlyOnPhone: below 640px a square 40px globe button,
// so a phone header keeps one row; the language name stays in it for screen readers.
import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/ui/select/select'
import { LANGUAGES } from '@/utilities/constants/languages'
import { cn } from '@/utilities/helpers/cn'
import { isLanguage } from '@/utilities/helpers/language'

type LanguageSwitcherProps = {
  variant: 'dark' | 'light'
  iconOnlyOnPhone?: boolean
  className?: string
}

const OPTIONS = LANGUAGES.map((language) => ({ value: language.code, label: language.name }))

export function LanguageSwitcher({ variant, iconOnlyOnPhone = false, className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {/* Over the trigger's left padding; pointer-events-none lets a tap reach the trigger. */}
      <Globe
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2',
          variant === 'dark' ? 'text-on-dark-heading' : 'text-text-muted',
        )}
      />
      <Select
        aria-label={t('language.label')}
        options={OPTIONS}
        value={i18n.resolvedLanguage}
        onValueChange={(code) => {
          if (isLanguage(code)) void i18n.changeLanguage(code)
        }}
        className={cn(
          'w-auto pl-9',
          variant === 'dark' &&
            'border-outline-on-dark bg-transparent text-on-dark-heading [&>svg]:text-on-dark-label focus-visible:outline-focus-on-dark!',
          // The first span holds the language name: hidden visually, still read out.
          iconOnlyOnPhone && 'max-sm:w-10 max-sm:px-0 max-sm:[&>span:first-child]:sr-only max-sm:[&>svg]:hidden',
        )}
      />
    </div>
  )
}
