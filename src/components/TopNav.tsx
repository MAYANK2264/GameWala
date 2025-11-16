import { NavLink } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const linkBase = 'touch-target inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400'
const linkActive = 'bg-neutral-200 text-neutral-900'
const linkInactive = 'text-neutral-700 hover:bg-neutral-100'

export function TopNav() {
  const { user, logout, role } = useAuth()
  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/repairs', label: 'Repairs' },
    { to: '/scan', label: 'Scan' },
    { to: '/sales', label: 'Sales' },
    { to: '/reports', label: 'Reports' },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 bg-white"
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
              {role === 'owner' && (
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `touch-target inline-flex items-center justify-center rounded-md p-2 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400 ${
                      isActive ? 'bg-neutral-200 text-neutral-900' : ''
                    }`
                  }
                  aria-label="Settings"
                  title="Settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </NavLink>
              )}
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
          {role === 'owner' && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                [
                  'touch-target inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition',
                  isActive ? 'bg-neutral-200 text-neutral-900' : 'bg-white text-neutral-700 hover:bg-neutral-100',
                ].join(' ')
              }
            >
              Settings
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}

export default TopNav
