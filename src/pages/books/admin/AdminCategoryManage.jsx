import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, FolderTree, RefreshCw, Search, Tags } from 'lucide-react'
import { getBooks, getCategories, getDeletedCategories } from '@/api/bookApi'
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

function AdminCategoryManage() {
  const [categories, setCategories] = useState([])
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

  async function loadCategories(targetPage = page, targetKeyword = keyword) {
    try {
      setLoading(true)
      setError('')

      const [activeResponse, deletedResponse, booksResponse] = await Promise.all([
        getCategories({ page: 0, size: 5000, sort: 'categoryId,asc' }),
        getDeletedCategories({ page: 0, size: 5000 }),
        getBooks({ page: 0, size: 5000, sort: 'bookId,asc' }),
      ])

      const activeCategories = (activeResponse.data?.content || []).map((category) => ({ ...category, isDeleted: false }))
      const deletedCategories = (deletedResponse.data?.content || []).map((category) => ({ ...category, isDeleted: true }))
      const books = booksResponse.data?.content || []
      const bookCountMap = books.reduce((map, book) => {
        const categoryId = book.categoryId
        if (!categoryId) return map
        map.set(categoryId, (map.get(categoryId) || 0) + 1)
        return map
      }, new Map())

      const mergedCategories = [...activeCategories, ...deletedCategories]
        .sort((left, right) => Number(left.categoryId || 0) - Number(right.categoryId || 0))
        .map((category) => ({
          ...category,
          bookCount: bookCountMap.get(category.categoryId) || 0,
        }))

      const filteredCategories = targetKeyword
        ? mergedCategories.filter((category) => {
            const searchTarget = normalizeText([
              category.categoryName,
              category.description,
              category.categoryId,
            ].join(' '))
            return searchTarget.includes(normalizeText(targetKeyword))
          })
        : mergedCategories

      const startIndex = targetPage * pageSize
      const paginatedCategories = filteredCategories.slice(startIndex, startIndex + pageSize)

      setCategories(paginatedCategories)
      setTotalElements(filteredCategories.length)
      setTotalPages(Math.max(1, Math.ceil(filteredCategories.length / pageSize)))
    } catch {
      setCategories([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Không tải được danh sách danh mục từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories(page, keyword)
  }, [page, keyword])

  const metrics = useMemo(() => {
    const linkedCategories = categories.filter((category) => !category.isDeleted && category.bookCount > 0).length
    const emptyCategories = categories.filter((category) => !category.isDeleted && category.bookCount === 0).length
    const deletedCount = categories.filter((category) => category.isDeleted).length

    return [
      { title: 'Tổng số danh mục', value: totalElements.toLocaleString('vi-VN'), note: `Trang hiện tại: ${page + 1}/${totalPages}`, icon: Tags },
      { title: 'Có đầu sách liên kết', value: linkedCategories.toLocaleString('vi-VN'), note: 'Trên trang hiện tại', icon: FolderTree },
      { title: 'Chưa gắn sách', value: emptyCategories.toLocaleString('vi-VN'), note: 'Cần rà soát', icon: AlertTriangle, danger: emptyCategories > 0 },
      { title: 'Đã xóa mềm', value: deletedCount.toLocaleString('vi-VN'), note: 'Chỉ theo dõi', icon: RefreshCw },
    ]
  }, [categories, page, totalElements, totalPages])

  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 1, totalPages - 3))
    const safeStart = Math.max(0, start)
    const end = Math.min(totalPages, safeStart + 3)
    return Array.from({ length: end - safeStart }, (_, index) => safeStart + index)
  }, [page, totalPages])

  return (
    <AdminLayout
      active="categories"
      title="Quản lý Danh mục"
      description="Admin chỉ xem dữ liệu danh mục và trạng thái hiện tại."
    >
      <section className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Category structure</p>
            <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Danh sách danh mục</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-3 text-[13px] text-slate-500">
              <Search size={15} />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                className="w-44 bg-transparent outline-none placeholder:text-slate-400"
                placeholder="Tìm danh mục..."
              />
            </label>
            <button onClick={() => loadCategories(page, keyword)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-[13px] font-medium text-slate-700">
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
                <th className="px-5 py-4">Mã danh mục</th>
                <th className="px-5 py-4">Tên danh mục</th>
                <th className="px-5 py-4">Mô tả</th>
                <th className="px-5 py-4 text-center">Số đầu sách</th>
                <th className="px-5 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4" colSpan={5}>
                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : categories.map((category) => (
                    <tr key={`${category.categoryId}-${category.isDeleted ? 'deleted' : 'active'}`} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-[13px] text-slate-600">{category.categoryId}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-950">{category.categoryName || 'Chưa cập nhật'}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Backend category</p>
                      </td>
                      <td className="px-5 py-4 text-[13px] leading-6 text-slate-600">{category.description || 'Chưa có mô tả'}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">{category.bookCount}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge isDeleted={category.isDeleted} />
                      </td>
                    </tr>
                  ))}
              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">Không có danh mục nào để hiển thị.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hiển thị {categories.length === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} trên tổng số {totalElements.toLocaleString('vi-VN')} danh mục
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

export default AdminCategoryManage
