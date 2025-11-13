import { NavLink } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const linkBase = 'touch-target inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400'
const linkActive = 'bg-neutral-200 text-neutral-900'
const linkInactive = 'text-neutral-700 hover:bg-neutral-100'

export function TopNav() {
  const { user, logout } = useAuth()
  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/repairs', label: 'Repairs' },
    { to: '/scan', label: 'Scan' },
    { to: '/sales', label: 'Sales' },
    { to: '/reports', label: 'Reports' },
    { to: '/settings', label: 'Settings' },
  ]

  return (
    <nav
      className="sticky top-0 z-50 border-b border-neutral-200 bg-white"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-px">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <NavLink
              to="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
            >
              <img src="/assets/GAME-WALA-FLAT.png" alt="GameWala Logo" className="h-9 w-9 object-contain" />
              <span className="align-middle">GameWala</span>
            </NavLink>
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => [linkBase, isActive ? linkActive : linkInactive].join(' ')}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={logout}
                className="touch-target inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-neutral-200 md:hidden">
        <div className="container-px flex flex-wrap gap-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'touch-target inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition',
                  isActive ? 'bg-neutral-200 text-neutral-900' : 'bg-white text-neutral-700 hover:bg-neutral-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default TopNav
