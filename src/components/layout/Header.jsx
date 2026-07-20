import { Bell, CircleUserRound, Compass, Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Danh mục', to: '/books' },
  { label: 'Khoản mượn', to: '/loans' },
  { label: 'Giới thiệu', to: '/about' },
]

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-950 text-amber-300 shadow-sm">
            <Compass size={17} />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight text-slate-950">Readora</span>
            <span className="block text-[9px] uppercase tracking-[0.2em] text-slate-400">Digital library</span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1.5 rounded-full bg-white/80 p-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          {isLoggedIn ? (
            <>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Thông báo">
                <Bell size={16} />
              </Button>
              <NavLink to="/profile">
                <Button variant="secondary" size="sm" className="rounded-full px-3" aria-label="Tài khoản">
                  <CircleUserRound size={16} />
                  {user?.firstName || 'Tài khoản'}
                </Button>
              </NavLink>
              {roles.includes('admin') && (
                <NavLink to="/admin">
                  <Button variant="outline" size="sm" className="rounded-full px-3">
                    Admin
                  </Button>
                </NavLink>
              )}
              {roles.includes('librarian') && !roles.includes('admin') && (
                <NavLink to="/librarian">
                  <Button variant="outline" size="sm" className="rounded-full px-3">
                    Librarian
                  </Button>
                </NavLink>
              )}
              <Button variant="ghost" size="sm" className="rounded-full px-3 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
                <LogOut size={14} />
                Đăng xuất
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/login">
                <Button variant="ghost" size="sm" className="rounded-full px-4 text-slate-600 hover:text-slate-950">
                  Đăng nhập
                </Button>
              </NavLink>
              <NavLink to="/register">
                <Button variant="default" size="sm" className="rounded-full px-4">
                  Đăng ký
                </Button>
              </NavLink>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Mở menu">
            <Menu size={18} />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header
