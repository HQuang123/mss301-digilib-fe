import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Edit3, Eye, FileText, Globe2, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { deleteDigitalResource, getBooks, getDeletedDigitalResources, getDigitalResources, restoreDigitalResource } from '@/api/bookApi'
import BookCoverImage from '@/components/books/BookCoverImage'
import { resolveBackendFileUrl, resolveBackendFileUrls } from '@/utils/fileUrl'
import LibrarianLayout from './LibrarianLayout'

const pageSize = 10

const accessLabels = {
  PUBLIC: 'Công khai',
  MEMBER: 'Thành viên',
  INTERNAL: 'Nội bộ',
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

function AccessBadge({ value }) {
  const normalized = String(value || '').toUpperCase()
  const styles = {
    PUBLIC: 'bg-emerald-100 text-emerald-700',
    MEMBER: 'bg-amber-100 text-amber-700',
    INTERNAL: 'bg-slate-100 text-slate-700',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[normalized] || styles.INTERNAL}`}>
      {accessLabels[normalized] || normalized || 'Chưa cập nhật'}
    </span>
  )
}

function StatusBadge({ isDeleted }) {
  if (isDeleted) {
    return (
      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
        Đã xóa mềm
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
      Đang hiển thị
    </span>
  )
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
  const backendSources = resolveBackendFileUrls(book?.coverImageUrl)
  const fallbackCoverUrl = book?.bookId ? `/api/catalog/books/${book.bookId}/cover` : null
  return [...new Set([...backendSources, fallbackCoverUrl].filter(Boolean))]
}

function DeleteDigitalModal({ resource, deleting, onClose, onConfirm }) {
  if (!resource) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="font-serif text-[24px] font-semibold tracking-tight text-slate-950">Xác nhận xóa sách điện tử</h2>
        <p className="mt-3 text-[14px] leading-7 text-slate-600">
          Bạn có chắc chắn muốn xóa tài liệu số của sách "{resource.bookTitle || `BK${String(resource.bookId || '').padStart(4, '0')}`}"?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={deleting} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
            Hủy
          </button>
          <button
            onClick={() => onConfirm(resource)}
            disabled={deleting}
            className="rounded-2xl bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
          >
            {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RestoreDigitalModal({ resource, restoring, onClose, onConfirm }) {
  if (!resource) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="font-serif text-[24px] font-semibold tracking-tight text-slate-950">Khôi phục sách điện tử</h2>
        <p className="mt-3 text-[14px] leading-7 text-slate-600">
          Bạn có muốn khôi phục tài liệu số của sách "{resource.bookTitle || `BK${String(resource.bookId || '').padStart(4, '0')}`}" không?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={restoring} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
            Hủy
          </button>
          <button
            onClick={() => onConfirm(resource)}
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

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'

  try {
    return new Date(value).toLocaleString('vi-VN')
  } catch {
    return 'Chưa cập nhật'
  }
}

function getFileLink(resourceUrl) {
  const resolved = resolveBackendFileUrl(resourceUrl)
  return resolved || resourceUrl || '#'
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function LibrarianDigitalBooks() {
  const [resourceToDelete, setResourceToDelete] = useState(null)
  const [resourceToRestore, setResourceToRestore] = useState(null)
  const [resources, setResources] = useState([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)
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

  async function loadResources(targetPage = page, targetKeyword = keyword) {
    try {
      setLoading(true)
      setError('')

      const [activeResponse, deletedResponse, booksResponse] = await Promise.all([
        getDigitalResources({ page: 0, size: 500, sort: 'resourceId,asc' }),
        getDeletedDigitalResources({ page: 0, size: 500, sort: 'resourceId,asc' }),
        getBooks({ page: 0, size: 500, sort: 'bookId,asc' }),
      ])

      const activeResources = activeResponse.data?.content || []
      const deletedResources = deletedResponse.data?.content || []
      const mergedResources = [...activeResources, ...deletedResources]
      const bookMap = new Map(
        (booksResponse.data?.content || []).map((book) => [book.bookId, book]),
      )
      const nextResources = mergedResources.map((resource) => {
        const book = bookMap.get(resource.bookId) || {}

        return {
          ...resource,
          bookTitle: book.title || '',
          author: book.author || '',
          categoryName: book.categoryName || '',
          coverImageUrl: book.coverImageUrl || '',
        }
      })
      const filteredResources = targetKeyword
        ? nextResources.filter((resource) => {
            const searchTarget = normalizeText([
              resource.bookTitle,
              resource.author,
              resource.categoryName,
              resource.resourceUrl,
              resource.fileFormat,
              resource.accessPermission,
            ].join(' '))
            return searchTarget.includes(normalizeText(targetKeyword))
          })
        : nextResources
      const startIndex = targetPage * pageSize
      const paginatedResources = filteredResources.slice(startIndex, startIndex + pageSize)

      setResources(paginatedResources)
      setTotalElements(filteredResources.length)
      setTotalPages(Math.max(1, Math.ceil(filteredResources.length / pageSize)))
    } catch {
      setResources([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Không tải được danh sách sách điện tử từ backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources(page, keyword)
  }, [page, keyword])

  async function handleDelete(resource) {
    try {
      setDeleting(true)
      await deleteDigitalResource(resource.resourceId)
      setResourceToDelete(null)

      const nextPage = resources.length === 1 && page > 0 ? page - 1 : page
      if (nextPage !== page) {
        setPage(nextPage)
      } else {
        await loadResources(nextPage)
      }
    } catch {
      setError('Xóa sách điện tử thất bại. Vui lòng kiểm tra backend.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestore(resource) {
    try {
      setRestoring(true)
      await restoreDigitalResource(resource.resourceId, resource.bookId, 1)
      setResourceToRestore(null)
      await loadResources(page)
    } catch {
      setError('Khôi phục sách điện tử thất bại. Vui lòng kiểm tra backend.')
    } finally {
      setRestoring(false)
    }
  }

  const metrics = useMemo(() => {
    const publicCount = resources.filter((resource) => String(resource.accessPermission || '').toUpperCase() === 'PUBLIC').length
    const pdfCount = resources.filter((resource) => String(resource.fileFormat || '').toUpperCase() === 'PDF').length
    const deletedCount = resources.filter((resource) => resource.isDeleted).length

    return [
      { title: 'Tổng tài liệu số', value: totalElements.toLocaleString('vi-VN'), note: `Trang hiện tại: ${page + 1}/${totalPages}`, icon: FileText },
      { title: 'Tài liệu công khai', value: publicCount.toLocaleString('vi-VN'), note: 'Dữ liệu từ backend', icon: Globe2 },
      { title: 'Tệp PDF đang xem', value: pdfCount.toLocaleString('vi-VN'), note: `${deletedCount.toLocaleString('vi-VN')} bản ghi đã xóa mềm`, icon: Eye },
    ]
  }, [page, resources, totalElements, totalPages])

  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 1, totalPages - 3))
    const safeStart = Math.max(0, start)
    const end = Math.min(totalPages, safeStart + 3)
    return Array.from({ length: end - safeStart }, (_, index) => safeStart + index)
  }, [page, totalPages])

  return (
    <LibrarianLayout
      active="digital"
      title="Sách điện tử"
      description="Quản trị tài liệu số với dữ liệu thật từ backend catalog-service qua API Gateway."
      action={
        <Link to="/librarian/digital-books/add" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[13px] font-semibold text-white transition hover:bg-slate-800">
          <Plus size={16} />
          Thêm tài liệu mới
        </Link>
      }
    >
      <section className="grid gap-4 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Digital resources</p>
            <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Danh sách sách điện tử</h2>
          </div>
          <label className="flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-3 text-[13px] text-slate-500">
            <Search size={15} />
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              className="w-52 bg-transparent outline-none placeholder:text-slate-400"
              placeholder="Tìm theo tên, link, tác giả..."
            />
          </label>
        </div>

        {error && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50 text-[13px] font-semibold text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-5 py-4">Ảnh bìa</th>
                <th className="px-5 py-4">Thông tin sách</th>
                <th className="px-5 py-4">Định dạng</th>
                <th className="px-5 py-4">Đường dẫn tài liệu</th>
                <th className="px-5 py-4">Quyền truy cập</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Ngày tải lên</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4" colSpan={8}>
                        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : resources.map((resource) => {
                    const coverSources = getBookCoverSources(resource)
                    return (
                      <tr key={resource.resourceId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                            <BookCoverImage
                              src={coverSources}
                              alt={resource.bookTitle || 'Ảnh bìa sách'}
                              className="h-16 w-12 object-cover object-center"
                              fallback={<CoverFallback />}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-xs font-medium leading-6 text-slate-950">
                            {resource.bookTitle || `Sách #${resource.bookId || 'N/A'}`}
                          </p>
                          <p className="mt-1 text-[13px] text-slate-600">
                            {resource.author || 'Chưa cập nhật tác giả'}
                            {resource.categoryName ? ` • ${resource.categoryName}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-[13px] font-medium text-slate-700">{resource.fileFormat || 'Chưa cập nhật'}</td>
                        <td className="px-5 py-4 text-[13px] text-slate-700">
                          <a
                            href={getFileLink(resource.resourceUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex max-w-[280px] items-center gap-2 truncate text-sky-700 hover:text-sky-800"
                          >
                            <Eye size={14} />
                            {resource.resourceUrl || 'Chưa cập nhật'}
                          </a>
                        </td>
                        <td className="px-5 py-4">
                          <AccessBadge value={resource.accessPermission} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge isDeleted={resource.isDeleted} />
                        </td>
                        <td className="px-5 py-4 text-[13px] text-slate-600">{formatDate(resource.uploadedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {!resource.isDeleted && (
                              <>
                                <Link
                                  to={`/librarian/digital-books/${resource.resourceId}/edit`}
                                  className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                                  aria-label="Sửa sách điện tử"
                                >
                                  <Edit3 size={16} />
                                </Link>
                                <button
                                  onClick={() => setResourceToDelete(resource)}
                                  className="rounded-full p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                                  aria-label="Xóa sách điện tử"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                            {resource.isDeleted && (
                              <button
                                onClick={() => setResourceToRestore(resource)}
                                className="rounded-full p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                aria-label="Khôi phục sách điện tử"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              {!loading && resources.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                    Chưa có dữ liệu sách điện tử để hiển thị.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-[13px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hiển thị {resources.length === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} trên tổng số{' '}
            {totalElements.toLocaleString('vi-VN')} tài liệu số
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0 || loading}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-50"
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            {pageNumbers.map((item) => (
              <button
                key={item}
                onClick={() => setPage(item)}
                className={`h-9 w-9 rounded-xl border text-[13px] ${page === item ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
              >
                {item + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white disabled:opacity-50"
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <DeleteDigitalModal
        resource={resourceToDelete}
        deleting={deleting}
        onClose={() => setResourceToDelete(null)}
        onConfirm={handleDelete}
      />
      <RestoreDigitalModal
        resource={resourceToRestore}
        restoring={restoring}
        onClose={() => setResourceToRestore(null)}
        onConfirm={handleRestore}
      />
    </LibrarianLayout>
  )
}

export default LibrarianDigitalBooks
