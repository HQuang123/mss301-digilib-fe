import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search, Tags } from 'lucide-react'
import { getBooks, getClassifications, getDeletedClassifications } from '@/api/bookApi'
import AdminLayout from '@/components/layout/AdminLayout'

const pageSize = 10

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
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

function StatusBadge({ isDeleted }) {
  if (isDeleted) {
    return <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-700">Đã xóa mềm</span>
  }

  return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Đang hoạt động</span>
}

function AdminClassificationManage() {
  const [classifications, setClassifications] = useState([])
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

  async function loadClassifications(targetPage = page, targetKeyword = keyword) {
    try {
      setLoading(true)
      setError('')

      const [activeResponse, deletedResponse, booksResponse] = await Promise.all([
        getClassifications({ page: 0, size: 5000, sort: 'classificationId,asc' }),
        getDeletedClassifications({ page: 0, size: 5000 }),
        getBooks({ page: 0, size: 5000, sort: 'bookId,asc' }),
      ])

      const activeClassifications = (activeResponse.data?.content || []).map((classification) => ({ ...classification, isDeleted: false }))
      const deletedClassifications = (deletedResponse.data?.content || []).map((classification) => ({ ...classification, isDeleted: true }))
      const books = booksResponse.data?.content || []

      const bookCountMap = books.reduce((map, book) => {
        const classificationId = book.classificationId
        if (!classificationId) return map
        map.set(classificationId, (map.get(classificationId) || 0) + 1)
        return map
      }, new Map())

      const mergedClassifications = [...activeClassifications, ...deletedClassifications]
        .sort((left, right) => Number(left.classificationId || 0) - Number(right.classificationId || 0))
        .map((classification) => ({
          ...classification,
          bookCount: bookCountMap.get(classification.classificationId) || 0,
        }))

      const filteredClassifications = targetKeyword
        ? mergedClassifications.filter((classification) => {
            const searchTarget = normalizeText([
              classification.classificationId,
              classification.classificationSystem,
              classification.classificationName,
              classification.classificationCode,
            ].join(' '))
            return searchTarget.includes(normalizeText(targetKeyword))
          })
        : mergedClassifications

      const startIndex = targetPage * pageSize
      const paginatedClassifications = filteredClassifications.slice(startIndex, startIndex + pageSize)

      setClassifications(paginatedClassifications)
      setTotalElements(filteredClassifications.length)
      setTotalPages(Math.max(1, Math.ceil(filteredClassifications.length / pageSize)))
    } catch {
      setClassifications([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Không tải được danh sách phân loại từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassifications(page, keyword)
  }, [page, keyword])

  const metrics = useMemo(() => {
    const linkedCount = classifications.filter((classification) => !classification.isDeleted && classification.bookCount > 0).length
    const emptyCount = classifications.filter((classification) => !classification.isDeleted && classification.bookCount === 0).length
    const deletedCount = classifications.filter((classification) => classification.isDeleted).length
    const ddcCount = classifications.filter((classification) => !classification.isDeleted && normalizeText(classification.classificationSystem) === 'ddc').length

    return [
      { title: 'Tổng số phân loại', value: totalElements.toLocaleString('vi-VN'), note: `Trang hiện tại: ${page + 1}/${totalPages}`, icon: Tags },
      { title: 'Có đầu sách liên kết', value: linkedCount.toLocaleString('vi-VN'), note: 'Trên trang hiện tại', icon: RefreshCw },
      { title: 'Chưa gắn sách', value: emptyCount.toLocaleString('vi-VN'), note: 'Cần rà soát', icon: AlertTriangle, danger: emptyCount > 0 },
      { title: 'Chuẩn DDC hoạt động', value: ddcCount.toLocaleString('vi-VN'), note: `${deletedCount.toLocaleString('vi-VN')} bản ghi đã xóa mềm`, icon: Tags },
    ]
  }, [classifications, page, totalElements, totalPages])

  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 1, totalPages - 3))
    const safeStart = Math.max(0, start)
    const end = Math.min(totalPages, safeStart + 3)
    return Array.from({ length: end - safeStart }, (_, index) => safeStart + index)
  }, [page, totalPages])

  return (
    <AdminLayout
      active="classifications"
      title="Phân loại sách"
      description="Admin chỉ xem dữ liệu phân loại sách và trạng thái hiện tại."
    >
      <section className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Classification system</p>
            <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Danh sách phân loại</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-3 text-[13px] text-slate-500">
              <Search size={15} />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                className="w-44 bg-transparent outline-none placeholder:text-slate-400"
                placeholder="Tìm phân loại..."
              />
            </label>
            <button onClick={() => loadClassifications(page, keyword)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-[13px] font-medium text-slate-700">
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
                <th className="px-5 py-4">Mã phân loại</th>
                <th className="px-5 py-4">Hệ thống</th>
                <th className="px-5 py-4">Tên phân loại</th>
                <th className="px-5 py-4">Code DDC</th>
                <th className="px-5 py-4 text-center">Số sách</th>
                <th className="px-5 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4" colSpan={6}>
                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : classifications.map((classification) => (
                    <tr key={`${classification.classificationId}-${classification.isDeleted ? 'deleted' : 'active'}`} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-950">{classification.classificationId}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-semibold text-yellow-800">
                          {classification.classificationSystem || 'N/A'}
                        </span>
                      </td>
                      <td className="max-w-xs px-5 py-4 font-semibold text-slate-950">{classification.classificationName || 'Chưa cập nhật'}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{classification.classificationCode ?? 'Chưa cập nhật'}</td>
                      <td className="px-5 py-4 text-center text-sm text-slate-600">{classification.bookCount.toLocaleString('vi-VN')}</td>
                      <td className="px-5 py-4">
                        <StatusBadge isDeleted={classification.isDeleted} />
                      </td>
                    </tr>
                  ))}
              {!loading && classifications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">Không có phân loại nào để hiển thị.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hiển thị {classifications.length === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} trên tổng số {totalElements.toLocaleString('vi-VN')} phân loại
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

export default AdminClassificationManage
