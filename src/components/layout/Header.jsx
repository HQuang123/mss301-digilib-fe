import { useEffect, useRef, useState } from 'react'
import { Bell, CircleUserRound, Compass, LogOut, Menu, Wallet } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authSlice'
import { Button } from '@/components/ui/button'
import useNotificationStore from '@/store/notificationSlice'

const POLL_INTERVAL_MS = 60_000

function formatNotificationTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Danh mục', to: '/books' },
  { label: 'Mượn sách', to: '/loans/request' },
  { label: 'Khoản mượn', to: '/loans' },
  { label: 'Giới thiệu', to: '/about' },
]

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const { items, unreadCount, fetchUnread, markAsRead } = useNotificationStore()

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchUnread])

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) fetchUnread()
      return !prev
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        aria-label="Thông báo"
        onClick={handleToggle}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Thông báo
          </p>
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">Không có thông báo mới.</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {items.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => markAsRead(notification.id)}
                    className="flex w-full flex-col gap-0.5 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                      {notification.status === 'UNREAD' && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      )}
                      {notification.subject}
                    </span>
                    {notification.body && (
                      <span className="line-clamp-2 text-xs text-slate-500">{notification.body}</span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function Header() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  const user = useAuthStore((s) => s.user)
  const roles = useAuthStore((s) => s.roles)
  const staffPortal = roles.includes('admin')
    ? { label: 'Quản trị', to: '/admin' }
    : roles.includes('librarian')
      ? { label: 'Trang thủ thư', to: '/librarian' }
      : null


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
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {staffPortal && (
                <NavLink to={staffPortal.to}>
                  <Button variant="outline" size="sm" className="rounded-full px-3">
                    {staffPortal.label}
                  </Button>
                </NavLink>
              )}
              <NotificationBell />
              <NavLink to="/fines">
                <Button variant="ghost" size="sm" className="rounded-full px-3" aria-label="Nộp phạt">
                  <Wallet size={16} />
                  Nộp phạt
                </Button>
              </NavLink>
              <NavLink to="/profile">
                <Button variant="secondary" size="sm" className="rounded-full px-3" aria-label="Tài khoản">
                  <CircleUserRound size={16} />
                  {user?.firstName || 'Tài khoản'}
                </Button>
              </NavLink>
            </div>
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
