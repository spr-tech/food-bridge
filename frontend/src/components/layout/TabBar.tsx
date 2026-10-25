// The phone tab bar (below 768px): the sidebar's links, fixed to the bottom, with the
// current tab as a green pill. Coming-soon items aren't shown on phones.
import { NavLink } from 'react-router'
import { NavIcon } from '@/components/layout/NavIcons'
import type { NavCounts } from '@/components/layout/Sidebar'
import type { NavItem } from '@/constants/roles'

type TabBarProps = {
  items: NavItem[]
  counts: NavCounts
}

export function TabBar({ items, counts }: TabBarProps) {
  return (
    <nav aria-label="Main">
      <ul className="fb-tabbar">
        {items.map((item) => {
          const count = counts[item.to]
          return (
            <li key={item.to}>
              <NavLink to={item.to} end className="fb-tab">
                <NavIcon name={item.icon} size={22} />
                <span>
                  {item.label}
                  {count !== undefined && ` · ${count}`}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
