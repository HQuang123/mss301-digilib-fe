import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Check, ChevronLeft, ChevronRight, Loader2, Search, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getBookById, getBooks, searchBooks } from '@/api/bookApi'
import { checkBorrowEligibility, createBorrowRequest, getMyBorrowRequests } from '@/api/loanApi'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { createBookNameMap } from '@/utils/book'

const PAGE_SIZE = 12

function messageOf(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.detail || fallback
}

function statusLabel(status) {
  return ({ PENDING: 'Đang chờ duyệt', BORROWED: 'Đã duyệt · Đang mượn', OVERDUE: 'Đã duyệt · Quá hạn', RETURNED: 'Đã duyệt · Đã trả', LOST: 'Đã duyệt · Đã mất', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' })[status] || status
}

function LoanRequestPage() {
  const [searchParams] = useSearchParams()
  const initialBookId = searchParams.get('bookId')
  const [books, setBooks] = useState([])
  const [requests, setRequests] = useState([])
  const [bookNames, setBookNames] = useState(() => new Map())
  const [selectedBook, setSelectedBook] = useState(null)
  const [bookType, setBookType] = useState('PHYSICAL')
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const [eligibility, setEligibility] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const bookRequest = submittedKeyword
        ? searchBooks({ keyword: submittedKeyword, page, size: PAGE_SIZE })
        : getBooks({ page, size: PAGE_SIZE })
      const [bookResponse, requestResponse, allBooksResponse] = await Promise.all([
        bookRequest,
        getMyBorrowRequests({ size: 50 }),
        getBooks({ page: 0, size: 500, sort: 'title,asc' }),
      ])
      setBooks(bookResponse.data?.content || [])
      setTotalPages(Math.max(bookResponse.data?.totalPages || 1, 1))
      setRequests(requestResponse.data?.content || [])
      setBookNames(createBookNameMap(allBooksResponse.data))
    } catch (requestError) {
      setError(messageOf(requestError, 'Không thể tải danh mục sách hoặc yêu cầu hiện tại.'))
    } finally {
      setLoading(false)
    }
  }, [page, submittedKeyword])

  useEffect(() => {
    // The request owns the loading state for this page transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    if (!initialBookId) return
    let ignore = false
    getBookById(initialBookId)
      .then((response) => { if (!ignore) setSelectedBook(response.data) })
      .catch(() => { if (!ignore) setError('Không tìm thấy sách được chọn.') })
    return () => { ignore = true }
  }, [initialBookId])

  function search(event) {
    event.preventDefault()
    setSubmittedKeyword(keyword.trim())
    setPage(0)
  }

  async function submitRequest() {
    if (!selectedBook?.bookId || !eligibility?.eligible) return
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await createBorrowRequest({
        bookId: Number(selectedBook.bookId),
        bookType,
        idempotencyKey: `loan-request-${selectedBook.bookId}-${Date.now()}`,
      })
      setRequests((current) => [response.data, ...current])
      setNotice(`Yêu cầu mượn #${response.data.requestId} đã được tạo và đang chờ duyệt.`)
      setSelectedBook(null)
      setEligibility(null)
    } catch (requestError) {
      setError(messageOf(requestError, 'Không thể tạo yêu cầu mượn. Bạn có thể đã có yêu cầu đang chờ cho sách này.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function checkEligibility() {
    setCheckingEligibility(true)
    setEligibility(null)
    setError('')
    setNotice('')
    try {
      const response = await checkBorrowEligibility()
      setEligibility(response.data)
      setNotice('Bạn đủ điều kiện tạo yêu cầu mượn sách.')
    } catch (requestError) {
      setError(messageOf(requestError, 'Bạn chưa đủ điều kiện mượn sách. Vui lòng kiểm tra khoản phạt và hạn mức.'))
    } finally {
      setCheckingEligibility(false)
    }
  }

  const pendingBookIds = new Set(requests.filter((item) => item.status === 'PENDING').map((item) => Number(item.bookId)))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fcfbf7,#f8fafc_45%,#eef4fb)] text-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Loan service</p><h1 className="mt-2 font-serif text-3xl font-semibold">Tạo yêu cầu mượn sách</h1><p className="mt-2 text-sm text-slate-600">Chọn sách và gửi yêu cầu. Hạn mượn và bản sao chỉ được cấp sau khi librarian hoặc admin duyệt.</p></div>
          <Link to="/loans" className="text-sm font-semibold text-slate-700 underline underline-offset-4">Xem khoản mượn của tôi</Link>
        </div>

        {notice && <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><Check size={16} />{notice}</div>}
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <form onSubmit={search} className="flex gap-2"><label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-300 px-3"><Search size={15} className="text-slate-400" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="w-full text-sm outline-none" placeholder="Tìm tên sách, tác giả hoặc ISBN..." /></label><button className="rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">Tìm</button></form>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-slate-100" />) : books.map((book) => {
                const pending = pendingBookIds.has(Number(book.bookId))
                const selected = selectedBook?.bookId === book.bookId
                return <button type="button" key={book.bookId} onClick={() => { if (!pending) { setSelectedBook(book); setEligibility(null); setError(''); setNotice('') } }} disabled={pending} className={`min-h-44 rounded-xl border p-4 text-left transition ${selected ? 'border-slate-950 bg-slate-50 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-400'} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60`}><BookOpen size={20} className="text-sky-700" /><h2 className="mt-4 line-clamp-2 font-serif text-base font-semibold">{book.title}</h2><p className="mt-2 line-clamp-1 text-xs text-slate-500">{book.author || 'Chưa cập nhật tác giả'}</p><p className={`mt-4 text-xs font-semibold ${pending ? 'text-amber-700' : 'text-emerald-700'}`}>{pending ? 'Đã có yêu cầu chờ duyệt' : 'Chọn sách này'}</p></button>
              })}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500"><span>Trang {page + 1}/{totalPages}</span><div className="flex gap-2"><button onClick={() => setPage((value) => Math.max(value - 1, 0))} disabled={page === 0 || loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 disabled:opacity-40"><ChevronLeft size={16} /></button><button onClick={() => setPage((value) => Math.min(value + 1, totalPages - 1))} disabled={page >= totalPages - 1 || loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Yêu cầu mượn</p><h2 className="mt-2 font-serif text-xl font-semibold">Xác nhận yêu cầu</h2>
            {selectedBook ? <><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">{selectedBook.title}</p><p className="mt-1 text-xs text-slate-500">Mã sách: {selectedBook.bookId}</p></div><fieldset className="mt-5"><legend className="text-sm font-semibold">Loại mượn</legend><div className="mt-2 grid grid-cols-2 gap-2">{['PHYSICAL', 'DIGITAL'].map((type) => <label key={type} className={`cursor-pointer rounded-xl border p-3 text-xs font-semibold ${bookType === type ? 'border-slate-950 bg-slate-50' : 'border-slate-200'}`}><input type="radio" className="mr-2" checked={bookType === type} onChange={() => { setBookType(type); setEligibility(null) }} />{type === 'PHYSICAL' ? 'Sách vật lý' : 'Sách số'}</label>)}</div></fieldset><button onClick={checkEligibility} disabled={checkingEligibility} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 disabled:opacity-50">{checkingEligibility ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}{checkingEligibility ? 'Đang kiểm tra...' : 'Kiểm tra điều kiện mượn'}</button>{eligibility?.eligible && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><p className="font-semibold">Đủ điều kiện mượn</p><p>Đang mượn/quá hạn: {eligibility.activeLoans}/{eligibility.borrowingLimit}</p><p>Còn lại: {eligibility.remainingSlots} lượt · Thời hạn: {eligibility.loanPeriodDays} ngày</p></div>}<button onClick={submitRequest} disabled={submitting || !eligibility?.eligible} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{submitting ? 'Đang gửi...' : eligibility?.eligible ? 'Gửi yêu cầu chờ duyệt' : 'Kiểm tra trước khi gửi'}</button></> : <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">Chọn một cuốn sách trong danh mục để tạo yêu cầu.</p>}
          </aside>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">Yêu cầu gần đây</h2><div className="mt-4 divide-y divide-slate-100">{requests.slice(0, 5).map((request) => <div key={request.requestId} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{bookNames.get(String(request.bookId)) || 'Chưa có tên sách'} · Loan #{request.requestId}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{statusLabel(request.status)}</span></div>)}{requests.length === 0 && <p className="py-4 text-sm text-slate-500">Bạn chưa có yêu cầu nào.</p>}</div></section>
      </main>
      <Footer />
    </div>
  )
}

export default LoanRequestPage
