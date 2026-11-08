// The desktop sidebar (768px and up, spec section 12).
// It remains dark green permanently, with white navigation text.
// There is no flood animation or theme transition when navigating.
// The current link (activeNavItem) also covers the pages opened from it, such as a listing.
// Only pages that exist are listed: unfinished ideas are left out rather than shown disabled.
import { Link, useLocation } from 'react-router'
import { Logo } from '@/components/layout/Logo'
import { ArchMark, NavIcon } from '@/components/layout/NavIcons'
import { activeNavItem, type NavItem } from '@/utilities/constants/roles'

export type NavCounts = Partial<Record<string, number>>

type SidebarProps = {
  items: NavItem[]
  counts: NavCounts
}

export function Sidebar({ items, counts }: SidebarProps) {
  const active = activeNavItem(items, useLocation().pathname)

  return (
    <aside className="fb-side">
      <Logo variant="sidebar" />

      <nav aria-label="Main">
        <p className="fb-sect" aria-hidden="true">
          Menu
        </p>
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
                  <span className="fb-link__icon">
                    <NavIcon name={item.icon} />
                  </span>
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

      <div className="fb-tag">
        <span className="fb-tag__mark">
          <ArchMark />
        </span>
        <p className="fb-tag__title">Together we reduce food waste.</p>
      </div>
    </aside>
  )
}
