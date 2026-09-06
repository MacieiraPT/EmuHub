import type { ReactElement } from 'react'
import { NavLink } from 'react-router-dom'
import { useLibrary } from '../state/LibraryContext'
import { GridIcon, HomeIcon, SettingsIcon } from './icons'
import { BrandMark } from './TitleBar'

interface NavItem {
  to: string
  label: string
  icon: ReactElement
  end?: boolean
  shortcut?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: <HomeIcon size={19} />, end: true },
  { to: '/consoles', label: 'Consoles', icon: <GridIcon size={19} /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon size={19} />, shortcut: 'Ctrl ,' }
]

export function Sidebar() {
  const { entries } = useLibrary()

  return (
    <nav className="sidebar" aria-label="Main">
      <div className="sidebar__brand">
        <BrandMark size={26} />
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">EmuHub</span>
          <span className="sidebar__brand-tag">Emulator library</span>
        </div>
      </div>

      <ul className="sidebar__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
              {item.to === '/consoles' && entries.length > 0 ? (
                <span className="sidebar__count">{entries.length}</span>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebar__footer">
        <p className="sidebar__note">
          EmuHub launches emulators already installed on this PC. It never downloads or bundles them.
        </p>
      </div>
    </nav>
  )
}
