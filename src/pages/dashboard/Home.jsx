import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getBooks } from '@/api/bookApi'
import BookCoverImage from '@/components/books/BookCoverImage'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { resolveBackendFileUrls } from '@/utils/fileUrl'

function getBookCoverUrl(coverImageUrl) {
  return resolveBackendFileUrls(coverImageUrl)
}

function normalizePage(data) {
  return { books: data?.content || [], totalElements: data?.totalElements || 0 }
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function isVisibleBook(book) {
  if (!book) return false
  if (book.isDeleted === true) return false
  if (book.deleted === true) return false
  if (book.deletedAt) return false
  if (['DELETED', 'ARCHIVED', 'INACTIVE'].includes(String(book.recordStatus || '').toUpperCase())) return false
  if (['DELETED', 'ARCHIVED', 'INACTIVE'].includes(String(book.status || '').toUpperCase())) return false
  if (['ARCHIVED', 'INACTIVE'].includes(String(book.availabilityStatus || '').toUpperCase())) return false
  return true
}

function BookCover({ book }) {
  const coverUrl = getBookCoverUrl(book.coverImageUrl)

  const fallbackCover = (
    <div className="grid h-full w-full place-items-center bg-slate-900 px-4 text-center text-white">
      <div className="grid h-28 w-24 place-items-center rounded-sm border border-white/15 bg-white/5">
        <BookOpen size={28} className="text-amber-300" />
      </div>
    </div>
  )

  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-100 p-3">
      <BookCoverImage src={coverUrl} alt={book.title} className="h-full w-full object-contain object-center" fallback={fallbackCover} />
    </div>
  )
}

function Home() {
  const [books, setBooks] = useState([])
  const [totalBooks, setTotalBooks] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const normalizedKeyword = normalizeText(keyword)

  useEffect(() => {
    let ignore = false

    async function loadBooks() {
      try {
        setLoading(true)
        setError('')

        const response = await getBooks({ size: 12 })
        const page = normalizePage(response.data)
        const visibleBackendBooks = page.books.filter(isVisibleBook)

        if (!ignore) {
          setBooks(visibleBackendBooks)
          setTotalBooks(visibleBackendBooks.length)
        }
      } catch {
        if (!ignore) {
          setError('Không tải được dữ liệu sách. Hãy kiểm tra API Gateway và catalog-service.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadBooks()
    return () => {
      ignore = true
    }
  }, [])

  const categories = useMemo(() => {
    const categoryMap = new Map()
    books.forEach((book) => {
      if (book.categoryName) categoryMap.set(book.categoryName, book.categoryName)
    })
    return Array.from(categoryMap.values())
  }, [books])

  const visibleBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesCategory = selectedCategory === 'all' || book.categoryName === selectedCategory
      const searchableText = normalizeText([
        book.title,
        book.author,
        book.isbn,
        book.categoryName,
        book.description,
      ].filter(Boolean).join(' '))
      const matchesKeyword = !normalizedKeyword || searchableText.includes(normalizedKeyword)
      return matchesCategory && matchesKeyword
    })
  }, [books, selectedCategory, normalizedKeyword])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[#06264a] px-4 py-10 text-center text-white sm:px-6 lg:px-8">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(30deg,rgba(255,255,255,.15)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.15)_87.5%,rgba(255,255,255,.15)),linear-gradient(150deg,rgba(255,255,255,.15)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.15)_87.5%,rgba(255,255,255,.15)),linear-gradient(30deg,rgba(255,255,255,.15)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.15)_87.5%,rgba(255,255,255,.15)),linear-gradient(150deg,rgba(255,255,255,.15)_12%,transparent_12.5%,transparent_87%,rgba(255,255,255,.15)_87.5%,rgba(255,255,255,.15))] [background-position:0_0,0_0,28px_49px,28px_49px] [background-size:56px_98px]" />
          <div className="relative mx-auto max-w-2xl">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px] lg:text-[42px]">
              <span className="mb-1 block text-amber-300">Readora</span>
              <span className="block">Chào mừng đến với</span>
              <span className="block">Kho tàng tri thức toàn cầu</span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-[13px] leading-6 text-slate-300 sm:text-sm">
              Tìm kiếm sách, tác giả và danh mục đang có thật trong hệ thống thư viện số.
            </p>

            <div className="mx-auto mt-6 flex max-w-xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xl sm:flex-row">
              <label className="flex flex-1 items-center gap-2.5 px-3 text-slate-500">
                <Search size={16} />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="h-10 w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500"
                  placeholder="Tìm tên sách, tác giả hoặc ISBN..."
                />
              </label>
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="h-10 border-t border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none sm:border-l sm:border-t-0">
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[26px] font-semibold tracking-tight sm:text-[30px]">Sách mới trong thư viện</h2>
            </div>
            <Link to="/books" className="hidden items-center gap-1 text-[13px] font-medium text-slate-700 hover:text-slate-950 sm:flex">
              Xem danh sách <ArrowRight size={15} />
            </Link>
          </div>

          {error && <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div id="books" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-md bg-white shadow-sm">
                    <div className="aspect-[3/4] rounded-t-md bg-slate-200" />
                    <div className="space-y-3 p-3.5">
                      <div className="h-4 rounded bg-slate-200" />
                      <div className="h-4 w-2/3 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                ))
              : visibleBooks.map((book) => (
                  <article key={book.bookId} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                    <Link to={`/books/${book.bookId}`} className="block">
                      <BookCover book={book} />
                    </Link>
                    <div className="p-3.5">
                      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <span className="truncate">{book.categoryName || 'Chưa phân loại'}</span>
                        <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">{book.availabilityStatus || 'N/A'}</span>
                      </div>
                      <Link to={`/books/${book.bookId}`} className="mt-3 block line-clamp-2 min-h-11 text-[15px] font-semibold leading-6 hover:text-amber-700">
                        {book.title}
                      </Link>
                      <p className="mt-1.5 line-clamp-1 text-[13px] text-slate-600">{book.author}</p>
                      <p className="mt-2.5 line-clamp-3 min-h-14 text-[13px] leading-6 text-slate-500">{book.description || 'Chưa có mô tả cho tài liệu này.'}</p>
                      <div className="mt-3 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-slate-700">{book.publicationYear || 'Không rõ năm'}</span>
                        <span className="text-slate-500">{book.language || 'N/A'}</span>
                      </div>
                    </div>
                  </article>
                ))}
          </div>

          {!loading && visibleBooks.length === 0 && <div className="mt-6 rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">Không có sách phù hợp với bộ lọc hiện tại.</div>}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
