import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookCheck,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { borrowBook, getLoans, renewLoan, returnBook } from '@/api/loanApi'
import LibrarianLayout from '@/pages/books/librarian/LibrarianLayout'

const PAGE_SIZE = 20

const STATUS_META = {
  BORROWED: { label: 'Đang mượn', classes: 'bg-blue-50 text-blue-700 ring-blue-600/10' },
  OVERDUE: { label: 'Quá hạn', classes: 'bg-red-50 text-red-700 ring-red-600/10' },
  RETURNED: { label: 'Đã trả', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
}

function formatDate(value, includeTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.detail || fallback
}

function createRequestKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || 'Không rõ', classes: 'bg-slate-100 text-slate-700 ring-slate-500/10' }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${meta.classes}`}>
      {meta.label}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tones[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  )
}

function Modal({ open, title, eyebrow, onClose, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/55"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">{eyebrow}</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

function BorrowModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ memberId: '', bookId: '', bookType: 'PHYSICAL' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.memberId.trim() || !form.bookId) {
      setError('Vui lòng nhập mã thành viên và mã sách.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await borrowBook({
        memberId: form.memberId.trim(),
        bookId: Number(form.bookId),
        bookType: form.bookType,
        idempotencyKey: createRequestKey('web-borrow'),
      })
      onCreated(response.data)
      setForm({ memberId: '', bookId: '', bookType: 'PHYSICAL' })
      onClose()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tạo phiếu mượn. Hãy kiểm tra điều kiện mượn và thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Loan service" title="Tạo phiếu mượn mới">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-[13px] font-semibold text-slate-700">
          Mã thành viên
          <input value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} placeholder="Ví dụ: SV001" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3.5 font-normal outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" autoFocus />
        </label>
        <label className="block text-[13px] font-semibold text-slate-700">
          Mã sách
          <input type="number" min="1" value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })} placeholder="Nhập bookId" className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3.5 font-normal outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
        </label>
        <fieldset>
          <legend className="text-[13px] font-semibold text-slate-700">Loại tài liệu</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[['PHYSICAL', 'Sách vật lý'], ['DIGITAL', 'Sách số']].map(([value, label]) => (
              <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-[13px] font-medium ${form.bookType === value ? 'border-slate-900 bg-slate-50 text-slate-950' : 'border-slate-200 text-slate-600'}`}>
                <input type="radio" name="bookType" value={value} checked={form.bookType === value} onChange={(e) => setForm({ ...form, bookType: e.target.value })} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-800">Hệ thống sẽ tự kiểm tra dư nợ, hạn mức mượn và bản sao khả dụng trước khi tạo phiếu.</p>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={submitting} className="h-10 rounded-xl border border-slate-300 px-5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>
          <button type="submit" disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-5 text-[13px] font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <BookCheck size={15} />}
            {submitting ? 'Đang tạo...' : 'Xác nhận mượn'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function LoanDetailModal({ loan, onClose }) {
  if (!loan) return null
  const rows = [
    ['Mã phiếu', `#${loan.loanId}`],
    ['Mã thành viên', loan.memberId],
    ['Mã sách', loan.bookId],
    ['Mã bản sao', loan.copyId || 'Không áp dụng'],
    ['Loại tài liệu', loan.bookType === 'DIGITAL' ? 'Sách số' : 'Sách vật lý'],
    ['Ngày mượn', formatDate(loan.borrowedAt, true)],
    ['Hạn trả', formatDate(loan.dueDate, true)],
    ['Ngày trả', formatDate(loan.returnedAt, true)],
    ['Số lần gia hạn', `${loan.renewalCount || 0}/3`],
  ]
  return (
    <Modal open={!!loan} onClose={onClose} eyebrow="Chi tiết giao dịch" title={`Phiếu mượn #${loan.loanId}`}>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-[13px] font-medium text-slate-500">Trạng thái hiện tại</span>
        <StatusBadge status={loan.status} />
      </div>
      <dl className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[130px_1fr] gap-4 py-3 text-[13px]">
            <dt className="text-slate-500">{label}</dt>
            <dd className="break-all text-right font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}

function LoanDash() {
  const location = useLocation()
  const [loans, setLoans] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const initialStatus = location.pathname.endsWith('/history') ? 'ALL' : location.pathname.endsWith('/returns') ? 'BORROWED' : 'ALL'
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [busyLoanId, setBusyLoanId] = useState(null)

  const loadLoans = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getLoans({ page, size: PAGE_SIZE })
      const data = response.data || {}
      setLoans(data.content || [])
      setTotalPages(Math.max(data.totalPages || 1, 1))
      setTotalElements(data.totalElements || 0)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tải danh sách phiếu mượn. Vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    // The request owns the loading state for this page transition.
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
      const matchesQuery = !normalized || [loan.loanId, loan.memberId, loan.bookId, loan.copyId]
        .some((value) => String(value ?? '').toLowerCase().includes(normalized))
      return matchesStatus && matchesQuery
    })
  }, [loans, query, statusFilter])

  const metrics = useMemo(() => ({
    active: loans.filter((loan) => loan.status === 'BORROWED').length,
    overdue: loans.filter((loan) => loan.status === 'OVERDUE').length,
    returned: loans.filter((loan) => loan.status === 'RETURNED').length,
  }), [loans])

  function updateLoan(nextLoan) {
    setLoans((current) => current.map((loan) => loan.loanId === nextLoan.loanId ? nextLoan : loan))
  }

  async function handleReturn(loan) {
    if (!window.confirm(`Xác nhận trả sách cho phiếu #${loan.loanId}?`)) return
    setBusyLoanId(loan.loanId)
    try {
      const response = await returnBook(loan.loanId, createRequestKey('web-return'))
      updateLoan(response.data)
      setNotice(`Đã hoàn tất trả sách cho phiếu #${loan.loanId}.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể trả sách. Vui lòng thử lại.'))
    } finally {
      setBusyLoanId(null)
    }
  }

  async function handleRenew(loan) {
    if (!window.confirm(`Gia hạn thêm 14 ngày cho phiếu #${loan.loanId}?`)) return
    setBusyLoanId(loan.loanId)
    try {
      const response = await renewLoan(loan.loanId, 'LIBRARIAN_WEB')
      updateLoan(response.data)
      setNotice(`Đã gia hạn phiếu #${loan.loanId} thành công.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể gia hạn phiếu mượn.'))
    } finally {
      setBusyLoanId(null)
    }
  }

  const action = (
    <button onClick={() => setBorrowOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-slate-800">
      <Plus size={16} /> Tạo phiếu mượn
    </button>
  )

  const activeNav = location.pathname.endsWith('/history')
    ? 'loan-history'
    : location.pathname.endsWith('/returns')
      ? 'loan-returns'
      : 'loans'

  return (
    <LibrarianLayout active={activeNav} title="Quản lý mượn trả" description="Tạo phiếu mượn, theo dõi hạn trả và xử lý trả hoặc gia hạn sách." action={action}>
      {notice && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700"><Check size={16} />{notice}</div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BookOpen} label="Tổng phiếu" value={totalElements} />
        <MetricCard icon={Clock3} label="Đang mượn (trang này)" value={metrics.active} tone="blue" />
        <MetricCard icon={AlertTriangle} label="Quá hạn (trang này)" value={metrics.overdue} tone="red" />
        <MetricCard icon={BookCheck} label="Đã trả (trang này)" value={metrics.returned} tone="emerald" />
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã phiếu, thành viên, sách hoặc bản sao..." className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-[13px] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-slate-200">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="BORROWED">Đang mượn</option>
                <option value="OVERDUE">Quá hạn</option>
                <option value="RETURNED">Đã trả</option>
              </select>
            </div>
            <button onClick={loadLoans} disabled={loading} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50" aria-label="Tải lại"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        {error && <div className="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"><span>{error}</span><button onClick={loadLoans} className="shrink-0 font-semibold">Thử lại</button></div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-slate-50 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Phiếu mượn</th><th className="px-5 py-4">Thành viên</th><th className="px-5 py-4">Sách / Bản sao</th><th className="px-5 py-4">Ngày mượn</th><th className="px-5 py-4">Hạn trả</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">{Array.from({ length: 7 }).map((__, cell) => <td key={cell} className="px-5 py-5"><div className="h-4 rounded bg-slate-100" /></td>)}</tr>
              )) : filteredLoans.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-16 text-center"><BookOpen size={24} className="mx-auto text-slate-300" /><p className="mt-3 text-[14px] font-medium text-slate-500">Không có phiếu mượn phù hợp.</p></td></tr>
              ) : filteredLoans.map((loan) => {
                const busy = busyLoanId === loan.loanId
                const actionable = loan.status === 'BORROWED' || loan.status === 'OVERDUE'
                return (
                  <tr key={loan.loanId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-[13px] font-semibold text-slate-950">#{loan.loanId}</td>
                    <td className="px-5 py-4 text-[13px] text-slate-700">{loan.memberId}</td>
                    <td className="px-5 py-4"><p className="text-[13px] font-semibold text-slate-800">Sách #{loan.bookId}</p><p className="mt-1 text-[11px] text-slate-500">{loan.copyId ? `Bản sao #${loan.copyId}` : 'Tài liệu số'}</p></td>
                    <td className="px-5 py-4 text-[13px] text-slate-600">{formatDate(loan.borrowedAt)}</td>
                    <td className={`px-5 py-4 text-[13px] font-medium ${loan.status === 'OVERDUE' ? 'text-red-700' : 'text-slate-700'}`}>{formatDate(loan.dueDate)}</td>
                    <td className="px-5 py-4"><StatusBadge status={loan.status} /></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1.5">
                      <button onClick={() => setSelectedLoan(loan)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100" aria-label="Xem chi tiết"><Eye size={15} /></button>
                      {actionable && loan.status === 'BORROWED' && <button onClick={() => handleRenew(loan)} disabled={busy || (loan.renewalCount || 0) >= 3} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40"><RotateCcw size={14} />Gia hạn</button>}
                      {actionable && <button onClick={() => handleReturn(loan)} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <BookCheck size={14} />}Trả sách</button>}
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-[13px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Trang {page + 1}/{totalPages} · {totalElements} phiếu mượn</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((value) => Math.max(value - 1, 0))} disabled={page === 0 || loading} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-300 px-3 font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={15} />Trước</button>
            <button onClick={() => setPage((value) => Math.min(value + 1, totalPages - 1))} disabled={page >= totalPages - 1 || loading} className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-300 px-3 font-semibold text-slate-700 disabled:opacity-40">Sau<ChevronRight size={15} /></button>
          </div>
        </div>
      </section>

      <BorrowModal open={borrowOpen} onClose={() => setBorrowOpen(false)} onCreated={(loan) => { setLoans((current) => [loan, ...current]); setTotalElements((value) => value + 1); setNotice(`Đã tạo phiếu mượn #${loan.loanId}.`) }} />
      <LoanDetailModal loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
    </LibrarianLayout>
  )
}

export default LoanDash
