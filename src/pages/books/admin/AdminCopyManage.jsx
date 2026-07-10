import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BookCopy, ChevronLeft, ChevronRight, RefreshCw, Search, TrendingUp, Wrench } from 'lucide-react'
import { getBookCopies, getBooks, getDeletedBookCopies } from '@/api/bookApi'
import AdminLayout from '@/components/layout/AdminLayout'

const pageSize = 10

function formatCopyStatus(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'BORROWED') return 'Đang mượn'
  if (normalized === 'DAMAGED') return 'Hỏng'
  if (normalized === 'LOST') return 'Thất lạc'
  if (normalized === 'RESERVED') return 'Đã đặt trước'
  if (normalized === 'DRAFT') return 'Bản nháp'
  return 'Sẵn sàng'
}

function formatAcquisitionDate(value) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

function MetricCard({ title, value, note, icon: Icon, danger }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{title}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-900'}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className={`mt-4 text-2xl font-semibold ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</p>
      <p className={`mt-1.5 text-[13px] ${danger ? 'text-red-500' : 'text-slate-500'}`}>{note}</p>
    </div>
  )
}

function StatusBadge({ status, isDeleted }) {
  if (isDeleted) {
    return <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-700">Đã xóa mềm</span>
  }

  const styles = {
    'Sẵn sàng': 'bg-emerald-100 text-emerald-700',
    'Đang mượn': 'bg-amber-100 text-amber-700',
    Hỏng: 'bg-slate-100 text-slate-700',
    'Thất lạc': 'bg-red-100 text-red-700',
    'Đã đặt trước': 'bg-sky-100 text-sky-700',
    'Bản nháp': 'bg-violet-100 text-violet-700',
  }

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] || styles['Sẵn sàng']}`}>{status}</span>
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function AdminCopyManage() {
  const [copies, setCopies] = useState([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextKeyword = keywordInput.trim()
      if (normalizeText(nextKeyword) !== normalizeText(keyword)) {
        setPage(0)
        setKeyword(nextKeyword)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [keywordInput, keyword])

  async function loadCopies(targetPage = page, targetKeyword = keyword) {
    try {
      setLoading(true)
      setError('')

      const [activeResult, deletedResult, booksResult] = await Promise.allSettled([
        getBookCopies({ page: 0, size: 5000, sort: 'copyId,asc' }),
        getDeletedBookCopies({ page: 0, size: 5000 }),
        getBooks({ page: 0, size: 5000, sort: 'bookId,asc' }),
      ])

      if (activeResult.status !== 'fulfilled' || booksResult.status !== 'fulfilled') {
        throw new Error('load-failed')
      }

      const activeCopies = (activeResult.value.data?.content || []).map((copy) => ({ ...copy, isDeleted: false }))
      const deletedCopies = deletedResult.status === 'fulfilled'
        ? (deletedResult.value.data?.content || []).map((copy) => ({ ...copy, isDeleted: true }))
        : []
      const books = booksResult.value.data?.content || []
      const bookMap = new Map(books.map((book) => [book.bookId, book]))

      const mergedCopies = [...activeCopies, ...deletedCopies]
        .sort((left, right) => Number(left.copyId || 0) - Number(right.copyId || 0))
        .map((copy) => {
          const book = bookMap.get(copy.bookId) || {}
          return {
            ...copy,
            displayStatus: formatCopyStatus(copy.copyStatus),
            title: book.title || `Sách #${copy.bookId || 'N/A'}`,
            author: book.author || '',
            bookCode: `BK${String(copy.bookId || '').padStart(4, '0')}`,
          }
        })

      const filteredCopies = targetKeyword
        ? mergedCopies.filter((copy) => {
            const searchTarget = normalizeText([
              copy.barcode,
              copy.title,
              copy.author,
              copy.bookCode,
              copy.shelfLocation,
              copy.displayStatus,
            ].join(' '))
            return searchTarget.includes(normalizeText(targetKeyword))
          })
        : mergedCopies

      const startIndex = targetPage * pageSize
      const paginatedCopies = filteredCopies.slice(startIndex, startIndex + pageSize)

      setCopies(paginatedCopies)
      setTotalElements(filteredCopies.length)
      setTotalPages(Math.max(1, Math.ceil(filteredCopies.length / pageSize)))

      if (deletedResult.status !== 'fulfilled') {
        setError('Không tải được danh sách bản sao đã xóa mềm từ backend. Danh sách hiện tại chỉ hiển thị bản sao đang hoạt động.')
      }
    } catch {
      setCopies([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Không tải được danh sách bản sao từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCopies(page, keyword)
  }, [page, keyword])

  const metrics = useMemo(() => {
    const availableCount = copies.filter((copy) => !copy.isDeleted && copy.displayStatus === 'Sẵn sàng').length
    const damagedCount = copies.filter((copy) => !copy.isDeleted && copy.displayStatus === 'Hỏng').length
    const deletedCount = copies.filter((copy) => copy.isDeleted).length

    return [
      { title: 'Tổng số bản sao', value: totalElements.toLocaleString('vi-VN'), note: `Trang hiện tại: ${page + 1}/${totalPages}`, icon: BookCopy },
      { title: 'Sẵn sàng', value: availableCount.toLocaleString('vi-VN'), note: 'Trên trang hiện tại', icon: TrendingUp },
      { title: 'Hỏng', value: damagedCount.toLocaleString('vi-VN'), note: 'Cần xử lý', icon: Wrench },
      { title: 'Đã xóa mềm', value: deletedCount.toLocaleString('vi-VN'), note: 'Chỉ theo dõi', icon: AlertTriangle, danger: deletedCount > 0 },
    ]
  }, [copies, page, totalElements, totalPages])

  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 1, totalPages - 3))
    const safeStart = Math.max(0, start)
    const end = Math.min(totalPages, safeStart + 3)
    return Array.from({ length: end - safeStart }, (_, index) => safeStart + index)
  }, [page, totalPages])

  return (
    <AdminLayout
      active="copies"
      title="Quản lý Bản sao"
      description="Admin chỉ xem dữ liệu bản sao, không thực hiện thêm, sửa hoặc xóa."
    >
      <section className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Copies overview</p>
            <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Danh sách bản sao</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-3 text-[13px] text-slate-500">
              <Search size={15} />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                className="w-52 bg-transparent outline-none placeholder:text-slate-400"
                placeholder="Tìm mã vạch, đầu sách..."
              />
            </label>
            <button onClick={() => loadCopies(page, keyword)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-[13px] font-medium text-slate-700">
              <RefreshCw size={15} />
              Làm mới
            </button>
          </div>
        </div>

        {error && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50 text-[13px] font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-4">STT</th>
                <th className="px-5 py-4">Mã bản sao</th>
                <th className="px-5 py-4">Mã đầu sách</th>
                <th className="px-5 py-4">Mã vạch</th>
                <th className="px-5 py-4">Vị trí kệ</th>
                <th className="px-5 py-4">Ngày nhập</th>
                <th className="px-5 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4" colSpan={7}>
                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : copies.map((copy, index) => (
                    <tr key={`${copy.copyId}-${copy.isDeleted ? 'deleted' : 'active'}`} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-[13px] font-medium text-slate-600">{page * pageSize + index + 1}</td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-950">{copy.barcode || `COPY-${copy.copyId}`}</p>
                          <p className="mt-1 text-[13px] text-slate-600">{copy.title}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-slate-600">
                        <p>{copy.bookCode}</p>
                        <p className="mt-1 text-slate-500">{copy.author || 'Chưa cập nhật tác giả'}</p>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-slate-600">{copy.barcode || 'Chưa cập nhật'}</td>
                      <td className="px-5 py-4 text-[13px] text-slate-600">{copy.shelfLocation || 'Chưa cập nhật'}</td>
                      <td className="px-5 py-4 text-[13px] text-slate-600">{formatAcquisitionDate(copy.acquisitionDate)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={copy.displayStatus} isDeleted={copy.isDeleted} />
                      </td>
                    </tr>
                  ))}
              {!loading && copies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">Không có bản sao nào để hiển thị.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hiển thị {copies.length === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} trên tổng số {totalElements.toLocaleString('vi-VN')} bản sao
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0 || loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-50" aria-label="Trang trước">
              <ChevronLeft size={16} />
            </button>
            {pageNumbers.map((item) => (
              <button key={item} onClick={() => setPage(item)} className={`h-9 w-9 rounded-xl border text-[13px] ${page === item ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                {item + 1}
              </button>
            ))}
            <button onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1 || loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-50" aria-label="Trang sau">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </AdminLayout>
  )
}

export default AdminCopyManage
