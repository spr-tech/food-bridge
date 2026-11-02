// The desktop sidebar (768px and up, spec section 12).
// It remains dark green permanently, with white navigation text.
// There is no flood animation or theme transition when navigating.
// The current link (activeNavItem) also covers the pages opened from it, such as a listing.
import { useId } from 'react'
import { Link, useLocation } from 'react-router'
import { Logo } from '@/components/layout/Logo'
import { ArchMark, NavIcon } from '@/components/layout/NavIcons'
import { activeNavItem, COMING_SOON, type NavItem } from '@/constants/roles'

export type NavCounts = Partial<Record<string, number>>

type SidebarProps = {
  items: NavItem[]
  counts: NavCounts
}

export function Sidebar({ items, counts }: SidebarProps) {
  const comingSoonId = useId()
  const active = activeNavItem(items, useLocation().pathname)

  return (
    <aside className="fb-side">
      <Logo variant="sidebar" />

      <nav aria-label="Main">
        <ul className="fb-nav">
          {items.map((item) => {
            const count = counts[item.to]

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={item === active ? 'page' : undefined}
                  className="fb-link"
                >
                  <NavIcon name={item.icon} />
                  {item.label}

                  {count !== undefined && (
                    <span className="fb-count">
                      <span aria-hidden="true">{count}</span>
                      <span className="sr-only">, {count} pending</span>
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Not links and not focusable: shown so people know what's planned. */}
      <p id={comingSoonId} className="fb-sect">
        Coming soon
      </p>

      <ul className="fb-nav" aria-labelledby={comingSoonId}>
        {COMING_SOON.map((item) => (
          <li key={item.label}>
            <div className="fb-later" aria-disabled="true" title="Coming soon">
              <NavIcon name={item.icon} />
              {item.label}
              <span className="fb-soon">Soon</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="fb-tag">
        <ArchMark />
        <span>
          Together we
          <br />
          reduce food waste.
        </span>
      </div>
    </aside>
  )
}