import { useState } from 'react'
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Grid2X2,
  History,
  LogOut,
  PanelTop,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authSlice'

const bookLinks = [
  { key: 'catalog', label: 'Thông tin sách', to: '/librarian/books' },
  { key: 'inventory', label: 'Kho sách', to: '/librarian/inventory' },
  { key: 'digital', label: 'Sách điện tử', to: '/librarian/digital-books' },
  { key: 'genres', label: 'Danh mục thể loại', to: '/librarian/genres' },
  { key: 'classifications', label: 'Phân loại sách', to: '/librarian/classifications' },
]

const loanLinks = [
  { key: 'borrow-requests', label: 'Yêu cầu mượn', to: '/librarian/borrow-requests' },
  { key: 'loans', label: 'Phiếu mượn', to: '/librarian/loans' },
  { key: 'loan-returns', label: 'Trả sách', to: '/librarian/loans/returns' },
  { key: 'loan-history', label: 'Lịch sử mượn', to: '/librarian/loans/history' },
]

const reservationLinks = ['Danh sách đặt trước', 'Hàng đợi']

function SidebarSubLink({ item, active }) {
  return (
    <Link
      to={item.to}
      className={`block rounded-2xl px-3 py-2 text-[13px] transition ${
        active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/8 hover:text-white'
      }`}
    >
      {item.label}
    </Link>
  )
}

function SidebarGroup({ icon: Icon, label, children, open, onToggle }) {
  return (
    <div className="space-y-1.5">
      <button
        onClick={onToggle}
        className="flex h-9 w-full items-center gap-3 rounded-2xl px-3.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-white/8"
      >
        <Icon size={16} />
        <span className="flex-1">{label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-1 px-3 pb-1 pl-10">{children}</div>}
    </div>
  )
}

function MainLink({ icon: Icon, label, to, active }) {
  const className = `flex h-9 items-center gap-3 rounded-2xl px-3.5 text-[13px] font-medium transition ${
    active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-100 hover:bg-white/8 hover:text-white'
  }`

  return (
    <Link to={to} className={className}>
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  )
}

function LibrarianFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-[13px] text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span>© 2026 Readora Library System</span>
          <span className="hidden h-4 w-px bg-slate-300 sm:block" />
          <span>Version 2.5.0</span>
          <span className="hidden h-4 w-px bg-slate-300 sm:block" />
          <span>Academic Edition</span>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          <a href="#support">Hỗ trợ</a>
          <a href="#privacy">Quyền riêng tư</a>
          <a href="#api">Tài liệu API</a>
        </div>
      </div>
    </footer>
  )
}

function LibrarianLayout({ active = 'dashboard', title, description, action, children }) {
  const { user } = useAuthStore()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Librarian' : 'Librarian'
  const initials = (user?.firstName?.[0] || 'L').toUpperCase() + (user?.lastName?.[0] || '').toUpperCase()

  const isBookSectionActive = bookLinks.some((item) => item.key === active)
  const isLoanSectionActive = loanLinks.some((item) => item.key === active)
  const [openGroups, setOpenGroups] = useState({
    books: isBookSectionActive,
    loans: isLoanSectionActive,
    reservations: false,
  })

  function toggleGroup(key) {
    setOpenGroups((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  async function handleLogout() {
    await logout()
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fcfbf7,#f8fafc_42%,#eef4fb)] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-white/10 bg-[#0b2441] px-3 py-4 text-slate-100 lg:flex lg:flex-col">
        <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-white">Readora</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">Librarian panel</p>
        </div>

        <nav className="mt-5 flex-1 space-y-1.5">
          <MainLink icon={Grid2X2} label="Dashboard" to="/librarian" active={active === 'dashboard'} />
          <SidebarGroup icon={BookOpen} label="Quản lý sách" open={openGroups.books} onToggle={() => toggleGroup('books')}>
            {bookLinks.map((item) => (
              <SidebarSubLink key={item.key} item={item} active={active === item.key} />
            ))}
          </SidebarGroup>
          <SidebarGroup icon={ClipboardList} label="Quản lý mượn trả" open={openGroups.loans} onToggle={() => toggleGroup('loans')}>
            {loanLinks.map((item) => (
              <SidebarSubLink key={item.key} item={item} active={active === item.key} />
            ))}
          </SidebarGroup>
          <SidebarGroup icon={PanelTop} label="Quản lý đặt trước" open={openGroups.reservations} onToggle={() => toggleGroup('reservations')}>
            {reservationLinks.map((label) => (
              <a key={label} href="#reservations" className="block rounded-2xl px-3 py-2 text-[13px] text-slate-300 transition hover:bg-white/8 hover:text-white">
                {label}
              </a>
            ))}
          </SidebarGroup>
          <MainLink icon={UsersRound} label="Người dùng" to="/librarian/members" active={active === 'users'} />
          <MainLink icon={Wallet} label="Phạt" to="/librarian/fines" active={active === 'fines'} />
          <MainLink icon={BarChart3} label="Báo cáo" to="/librarian/reports" active={active === 'reports'} />
          <MainLink icon={History} label="Nhật ký" to="/librarian/logs" active={active === 'logs'} />
        </nav>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-3">
          <Link to="/profile" className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/8">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-700 text-xs font-bold text-white">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-sky-300">Tài khoản</span>
              <span className="block truncate text-sm font-semibold text-white">{displayName}</span>
            </span>
            <ChevronRight size={15} className="text-slate-400" />
          </Link>
          <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:text-white">
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-56">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/82 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-end px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1.5">
              <button className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Thông báo">
                <Bell size={16} />
              </button>
              <button className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Trợ giúp">
                <CircleHelp size={16} />
              </button>
              <div className="ml-2 flex items-center gap-2.5 border-l border-slate-200 pl-4">
                <span className="text-[13px] font-semibold text-slate-800">{displayName}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                  {initials}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[13px] text-slate-500">Trang chủ / {title}</p>
                <h1 className="mt-2 font-serif text-[30px] font-semibold tracking-tight text-slate-950">{title}</h1>
                {description && <p className="mt-2 max-w-3xl text-[14px] leading-6 text-slate-600">{description}</p>}
              </div>
              {action}
            </div>
            <div className="pt-6">{children}</div>
          </div>
        </main>

        <LibrarianFooter />
      </div>
    </div>
  )
}

export default LibrarianLayout
