// The desktop sidebar (768px and up, spec section 12).
// It remains dark green permanently, with white navigation text.
// There is no flood animation or theme transition when navigating.
import { useId } from 'react'
import { NavLink } from 'react-router'
import { Logo } from '@/components/layout/Logo'
import { ArchMark, NavIcon } from '@/components/layout/NavIcons'
import { COMING_SOON, type NavItem } from '@/constants/roles'

export type NavCounts = Partial<Record<string, number>>

type SidebarProps = {
  items: NavItem[]
  counts: NavCounts
}

export function Sidebar({ items, counts }: SidebarProps) {
  const comingSoonId = useId()

  return (
    <aside className="fb-side">
      <Logo variant="sidebar" />

      <nav aria-label="Main">
        <ul className="fb-nav">
          {items.map((item) => {
            const count = counts[item.to]

            return (
              <li key={item.to}>
                <NavLink to={item.to} end className="fb-link">
                  <NavIcon name={item.icon} />
                  {item.label}

                  {count !== undefined && (
                    <span className="fb-count">
                      <span aria-hidden="true">{count}</span>
                      <span className="sr-only">, {count} pending</span>
                    </span>
                  )}
                </NavLink>
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