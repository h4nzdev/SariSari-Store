import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, ClipboardList, Store } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/new-sale', label: 'New Sale', icon: ShoppingCart },
  { to: '/sales', label: 'Sales History', icon: ClipboardList },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-orange-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col flex-shrink-0">
        <div className="bg-gradient-to-br from-orange-600 to-amber-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium">Tindahan ni</p>
              <h1 className="text-white font-bold text-xl leading-tight">Aling Nena</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 text-center text-xs text-gray-400 border-t border-gray-100">
          Sari-Sari Store Manager
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
