import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Edit3, FileText, Layers3, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { deleteBook, getBooks, searchBooks, updateBookStatus } from '@/api/bookApi'
import BookCoverImage from '@/components/books/BookCoverImage'
import { resolveBackendFileUrls } from '@/utils/fileUrl'
import LibrarianLayout from './LibrarianLayout'

const pageSize = 10

function formatStatus(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized.includes('BORROW')) return 'Đang mượn'
  if (normalized.includes('ARCHIVE')) return 'Ngừng lưu hành'
  if (normalized.includes('MAINTAIN')) return 'Bảo trì'
  return 'Sẵn sàng'
}

function MetricCard({ title, value, note, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{title}</p>
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-900">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1.5 text-[13px] text-emerald-600">{note}</p>
    </div>
  )
}

function BookStatus({ status }) {
  const styles = {
    'Sẵn sàng': 'bg-emerald-100 text-emerald-700',
    'Đang mượn': 'bg-amber-100 text-amber-700',
    'Bảo trì': 'bg-slate-100 text-slate-700',
    'Ngừng lưu hành': 'bg-rose-100 text-rose-700',
  }

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] || styles['Sẵn sàng']}`}>{status}</span>
}

function CoverFallback() {
  return (
    <div className="grid h-16 w-12 place-items-center rounded-lg bg-[#10263d]">
      <div className="relative h-12 w-8 rounded-sm bg-[#183d60] shadow-lg">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#0a1726]" />
      </div>
    </div>
  )
}

function getBookCoverSources(book) {
  const backendSources = resolveBackendFileUrls(book.coverImageUrl)
  const fallbackCoverUrl = book.bookId ? `/api/catalog/books/${book.bookId}/cover` : null
  return [...new Set([...backendSources, fallbackCoverUrl].filter(Boolean))]
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function DeleteConfirmModal({ book, deleting, onClose, onConfirm }) {
  if (!book) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="font-serif text-[24px] font-semibold tracking-tight text-slate-950">Xác nhận xóa thông tin sách</h2>
        <p className="mt-3 text-[14px] leading-7 text-slate-600">
          Bạn có chắc chắn muốn xóa đầu sách "{book.title}" khỏi hệ thống?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={deleting} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
            Hủy
          </button>
          <button onClick={() => onConfirm(book)} disabled={deleting} className="rounded-2xl bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50">
            {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RestoreConfirmModal({ book, restoring, onClose, onConfirm }) {
  if (!book) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="font-serif text-[24px] font-semibold tracking-tight text-slate-950">Khôi phục sách</h2>
        <p className="mt-3 text-[14px] leading-7 text-slate-600">
          Bạn có muốn khôi phục đầu sách "{book.title}" không? Sách sẽ quay lại trạng thái sẵn sàng lưu hành.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={restoring} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
            Hủy
          </button>
          <button
            onClick={() => onConfirm(book)}
            disabled={restoring}
            className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {restoring ? 'Đang khôi phục...' : 'Khôi phục'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LibrarianBookCatalog() {
  const [bookToDelete, setBookToDelete] = useState(null)
  const [bookToRestore, setBookToRestore] = useState(null)
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [restoringBookId, setRestoringBookId] = useState(null)
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

  async function loadBooks(targetPage = page, targetKeyword = keyword) {
    try {
      setLoading(true)
      setError('')

      const response = targetKeyword
        ? await searchBooks({ keyword: targetKeyword, page: targetPage, size: pageSize, sort: 'bookId,asc' })
        : await getBooks({ page: targetPage, size: pageSize, sort: 'bookId,asc' })
      const payload = response.data || {}

      setBooks(payload.content || [])
      setTotalElements(payload.totalElements || 0)
      setTotalPages(Math.max(1, payload.totalPages || 1))
    } catch {
      setBooks([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Không tải được danh sách sách từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks(page, keyword)
  }, [page, keyword])

  async function handleDelete(book) {
    try {
      setDeleting(true)
      await deleteBook(book.bookId, 1)
      setBookToDelete(null)

      const nextPage = books.length === 1 && page > 0 ? page - 1 : page
      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        await loadBooks(nextPage)
      }
    } catch {
      setError('Xóa sách thất bại. Vui lòng kiểm tra backend.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestoreStatus(book) {
    try {
      setRestoringBookId(book.bookId)
      setError('')
      await updateBookStatus(book.bookId, {
        availabilityStatus: 'ACTIVE',
        userId: 1,
      })
      setBookToRestore(null)
      await loadBooks(page)
    } catch {
      setError('Khôi phục trạng thái lưu hành thất bại. Vui lòng kiểm tra backend.')
    } finally {
      setRestoringBookId(null)
    }
  }

  const metrics = useMemo(() => {
    const activeCount = books.filter((book) => formatStatus(book.availabilityStatus) === 'Sẵn sàng').length
    return [
      { title: 'Tổng số đầu sách', value: totalElements.toLocaleString('vi-VN'), note: `Trang hiện tại: ${page + 1}/${totalPages}`, icon: FileText },
      { title: 'Đang lưu hành', value: activeCount.toLocaleString('vi-VN'), note: 'Dữ liệu từ backend', icon: BookOpen },
      { title: 'Hiển thị mỗi trang', value: pageSize.toString(), note: `${books.length.toLocaleString('vi-VN')} bản ghi đang xem`, icon: Layers3 },
    ]
  }, [books, page, totalElements, totalPages])

  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 1, totalPages - 3))
    const safeStart = Math.max(0, start)
    const end = Math.min(totalPages, safeStart + 3)
    return Array.from({ length: end - safeStart }, (_, index) => safeStart + index)
  }, [page, totalPages])

  return (
    <LibrarianLayout
      active="catalog"
      title="Thông tin sách"
      description="Quản lý đầu sách vật lý, mã phân loại, trạng thái lưu hành và dữ liệu thư mục với giao diện đồng bộ như bên admin."
      action={
        <Link to="/librarian/books/add" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800">
          <Plus size={16} />
          Thêm sách mới
        </Link>
      }
    >
      <section className="grid gap-4 xl:grid-cols-3">
        {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Book catalog</p>
            <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Danh sách đầu sách</h2>
          </div>
          <label className="flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-3 text-[13px] text-slate-500">
            <Search size={15} />
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              className="w-52 bg-transparent outline-none placeholder:text-slate-400"
              placeholder="Tìm theo tên, ISBN..."
            />
          </label>
        </div>

        {error && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50 text-[13px] font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-4">Ảnh bìa</th>
                <th className="px-5 py-4">Tên đầu sách</th>
                <th className="px-5 py-4">Mã sách</th>
                <th className="px-5 py-4">Tác giả</th>
                <th className="px-5 py-4">Danh mục</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
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
                : books.map((book) => {
                    const status = formatStatus(book.availabilityStatus)
                    const coverSources = getBookCoverSources(book)
                    const canRestoreStatus = String(book.availabilityStatus || '').toUpperCase().includes('ARCHIVE')

                    return (
                      <tr key={book.bookId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            <BookCoverImage
                              src={coverSources}
                              alt={book.title || 'Ảnh bìa sách'}
                              className="h-16 w-12 object-cover object-center"
                              fallback={<CoverFallback />}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="max-w-xs font-medium leading-6 text-slate-950">{book.title || 'Chưa có tiêu đề'}</p>
                            <p className="mt-1 text-[13px] text-slate-600">ISBN: {book.isbn || 'Chưa cập nhật'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[13px] text-slate-600">BK{String(book.bookId || '').padStart(4, '0')}</td>
                        <td className="px-5 py-4 text-[13px] text-slate-600">{book.author || 'Chưa cập nhật'}</td>
                        <td className="px-5 py-4 text-[13px] text-slate-600">{book.categoryName || 'Chưa phân loại'}</td>
                        <td className="px-5 py-4">
                          <BookStatus status={status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canRestoreStatus && (
                              <button
                                onClick={() => setBookToRestore(book)}
                                disabled={restoringBookId === book.bookId}
                                className="rounded-full p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                                aria-label="Khôi phục lưu hành"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                            {!canRestoreStatus && (
                              <>
                                <Link to={`/librarian/books/${book.bookId}/edit`} className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Sửa sách">
                                  <Edit3 size={16} />
                                </Link>
                                <button onClick={() => setBookToDelete(book)} className="rounded-full p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-700" aria-label="Xóa sách">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              {!loading && books.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    Chưa có dữ liệu sách để hiển thị.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hiển thị {books.length === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} trên tổng số {totalElements.toLocaleString('vi-VN')} đầu sách
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

      <DeleteConfirmModal
        book={bookToDelete}
        deleting={deleting}
        onClose={() => setBookToDelete(null)}
        onConfirm={handleDelete}
      />
      <RestoreConfirmModal
        book={bookToRestore}
        restoring={restoringBookId === bookToRestore?.bookId}
        onClose={() => setBookToRestore(null)}
        onConfirm={handleRestoreStatus}
      />
    </LibrarianLayout>
  )
}

export default LibrarianBookCatalog
