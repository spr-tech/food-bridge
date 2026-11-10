// The phone account menu: the avatar is a button that opens a small panel with the
// organisation, the role, the language switcher and Sign out. A disclosure (button plus
// panel), not an ARIA menu: Tab moves through it, Escape or a tap outside closes it, and
// Escape returns focus to the avatar. The shared set has no menu; candidate to add there.
// The language list opens outside the panel (the Select draws it at the end of the page),
// so taps and Escape inside that list belong to the list and leave the panel open.
import { useEffect, useId, useRef, useState } from 'react'
import { LanguageSwitcher } from '@/components/layouts/LanguageSwitcher'
import { SignOutIcon } from '@/components/layouts/NavIcons'
import { initials } from '@/utilities/helpers/format'

// The event's target, not the focused element: by the time this panel hears the event,
// the list may already have closed and moved focus back to its trigger.
function inOptionList(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[role="listbox"]') !== null
}

type AccountMenuProps = {
  organisationName: string
  roleLabel: string
  onSignOut: () => void
}

export function AccountMenu({ organisationName, roleLabel, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inOptionList(event.target)) {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (inOptionList(event.target)) return
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="fb-avatar fb-avatar--small"
        aria-label={`Account, ${organisationName}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {initials(organisationName)}
      </button>

      {open && (
        <div id={panelId} className="fb-menu">
          <span className="fb-account__name">{organisationName}</span>
          <span className="fb-account__role">{roleLabel}</span>
          <LanguageSwitcher variant="light" className="mt-2" />
          <button type="button" className="fb-signout" onClick={onSignOut}>
            <SignOutIcon />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
