import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookCheck,
  BookOpen,
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react'
import { getLoansByMember, renewLoan } from '@/api/loanApi'
import { getBooks } from '@/api/bookApi'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import useAuthStore from '@/store/authSlice'
import { createBookNameMap } from '@/utils/book'
import { Link } from 'react-router-dom'

const STATUS_META = {
  BORROWED: { label: 'Đang mượn', classes: 'bg-blue-50 text-blue-700 ring-blue-600/10' },
  OVERDUE: { label: 'Quá hạn', classes: 'bg-red-50 text-red-700 ring-red-600/10' },
  RETURNED: { label: 'Đã trả', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
  LOST: { label: 'Đã mất', classes: 'bg-amber-50 text-amber-700 ring-amber-600/10' },
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || 'Không rõ', classes: 'bg-slate-100 text-slate-700 ring-slate-500/10' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${meta.classes}`}>{meta.label}</span>
}

function SummaryCard({ icon: Icon, label, value, classes }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${classes}`}><Icon size={18} /></span>
        <div><p className="text-[12px] font-medium text-slate-500">{label}</p><p className="mt-0.5 text-xl font-semibold text-slate-950">{value}</p></div>
      </div>
    </div>
  )
}

function LoanHistory() {
  const user = useAuthStore((state) => state.user)
  const [loans, setLoans] = useState([])
  const [bookNames, setBookNames] = useState(() => new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [busyLoanId, setBusyLoanId] = useState(null)
  const memberId = user?.id || user?.memberCode

  const loadLoans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [loanResponse, booksResponse] = await Promise.all([
        memberId ? getLoansByMember() : Promise.resolve({ data: [] }),
        getBooks({ page: 0, size: 500, sort: 'title,asc' }).catch(() => null),
      ])
      setLoans(Array.isArray(loanResponse.data) ? loanResponse.data : [])
      if (booksResponse) setBookNames(createBookNameMap(booksResponse.data))
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể tải lịch sử mượn sách. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    // The request owns the loading state after the member profile becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLoans()
  }, [loadLoans])
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  const filteredLoans = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return loans.filter((loan) => {
      const matchesStatus = statusFilter === 'ALL' || loan.status === statusFilter
      const bookName = bookNames.get(String(loan.bookId)) || ''
      const matchesQuery = !normalized || [loan.loanId, bookName, loan.copyId]
        .some((value) => String(value ?? '').toLowerCase().includes(normalized))
      return matchesStatus && matchesQuery
    })
  }, [bookNames, loans, query, statusFilter])

  const counts = useMemo(() => ({
    borrowed: loans.filter((loan) => loan.status === 'BORROWED').length,
    overdue: loans.filter((loan) => loan.status === 'OVERDUE').length,
    returned: loans.filter((loan) => loan.status === 'RETURNED').length,
  }), [loans])

  async function handleRenew(loan) {
    if (!window.confirm(`Gia hạn thêm 14 ngày cho phiếu #${loan.loanId}?`)) return
    setBusyLoanId(loan.loanId)
    setError('')
    try {
      const response = await renewLoan(loan.loanId)
      setLoans((current) => current.map((item) => item.loanId === loan.loanId ? response.data : item))
      setNotice(`Phiếu #${loan.loanId} đã được gia hạn thêm 14 ngày.`)
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể gia hạn khoản mượn này.')
    } finally {
      setBusyLoanId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fcfbf7,#f8fafc_45%,#eef4fb)] text-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-sky-700">Tài khoản thư viện</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Khoản mượn của tôi</h1>
            <p className="mt-2 text-[14px] text-slate-600">Theo dõi sách đang mượn, hạn trả và lịch sử giao dịch của bạn.</p>
          </div>
          <div className="flex gap-2"><Link to="/loans/request" className="inline-flex h-10 items-center rounded-xl bg-slate-950 px-4 text-[13px] font-semibold text-white">Tạo yêu cầu mượn</Link><button onClick={loadLoans} disabled={loading || !memberId} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới</button></div>
        </div>

        {!memberId && !loading && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[14px] text-amber-800">Hồ sơ của bạn chưa có mã thành viên nên chưa thể tra cứu khoản mượn.</div>}
        {notice && <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700"><Check size={16} />{notice}</div>}
        {error && <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"><span>{error}</span><button onClick={loadLoans} className="shrink-0 font-semibold">Thử lại</button></div>}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={BookOpen} label="Tổng giao dịch" value={loans.length} classes="bg-slate-100 text-slate-700" />
          <SummaryCard icon={Clock3} label="Đang mượn" value={counts.borrowed} classes="bg-blue-50 text-blue-700" />
          <SummaryCard icon={AlertTriangle} label="Quá hạn" value={counts.overdue} classes="bg-red-50 text-red-700" />
          <SummaryCard icon={BookCheck} label="Đã trả" value={counts.returned} classes="bg-emerald-50 text-emerald-700" />
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo mã phiếu hoặc tên sách..." className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-[13px] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-slate-200">
              <option value="ALL">Tất cả trạng thái</option><option value="BORROWED">Đang mượn</option><option value="OVERDUE">Quá hạn</option><option value="RETURNED">Đã trả</option><option value="LOST">Đã mất</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-[12px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Tài liệu</th><th className="px-5 py-4">Ngày mượn</th><th className="px-5 py-4">Hạn trả</th><th className="px-5 py-4">Ngày trả</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Gia hạn</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? Array.from({ length: 4 }).map((_, index) => <tr key={index} className="animate-pulse">{Array.from({ length: 6 }).map((__, cell) => <td key={cell} className="px-5 py-5"><div className="h-4 rounded bg-slate-100" /></td>)}</tr>) : filteredLoans.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-16 text-center"><BookOpen size={26} className="mx-auto text-slate-300" /><p className="mt-3 text-[14px] font-medium text-slate-500">Bạn chưa có khoản mượn phù hợp.</p></td></tr>
                ) : filteredLoans.map((loan) => (
                  <tr key={loan.loanId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><p className="text-[13px] font-semibold text-slate-950">{bookNames.get(String(loan.bookId)) || 'Chưa có tên sách'}</p><p className="mt-1 text-[11px] text-slate-500">Phiếu #{loan.loanId} · {loan.bookType === 'DIGITAL' ? 'Sách số' : `Bản sao #${loan.copyId || '—'}`}</p></td>
                    <td className="px-5 py-4 text-[13px] text-slate-600">{formatDate(loan.borrowedAt)}</td>
                    <td className={`px-5 py-4 text-[13px] font-medium ${loan.status === 'OVERDUE' ? 'text-red-700' : 'text-slate-700'}`}><span className="inline-flex items-center gap-1.5"><CalendarClock size={14} />{formatDate(loan.dueDate)}</span></td>
                    <td className="px-5 py-4 text-[13px] text-slate-600">{formatDate(loan.returnedAt)}</td>
                    <td className="px-5 py-4"><StatusBadge status={loan.status} /></td>
                    <td className="px-5 py-4 text-right">{loan.status === 'BORROWED' ? <button onClick={() => handleRenew(loan)} disabled={busyLoanId === loan.loanId || (loan.renewalCount || 0) >= 3} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">{busyLoanId === loan.loanId ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}Gia hạn ({loan.renewalCount || 0}/3)</button> : <span className="text-[12px] text-slate-400">Không khả dụng</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default LoanHistory
