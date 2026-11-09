// The mobile bottom navigation: permanently dark green,
// with white links and a lighter green active tab. Like the sidebar, the current tab
// (activeNavItem) also covers the pages opened from it.
import { Link, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { NavIcon } from '@/components/layouts/NavIcons'
import type { NavCounts } from '@/components/layouts/Sidebar'
import { activeNavItem, type NavItem } from '@/utilities/constants/roles'

type TabBarProps = {
  items: NavItem[]
  counts: NavCounts
}

export function TabBar({ items, counts }: TabBarProps) {
  const { t } = useTranslation()
  const active = activeNavItem(items, useLocation().pathname)

  return (
    <nav aria-label="Main">
      <ul className="fb-tabbar">
        {items.map((item) => {
          const count = counts[item.to]

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={item === active ? 'page' : undefined}
                className="fb-tab"
              >
                <NavIcon name={item.icon} size={22} />
                <span>
                  {t(item.labelKey)}
                  {count !== undefined && ` · ${count}`}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}