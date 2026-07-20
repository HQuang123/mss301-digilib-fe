import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Globe2,
  History,
  Library,
  MapPin,
  Star,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getBookById, getBookCopiesByBookId, getBooks, getDigitalResources } from '@/api/bookApi'
import BookCoverImage from '@/components/books/BookCoverImage'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { resolveBackendFileUrl, resolveBackendFileUrls } from '@/utils/fileUrl'

const fallbackBook = {
  bookId: 'demo-1',
  title: 'Cơ sở dữ liệu và Hệ quản trị tri thức',
  author: 'GS. Nguyễn Văn A',
  categoryName: 'Công nghệ thông tin',
  publicationYear: 2023,
  language: 'Tiếng Việt',
  availabilityStatus: 'ACTIVE',
  borrowCount: 1200,
  rating: 4.8,
  description:
    'Cuốn giáo trình cung cấp cái nhìn toàn diện về kiến thức dữ liệu hiện đại, từ mô hình quan hệ, SQL đến cách tổ chức tri thức trong thư viện số.',
  summary:
    'Sách phù hợp cho sinh viên, giảng viên và người nghiên cứu đang cần nền tảng lý thuyết kết hợp ví dụ thực tiễn.',
  isbn: '978-604-123-456-7',
  publisher: 'Readora Academic Press',
  pages: 428,
}

const fallbackRelatedBooks = [
  { bookId: 'related-1', title: 'Kỹ thuật tri thức và Hệ chuyên gia', author: 'Lê Văn B.', code: 'DDC 006' },
  { bookId: 'related-2', title: 'Cơ sở dữ liệu phân tán', author: 'Trần Thị C.' },
  { bookId: 'related-3', title: 'Phân tích dữ liệu lớn', author: 'Hoàng Minh D.' },
  { bookId: 'related-4', title: 'Quản trị Hệ thống thông tin', author: 'Phạm Tuấn E.' },
  { bookId: 'related-5', title: 'Ngôn ngữ truy vấn SQL nâng cao', author: 'Đặng Vân F.' },
]

function getBookCoverUrl(coverImageUrl) {
  return resolveBackendFileUrls(coverImageUrl)
}

function formatBorrowCount(value) {
  const count = Number(value || 0)
  if (count >= 1000) return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`
  return count.toLocaleString('vi-VN')
}

function getAvailableCopies(book) {
  return Number(book.availableCopies ?? book.availableQuantity ?? book.copyAvailable ?? 0)
}

function normalizeBookId(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : value
}

function getReadableResourceUrl(resource) {
  if (!resource || resource.isDeleted) return null
  return resolveBackendFileUrl(resource.resourceUrl)
}

function normalizeLanguage(value) {
  const normalized = String(value || '').toUpperCase()
  if (normalized === 'VIETNAMESE') return 'Tiếng Việt'
  if (normalized === 'ENGLISH') return 'Tiếng Anh'
  return value || 'Tiếng Việt'
}

function getAvailabilityLabel(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized.includes('BORROW')) return 'Đang mượn'
  if (normalized.includes('MAINT')) return 'Bảo trì'
  if (normalized.includes('OVERDUE')) return 'Quá hạn'
  if (normalized.includes('LOST')) return 'Thất lạc'
  return 'Sẵn sàng'
}

function getCopyStatusSummary(bookCopies, fallbackAvailableCopies) {
  if (bookCopies.length === 0) {
    return [{ key: 'AVAILABLE', label: 'Sẵn sàng', count: Number(fallbackAvailableCopies || 0), tone: 'emerald' }]
  }

  const counts = bookCopies.reduce((accumulator, copy) => {
    const status = String(copy.copyStatus || 'UNKNOWN').toUpperCase()
    accumulator[status] = (accumulator[status] || 0) + 1
    return accumulator
  }, {})

  return [
    { key: 'AVAILABLE', label: 'Sẵn sàng', count: counts.AVAILABLE || 0, tone: 'emerald' },
    { key: 'BORROWED', label: 'Đang mượn', count: counts.BORROWED || counts.BORROWING || 0, tone: 'amber' },
    { key: 'MAINTENANCE', label: 'Bảo trì', count: counts.MAINTENANCE || counts.MAINTAINING || 0, tone: 'slate' },
    { key: 'OVERDUE', label: 'Quá hạn', count: counts.OVERDUE || 0, tone: 'rose' },
    { key: 'LOST', label: 'Thất lạc', count: counts.LOST || 0, tone: 'rose' },
  ].filter((item) => item.count > 0)
}

function DetailCover({ book }) {
  const coverUrl = getBookCoverUrl(book.coverImageUrl)
  const fallbackCover = (
    <div className="relative flex h-full w-full items-center justify-center rounded border border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
      <div className="relative h-[330px] w-[230px] rotate-[-4deg] rounded-sm bg-[#092b45] shadow-2xl">
        <div className="absolute inset-y-0 left-0 w-8 rounded-l-sm bg-[#06172a]" />
        <div className="absolute inset-x-10 top-20 h-px bg-cyan-300/70" />
        <div className="absolute inset-x-12 top-28 h-px bg-cyan-300/30" />
        <div className="absolute inset-x-10 bottom-20 h-28 border border-cyan-300/40" />
        <p className="absolute inset-x-8 top-32 text-center text-sm font-bold uppercase leading-6 text-white">
          {book.title}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded bg-slate-100 p-4">
      <BookCoverImage
        src={coverUrl}
        alt={book.title}
        className="h-full w-full rounded border border-slate-300 bg-white object-contain object-center"
        fallback={fallbackCover}
      />
    </div>
  )
}

function RelatedCover({ book, index }) {
  const coverUrl = getBookCoverUrl(book.coverImageUrl)
  const variants = [
    'from-[#0d3b3d] via-[#0f5a55] to-[#021314]',
    'from-[#eef2f6] via-[#0b4b73] to-[#05243c]',
    'from-[#6f9291] via-[#174456] to-[#091923]',
    'from-[#132f35] via-[#33505a] to-[#081418]',
    'from-[#f8fafc] via-[#152234] to-[#020817]',
  ]

  const fallbackCover = (
    <div className={`relative h-full w-full rounded border border-slate-300 bg-gradient-to-br ${variants[index % variants.length]} p-6`}>
      {book.code && (
        <span className="absolute right-3 top-3 rounded-sm bg-white px-2 py-1 text-xs font-bold text-slate-950">
          {book.code}
        </span>
      )}
      <div className="mx-auto mt-8 h-36 w-24 rounded-sm border border-white/20 bg-black/20 shadow-2xl" />
      <p className="absolute inset-x-6 top-24 text-center text-xs font-bold uppercase tracking-wide text-white">
        {book.title}
      </p>
    </div>
  )

  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded bg-slate-100 p-2.5">
      <BookCoverImage
        src={coverUrl}
        alt={book.title}
        className="h-full w-full rounded border border-slate-300 bg-white object-contain object-center"
        fallback={fallbackCover}
      />
    </div>
  )
}

function BookDetail() {
  const { bookId } = useParams()
  const [book, setBook] = useState({})
  const [relatedBooks, setRelatedBooks] = useState(fallbackRelatedBooks)
  const [bookCopies, setBookCopies] = useState([])
  const [digitalResourceUrl, setDigitalResourceUrl] = useState(null)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    let ignore = false

    async function loadFallbackBook() {
      const response = await getBooks({ page: 0, size: 100, sort: 'bookId,asc' })
      const books = response.data?.content || []
      const matchedBook = books.find((item) => normalizeBookId(item.bookId) === normalizeBookId(bookId))

      if (!matchedBook) throw new Error('Fallback book not found')

      if (!ignore) {
        setBook(matchedBook || {})
      }
    }

    async function loadBookCopies() {
      try {
        const response = await getBookCopiesByBookId({ bookId, size: 50 })
        if (!ignore) {
          setBookCopies(response.data?.content || [])
        }
      } catch {
        if (!ignore) {
          setBookCopies([])
        }
      }
    }

    async function loadBook() {
      try {
        const response = await getBookById(bookId)
        if (!ignore) {
          setBook(response.data || {})
        }
      } catch {
        try {
          await loadFallbackBook()
        } catch {
          if (!ignore) {
            setBook(fallbackBook)
          }
        }
      }
    }

    if (bookId) {
      loadBook()
      loadBookCopies()
    }

    return () => {
      ignore = true
    }
  }, [bookId])

  useEffect(() => {
    let ignore = false

    async function loadDigitalResource() {
      try {
        const response = await getDigitalResources({ page: 0, size: 500, sort: 'resourceId,asc' })
        const resources = response.data?.content || []
        const matchedResource = resources.find((item) => normalizeBookId(item.bookId) === normalizeBookId(bookId) && !item.isDeleted)

        if (!ignore) {
          setDigitalResourceUrl(getReadableResourceUrl(matchedResource))
        }
      } catch {
        if (!ignore) {
          setDigitalResourceUrl(null)
        }
      }
    }

    if (bookId) {
      loadDigitalResource()
    }

    return () => {
      ignore = true
    }
  }, [bookId])

  useEffect(() => {
    let ignore = false

    async function loadRelatedBooks() {
      try {
        const response = await getBooks({ size: 5 })
        const books = response.data?.content || []

        if (!ignore && books.length > 0) {
          setRelatedBooks(books.filter((item) => normalizeBookId(item.bookId) !== normalizeBookId(bookId)).slice(0, 5))
        }
      } catch {
        if (!ignore) {
          setRelatedBooks(fallbackRelatedBooks)
        }
      }
    }

    loadRelatedBooks()

    return () => {
      ignore = true
    }
  }, [bookId])

  const detailRows = useMemo(
    () => [
      ['ISBN', book.isbn || 'Đang cập nhật'],
      ['Nhà xuất bản', book.publisher || 'Readora Academic Press'],
      ['Năm xuất bản', book.publicationYear || 'Đang cập nhật'],
      ['Số trang', book.pages || book.pageCount || 'Đang cập nhật'],
      ['Chủ đề', book.categoryName || 'Chưa phân loại'],
    ],
    [book],
  )

  const availableCopies = useMemo(() => {
    if (bookCopies.length > 0) {
      return bookCopies.filter((copy) => String(copy.copyStatus || '').toUpperCase() === 'AVAILABLE').length
    }
    return getAvailableCopies(book)
  }, [book, bookCopies])

  const totalCopies = bookCopies.length || getAvailableCopies(book)
  const copyStatusSummary = useMemo(() => getCopyStatusSummary(bookCopies, getAvailableCopies(book)), [book, bookCopies])
  const primaryCopy = bookCopies[0]
  const shelfLocation = primaryCopy?.shelfLocation || book.shelfLocation || 'Đang cập nhật'
  const availabilityLabel = getAvailabilityLabel(book.availabilityStatus)
  const isAvailable = availableCopies > 0 || availabilityLabel === 'Sẵn sàng'
  const availabilityBarWidth = totalCopies > 0 ? `${Math.max(15, Math.round((availableCopies / totalCopies) * 100))}%` : '0%'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link to="/books" className="inline-flex items-center gap-2 text-sm font-bold text-slate-950 hover:text-amber-700">
            <ArrowLeft size={18} />
            Quay lại danh mục
          </Link>

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Trang chủ &gt; {book.categoryName || 'Danh mục'} &gt; {book.title || 'Đang cập nhật'}
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr_300px]">
            <div className="h-fit">
              <DetailCover book={book} />
            </div>

            <section>
              <h1 className="font-serif text-3xl font-bold leading-tight text-slate-950 lg:text-[40px]">{book.title || 'Đang cập nhật'}</h1>
              <p className="mt-3 text-lg italic text-slate-600">{book.author || 'Chưa cập nhật tác giả'}</p>

              <div className="mt-6 grid gap-4 border-y border-slate-300 py-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-600">Đánh giá</p>
                  <p className="mt-1 flex items-center gap-1 text-xl font-semibold">
                    <Star size={20} className="fill-[#8a7600] text-[#8a7600]" />
                    {book.rating || 4.8}
                    <span className="text-sm font-normal text-slate-600">/ 5</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-600">Lượt mượn</p>
                  <p className="mt-1 flex items-center gap-2 text-xl font-semibold">
                    <Library size={20} />
                    {formatBorrowCount(book.borrowCount || 1200)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-600">Ngôn ngữ</p>
                  <p className="mt-1 flex items-center gap-2 font-serif text-xl font-semibold">
                    <Globe2 size={20} />
                    {normalizeLanguage(book.language)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <button className="inline-flex h-14 items-center justify-center gap-3 rounded bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800">
                  <BookOpen size={22} />
                  Đăng ký mượn sách
                </button>
                {digitalResourceUrl ? (
                  <a
                    href={digitalResourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-14 items-center justify-center gap-3 rounded border-2 border-slate-950 px-6 text-sm font-bold text-slate-950 transition hover:bg-white"
                  >
                    <FileText size={22} />
                    Đọc bản điện tử
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-14 items-center justify-center gap-3 rounded border-2 border-slate-300 px-6 text-sm font-bold text-slate-400"
                  >
                    <FileText size={22} />
                    Chưa có bản điện tử
                  </button>
                )}
              </div>

              <div className="mt-8 border-b border-slate-300">
                {[
                  ['description', 'Mô tả'],
                  ['detail', 'Thông tin chi tiết'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setActiveTab(value)}
                    className={`mr-8 border-b-2 px-6 py-4 text-sm font-bold ${
                      activeTab === value ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'description' ? (
                <div className="mt-6 max-w-xl space-y-4 text-[15px] leading-7 text-slate-800">
                  <p>{book.description || 'Chưa cập nhật mô tả.'}</p>
                  <p>{book.summary || 'Chưa cập nhật tóm tắt.'}</p>
                </div>
              ) : (
                <dl className="mt-6 max-w-xl divide-y divide-slate-200 rounded border border-slate-200 bg-white">
                  {detailRows.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-3 text-sm">
                      <dt className="font-bold text-slate-600">{label}</dt>
                      <dd className="text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>

            <aside className="space-y-6">
              <section className="overflow-hidden rounded border border-slate-300 bg-white">
                <h2 className="border-b border-slate-300 bg-slate-200 px-6 py-4 text-sm font-bold uppercase tracking-wide">
                  Tình trạng khả dụng
                </h2>

                <div className="p-6">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-300 pb-6">
                    <div className="flex items-center gap-4">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#092b51] text-white">
                        <MapPin size={18} />
                      </span>
                      <div>
                        <p className="font-bold">{book.locationName || 'Chưa cập nhật'}</p>
                        <p className="text-sm text-slate-600">{shelfLocation}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold uppercase ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {availabilityLabel}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Tổng số bản trong kho:</span>
                    <strong className="text-lg">{String(totalCopies).padStart(2, '0')} bản</strong>
                  </div>
                  <div className="mt-3 h-1 bg-slate-200">
                    <div className="h-full bg-emerald-500" style={{ width: availabilityBarWidth }} />
                  </div>

                  <div className="mt-4 grid gap-2">
                    {copyStatusSummary.map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.tone === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.tone === 'amber'
                                ? 'bg-amber-100 text-amber-700'
                                : item.tone === 'rose'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.count} bản
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded border border-slate-300 bg-white p-6">
                <h2 className="font-bold text-slate-700">Lịch sử cá nhân</h2>
                <p className="mt-5 flex items-center gap-4 text-sm text-slate-600">
                  <History size={22} />
                  Bạn chưa từng mượn cuốn sách này.
                </p>
              </section>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="font-serif text-3xl font-semibold">Sách liên quan</h2>
              <p className="mt-1 text-sm text-slate-600">Khám phá các tài liệu khác cùng chủ đề</p>
            </div>
            <Link to="/books" className="hidden items-center gap-1 text-sm font-bold hover:text-amber-700 sm:flex">
              Xem tất cả <ArrowRight size={20} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {relatedBooks.map((item, index) => (
              <Link key={item.bookId || `${item.title}-${index}`} to={`/books/${item.bookId || `related-${index + 1}`}`} className="group block">
                <RelatedCover book={item} index={index} />
                <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-5 group-hover:text-amber-700">{item.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-slate-600">{item.author || 'Chưa cập nhật'}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default BookDetail
