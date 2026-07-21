import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertTriangle, Check, HandCoins, Loader2, Receipt, Search, X } from 'lucide-react'
import { getAllFines, getFinePaymentsAsLibrarian, getStudentFinesAsLibrarian, markFinePaid, waiveFine } from '@/api/fineApi'
import { getAllMembers } from '@/api/memberApi'
import LibrarianLayout from '@/pages/books/librarian/LibrarianLayout'
import PaymentHistoryModal from './PaymentHistoryModal'

const FINE_STATUS_META = {
  PENDING: { label: 'Chưa thanh toán', classes: 'bg-red-50 text-red-700 ring-red-600/10' },
  PAID: { label: 'Đã thanh toán', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10' },
  WAIVED: { label: 'Đã miễn', classes: 'bg-slate-100 text-slate-700 ring-slate-500/10' },
}

const REASON_LABELS = {
  OVERDUE_RETURN: 'Trả sách trễ hạn',
  OVERDUE_THRESHOLD: 'Quá hạn mượn',
  LOST_BOOK: 'Làm mất sách',
}

function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function StatusBadge({ status }) {
  const meta = FINE_STATUS_META[status] || { label: status || 'Không rõ', classes: 'bg-slate-100 text-slate-700 ring-slate-500/10' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${meta.classes}`}>{meta.label}</span>
}

function WaiveModal({ fine, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do miễn phạt.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onConfirm(fine.fineId, reason.trim())
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể miễn khoản phạt này.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Miễn phạt</p>
            <h3 className="mt-2 font-serif text-xl font-semibold tracking-tight text-slate-950">Phạt #{fine.fineId}</h3>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
            <X size={16} />
          </button>
        </div>

        <label className="mt-5 block text-[13px] font-medium text-slate-700">
          Lý do miễn phạt
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-[13px] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Ví dụ: sinh viên có hoàn cảnh khó khăn, đã liên hệ giải trình..."
          />
        </label>

        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={submitting} className="h-10 rounded-xl border border-slate-300 px-5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
          <button onClick={handleSubmit} disabled={submitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-5 text-[13px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Xác nhận miễn phạt
          </button>
        </div>
      </div>
    </div>
  )
}

function FineTable({ fines, loading, showStudent, studentMap, busyFineId, onWaive, onMarkPaid, onViewHistory }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left">
        <thead className="bg-slate-50 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {showStudent && <th className="px-5 py-4">Sinh viên</th>}
            <th className="px-5 py-4">Tài liệu</th>
            <th className="px-5 py-4">Lý do</th>
            <th className="px-5 py-4">Hạn trả</th>
            <th className="px-5 py-4">Số tiền</th>
            <th className="px-5 py-4">Trạng thái</th>
            <th className="px-5 py-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? Array.from({ length: 4 }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              {Array.from({ length: showStudent ? 7 : 6 }).map((__, cell) => <td key={cell} className="px-5 py-5"><div className="h-4 rounded bg-slate-100" /></td>)}
            </tr>
          )) : fines.length === 0 ? (
            <tr><td colSpan={showStudent ? 7 : 6} className="px-5 py-16 text-center"><Receipt size={26} className="mx-auto text-slate-300" /><p className="mt-3 text-[14px] font-medium text-slate-500">Không có khoản phạt phù hợp.</p></td></tr>
          ) : fines.map((fine) => (
            <tr key={fine.fineId} className="hover:bg-slate-50/70">
              {showStudent && (
                <td className="px-5 py-4">
                  <p className="text-[13px] font-semibold text-slate-950">{studentMap[fine.studentId]?.name || fine.studentId}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Email: {studentMap[fine.studentId]?.email || '—'}</p>
                </td>
              )}
              <td className="px-5 py-4">
                <p className="text-[13px] font-semibold text-slate-950">{fine.bookTitle || `Sách #${fine.bookId ?? '—'}`}</p>
                <p className="mt-1 text-[11px] text-slate-500">Phạt #{fine.fineId} · Phiếu mượn #{fine.loanId}</p>
              </td>
              <td className="px-5 py-4 text-[13px] text-slate-600">{REASON_LABELS[fine.reason] || fine.reason}</td>
              <td className="px-5 py-4 text-[13px] text-slate-600">{formatDate(fine.dueDate)}</td>
              <td className="px-5 py-4 text-[13px] font-semibold text-slate-950">{formatCurrency(fine.amountDue)}</td>
              <td className="px-5 py-4"><StatusBadge status={fine.status} /></td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onViewHistory(fine.fineId)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                    <Receipt size={14} />Lịch sử
                  </button>
                  {fine.status === 'PENDING' && (
                    <>
                      <button onClick={() => onWaive(fine)} disabled={busyFineId === fine.fineId} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                        Miễn
                      </button>
                      <button onClick={() => onMarkPaid(fine)} disabled={busyFineId === fine.fineId} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-40">
                        {busyFineId === fine.fineId ? <Loader2 size={14} className="animate-spin" /> : <HandCoins size={14} />}
                        Đã thu tiền mặt
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LibrarianFineLookup() {
  const location = useLocation()
  const routeStudentId = location.state?.studentId || ''

  const [mode, setMode] = useState(routeStudentId ? 'lookup' : 'triage')
  const [studentQuery, setStudentQuery] = useState('')
  const [members, setMembers] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(routeStudentId)

  const [fines, setFines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyFineId, setBusyFineId] = useState(null)
  const [waiveFineTarget, setWaiveFineTarget] = useState(null)
  const [historyFineId, setHistoryFineId] = useState(null)

  useEffect(() => {
    getAllMembers().then((res) => setMembers(res.data || [])).catch(() => {})
  }, [])

  const loadTriage = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllFines({ status: 'PENDING' })
      setFines(Array.isArray(res.data?.content) ? res.data.content : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể tải danh sách khoản phạt.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStudentFines = useCallback(async (studentId) => {
    if (!studentId) return
    setLoading(true)
    setError('')
    try {
      const res = await getStudentFinesAsLibrarian(studentId)
      setFines(Array.isArray(res.data?.content) ? res.data.content : [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể tải khoản phạt của sinh viên này.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // The request owns the loading state for whichever mode is active.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mode === 'triage') loadTriage()
    else if (mode === 'lookup' && selectedStudentId) loadStudentFines(selectedStudentId)
  }, [mode, selectedStudentId, loadTriage, loadStudentFines])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  const studentMap = useMemo(() => {
    const map = {}
    members.forEach((m) => {
      const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim()
      map[String(m.id)] = { name: fullName || m.email, email: m.email }
    })
    return map
  }, [members])

  const matchingMembers = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    if (!q) return []
    return members.filter((m) => {
      const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase()
      return fullName.includes(q) || (m.email || '').toLowerCase().includes(q) || (m.memberCode || '').toLowerCase().includes(q)
    }).slice(0, 8)
  }, [members, studentQuery])

  function handleSelectMember(member) {
    setSelectedStudentId(member.id)
    setStudentQuery(`${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email)
  }

  function refresh() {
    if (mode === 'triage') loadTriage()
    else loadStudentFines(selectedStudentId)
  }

  async function handleMarkPaid(fine) {
    if (!window.confirm(`Xác nhận đã thu tiền mặt cho phạt #${fine.fineId}?`)) return
    setBusyFineId(fine.fineId)
    setError('')
    try {
      await markFinePaid(fine.fineId)
      setNotice(`Đã ghi nhận thanh toán tiền mặt cho phạt #${fine.fineId}.`)
      refresh()
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Không thể ghi nhận thanh toán.')
    } finally {
      setBusyFineId(null)
    }
  }

  async function handleWaiveConfirm(fineId, waiverReason) {
    await waiveFine(fineId, waiverReason)
    setWaiveFineTarget(null)
    setNotice(`Đã miễn khoản phạt #${fineId}.`)
    refresh()
  }

  return (
    <LibrarianLayout
      active="fines"
      title="Quản lý phạt"
      description="Tra cứu khoản phạt theo sinh viên hoặc theo dõi các khoản phạt chưa thu để xử lý."
    >
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5">
        <button onClick={() => setMode('triage')} className={`rounded-xl px-4 py-2 text-[13px] font-semibold transition ${mode === 'triage' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Phạt chưa thu</button>
        <button onClick={() => setMode('lookup')} className={`rounded-xl px-4 py-2 text-[13px] font-semibold transition ${mode === 'lookup' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Tra cứu theo sinh viên</button>
      </div>

      {mode === 'lookup' && (
        <div className="relative mt-4 max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="Tìm theo tên, email hoặc mã thành viên..."
            className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-4 text-[13px] outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          {matchingMembers.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {matchingMembers.map((member) => (
                <li key={member.id}>
                  <button onClick={() => handleSelectMember(member)} className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-slate-50">
                    <span className="text-[13px] font-medium text-slate-900">{`${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email}</span>
                    <span className="text-[11px] text-slate-500">{member.email} · {member.memberCode || member.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === 'lookup' && !selectedStudentId && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-[13px] text-slate-500">Tìm và chọn một sinh viên để xem khoản phạt.</div>
      )}

      {notice && <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700"><Check size={16} />{notice}</div>}
      {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"><span className="flex items-center gap-2"><AlertTriangle size={15} />{error}</span><button onClick={refresh} className="shrink-0 font-semibold">Thử lại</button></div>}

      {(mode === 'triage' || (mode === 'lookup' && selectedStudentId)) && (
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <FineTable
            fines={fines}
            loading={loading}
            showStudent={mode === 'triage'}
            studentMap={studentMap}
            busyFineId={busyFineId}
            onWaive={setWaiveFineTarget}
            onMarkPaid={handleMarkPaid}
            onViewHistory={setHistoryFineId}
          />
        </section>
      )}

      {waiveFineTarget && (
        <WaiveModal fine={waiveFineTarget} onClose={() => setWaiveFineTarget(null)} onConfirm={handleWaiveConfirm} />
      )}
      {historyFineId && (
        <PaymentHistoryModal fineId={historyFineId} fetchPayments={getFinePaymentsAsLibrarian} onClose={() => setHistoryFineId(null)} />
      )}
    </LibrarianLayout>
  )
}

export default LibrarianFineLookup
