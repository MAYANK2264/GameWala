import { NavLink } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const linkBase = 'px-3 py-2 rounded-md text-sm font-medium hover:bg-neutral-100'
const linkActive = 'bg-neutral-200 text-neutral-900'
const linkInactive = 'text-neutral-700'

export function TopNav() {
  const { logout } = useAuth()
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
    <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container-px">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <NavLink to="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <img src="/assets/GAME-WALA-FLAT.png" alt="GameWala Logo" className="h-8 w-8 object-contain"/>
              <span className="align-middle">GameWala</span>
            </NavLink>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => [
                    linkBase,
                    isActive ? linkActive : linkInactive,
                  ].join(' ')}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium bg-neutral-900 text-white hover:opacity-90">
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="md:hidden border-t border-neutral-200">
        <div className="container-px py-2 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => [
                'px-2 py-1 rounded text-sm',
                isActive ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-700 hover:bg-neutral-100',
              ].join(' ')}
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


