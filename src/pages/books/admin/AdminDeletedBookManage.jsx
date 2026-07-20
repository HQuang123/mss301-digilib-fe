import { useEffect, useMemo, useState } from 'react'
import { ArchiveRestore, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDeletedBooks } from '@/api/bookApi'
import BookCoverImage from '@/components/books/BookCoverImage'
import AdminLayout from '@/components/layout/AdminLayout'
import { resolveBackendFileUrls } from '@/utils/fileUrl'

const pageSize = 10

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

function AdminDeletedBookManage() {
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadBooks(targetPage = page) {
    try {
      setLoading(true)
      setError('')

      const response = await getDeletedBooks({ page: targetPage, size: pageSize, sort: 'bookId,asc' })
      const payload = response.data || {}

      setBooks(payload.content || [])
      setTotalElements(payload.totalElements || 0)
      setTotalPages(Math.max(1, payload.totalPages || 1))
    } catch {
      setBooks([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Không tải được danh sách sách đã xóa mềm từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks(page)
  }, [page])

  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 1, totalPages - 3))
    const safeStart = Math.max(0, start)
    const end = Math.min(totalPages, safeStart + 3)
    return Array.from({ length: end - safeStart }, (_, index) => safeStart + index)
  }, [page, totalPages])

  return (
    <AdminLayout
      active="books"
      title="Sách Đã Xóa Mềm"
      description="Admin chỉ xem danh sách đầu sách đã xóa mềm trong hệ thống."
      action={
        <Link to="/admin/books" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800">
          <ArchiveRestore size={16} />
          Quay lại danh sách
        </Link>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">Soft deleted</p>
            <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Danh sách đã xóa mềm</h2>
          </div>
          <div className="text-sm text-slate-500">{totalElements.toLocaleString('vi-VN')} đầu sách</div>
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
                : books.map((book) => {
                    const coverSources = getBookCoverSources(book)

                    return (
                      <tr key={book.bookId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            <BookCoverImage
                              src={coverSources}
                              alt={book.title || 'Book cover'}
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
                          <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                            Đã xóa mềm
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              {!loading && books.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">Chưa có đầu sách nào trong danh sách đã xóa mềm.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hiển thị {books.length === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} trên tổng số {totalElements.toLocaleString('vi-VN')} đầu sách đã xóa mềm
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0 || loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-50" aria-label="Trang trước"><ChevronLeft size={16} /></button>
            {pageNumbers.map((item) => (
              <button key={item} onClick={() => setPage(item)} className={`h-9 w-9 rounded-xl border text-[13px] ${page === item ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                {item + 1}
              </button>
            ))}
            <button onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1 || loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-50" aria-label="Trang sau"><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>
    </AdminLayout>
  )
}

export default AdminDeletedBookManage
