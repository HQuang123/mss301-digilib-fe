import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, RefreshCw, X } from 'lucide-react'
import { approveBorrowRequest, getBorrowRequests, rejectBorrowRequest } from '@/api/loanApi'
import LibrarianLayout from '@/pages/books/librarian/LibrarianLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import useAuthStore from '@/store/authSlice'

function messageOf(error, fallback) {
  return error?.response?.data?.message || fallback
}

function BorrowRequestQueue() {
  const roles = useAuthStore((state) => state.roles)
  const ReviewLayout = roles.includes('admin') ? AdminLayout : LibrarianLayout
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getBorrowRequests({ status: statusFilter, size: 100 })
      setRequests(response.data?.content || [])
    } catch (requestError) {
      setError(messageOf(requestError, 'Không thể tải danh sách yêu cầu mượn.'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    // The request owns the loading state for this page transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function approve(request) {
    if (!window.confirm(`Duyệt yêu cầu mượn sách #${request.bookId} của thành viên ${request.memberId}?`)) return
    setBusyId(request.requestId)
    setError('')
    try {
      const response = await approveBorrowRequest(request.requestId)
      setRequests((items) => items.filter((item) => item.requestId !== request.requestId))
      setNotice(`Loan #${response.data.loanId} đã chuyển từ PENDING sang BORROWED.`)
    } catch (requestError) {
      setError(messageOf(requestError, 'Không thể duyệt yêu cầu. Hãy kiểm tra khoản phạt, hạn mức và bản sao sách.'))
    } finally {
      setBusyId(null)
    }
  }

  async function reject(request) {
    const reason = window.prompt('Nhập lý do từ chối:')
    if (!reason?.trim()) return
    setBusyId(request.requestId)
    setError('')
    try {
      await rejectBorrowRequest(request.requestId, reason.trim())
      setRequests((items) => items.filter((item) => item.requestId !== request.requestId))
      setNotice(`Đã từ chối yêu cầu #${request.requestId}.`)
    } catch (requestError) {
      setError(messageOf(requestError, 'Không thể từ chối yêu cầu.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ReviewLayout
      active="borrow-requests"
      title="Yêu cầu mượn sách"
      description="Duyệt Loan PENDING thành BORROWED hoặc chuyển sang REJECTED. Fine, hạn mức và bản sao chỉ được kiểm tra khi duyệt."
      action={<button onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Làm mới</button>}
    >
      {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="mb-4 flex flex-wrap gap-2">
        {[['PENDING', 'Chờ duyệt'], ['BORROWED', 'Đang mượn'], ['OVERDUE', 'Quá hạn'], ['RETURNED', 'Đã trả'], ['LOST', 'Đã mất'], ['REJECTED', 'Đã từ chối'], ['CANCELLED', 'Đã hủy']].map(([value, label]) => <button key={value} onClick={() => setStatusFilter(value)} className={`rounded-full px-4 py-2 text-xs font-semibold ${statusFilter === value ? 'bg-slate-950 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{label}</button>)}
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Loan</th><th className="px-5 py-4">Thành viên</th><th className="px-5 py-4">Sách</th><th className="px-5 py-4">Loại</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="7" className="px-5 py-16 text-center text-slate-500"><Loader2 className="mx-auto animate-spin" />Đang tải...</td></tr>
              : requests.length === 0 ? <tr><td colSpan="7" className="px-5 py-16 text-center text-slate-500">Không có Loan ở trạng thái này.</td></tr>
              : requests.map((request) => <tr key={request.requestId}>
                <td className="px-5 py-4 font-semibold">#{request.requestId}</td>
                <td className="px-5 py-4 text-sm">{request.memberId}</td>
                <td className="px-5 py-4 text-sm font-semibold">#{request.bookId}</td>
                <td className="px-5 py-4 text-sm">{request.bookType}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{request.status}</span></td>
                <td className="px-5 py-4 text-sm">{new Date(request.requestedAt).toLocaleString('vi-VN')}</td>
                <td className="px-5 py-4"><div className="flex justify-end gap-2">
                  {request.status === 'PENDING' ? <><button onClick={() => reject(request)} disabled={busyId === request.requestId} className="inline-flex h-9 items-center gap-1 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-700"><X size={14} />Từ chối</button><button onClick={() => approve(request)} disabled={busyId === request.requestId} className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white">{busyId === request.requestId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Duyệt</button></> : <span className="text-xs text-slate-400">Đã xử lý</span>}
                </div></td>
              </tr>)}
          </tbody>
        </table>
      </section>
    </ReviewLayout>
  )
}

export default BorrowRequestQueue
