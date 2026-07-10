import { useEffect, useMemo, useState } from 'react'
import { Building2, CalendarDays, ChevronDown, Hash, Save, UserRoundCog } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBookCopy, getBookCopies, getBookCopyById, getBooks, updateBookCopy } from '@/api/bookApi'
import LibrarianLayout from './LibrarianLayout'

const emptyForm = {
  bookId: '',
  barcode: '',
  shelfLocation: '',
  acquisitionDate: '',
  copyStatus: 'AVAILABLE',
}

function isSelectableBook(book) {
  if (!book) return false
  if (book.isDeleted === true || book.deleted === true || book.deletedAt) return false
  if (['DELETED', 'ARCHIVED', 'INACTIVE'].includes(String(book.recordStatus || '').toUpperCase())) return false
  if (['DELETED', 'ARCHIVED', 'INACTIVE'].includes(String(book.status || '').toUpperCase())) return false
  if (['ARCHIVED', 'INACTIVE'].includes(String(book.availabilityStatus || '').toUpperCase())) return false
  return true
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-2 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, icon: Icon, type = 'text', disabled }) {
  return (
    <div className="relative">
      {Icon && <Icon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        className={`h-11 w-full rounded-2xl border border-slate-300 px-4 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-100 ${Icon ? 'pl-11' : ''}`}
      />
    </div>
  )
}

function SelectInput({ value, onChange, children, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 text-[14px] text-slate-800 outline-none disabled:bg-slate-100"
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function formatBookCode(bookId) {
  if (!bookId) return 'Sẽ hiển thị sau khi chọn'
  return `BK${String(bookId).padStart(4, '0')}`
}

function formatDateForInput(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)

  return date.toISOString().slice(0, 10)
}

function buildNextBarcode(copies) {
  const matchedBarcodes = (copies || [])
    .map((copy) => String(copy.barcode || '').trim())
    .map((barcode) => barcode.match(/^([A-Za-z]+)(\d+)$/))
    .filter(Boolean)

  if (matchedBarcodes.length === 0) {
    return 'BC000001'
  }

  const prefixCount = matchedBarcodes.reduce((map, [, prefix]) => {
    map.set(prefix, (map.get(prefix) || 0) + 1)
    return map
  }, new Map())

  const [selectedPrefix] = [...prefixCount.entries()].sort((left, right) => right[1] - left[1])[0]
  const digitWidth = Math.max(...matchedBarcodes.map(([, , digits]) => digits.length))
  const maxValue = Math.max(
    ...matchedBarcodes
      .filter(([, prefix]) => prefix === selectedPrefix)
      .map(([, , digits]) => Number(digits)),
  )

  return `${selectedPrefix}${String(maxValue + 1).padStart(digitWidth, '0')}`
}

function buildShelfLocationOptions(copies) {
  const existingLocations = [...new Set(
    (copies || [])
      .map((copy) => String(copy.shelfLocation || '').trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right, 'vi'))

  if (existingLocations.length > 0) {
    return existingLocations
  }

  return ['A1-01', 'A1-02', 'A1-03', 'B1-01', 'B1-02', 'C1-01']
}

function LibrarianInventoryForm({ mode = 'add' }) {
  const { copyId } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'

  const [form, setForm] = useState(emptyForm)
  const [books, setBooks] = useState([])
  const [shelfLocationOptions, setShelfLocationOptions] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      try {
        const [booksResponse, copiesResponse] = await Promise.all([
          getBooks({ page: 0, size: 5000, sort: 'bookId,asc' }),
          getBookCopies({ page: 0, size: 5000, sort: 'copyId,asc' }),
        ])
        const nextBooks = (booksResponse.data?.content || []).filter(isSelectableBook)
        const nextCopies = copiesResponse.data?.content || []

        if (ignore) return
        setBooks(nextBooks)
        setShelfLocationOptions(buildShelfLocationOptions(nextCopies))

        if (!isEdit || !copyId) {
          setForm((current) => ({
            ...current,
            barcode: current.barcode || buildNextBarcode(nextCopies),
          }))
          return
        }

        const copyResponse = await getBookCopyById(copyId)
        const copy = copyResponse.data || {}
        const matchedBook = nextBooks.find((book) => String(book.bookId) === String(copy.bookId)) || null

        if (!ignore) {
          setForm({
            bookId: copy.bookId ? String(copy.bookId) : '',
            barcode: copy.barcode || '',
            shelfLocation: copy.shelfLocation || '',
            acquisitionDate: formatDateForInput(copy.acquisitionDate),
            copyStatus: copy.copyStatus || 'AVAILABLE',
          })
          setSelectedBook(matchedBook)
        }
      } catch {
        if (!ignore) {
          setSubmitError('Không tải được thông tin bản sao từ backend.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [copyId, isEdit])

  useEffect(() => {
    if (!form.bookId) {
      setSelectedBook(null)
      return
    }

    const matchedBook = books.find((book) => String(book.bookId) === String(form.bookId)) || null
    setSelectedBook(matchedBook)
  }, [books, form.bookId])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const copyCode = useMemo(() => {
    if (!copyId) return 'Tự động tạo sau khi lưu'
    return `COPY-${copyId}`
  }, [copyId])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    if (!form.barcode.trim() || !form.shelfLocation.trim() || !form.acquisitionDate || !form.copyStatus) {
      setSubmitError('Vui lòng nhập đầy đủ mã vạch, vị trí kệ, ngày nhập và trạng thái.')
      return
    }

    if (!isEdit && !form.bookId) {
      setSubmitError('Vui lòng chọn đầu sách cho bản sao mới.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        barcode: form.barcode.trim(),
        shelfLocation: form.shelfLocation.trim(),
        acquisitionDate: form.acquisitionDate,
        copyStatus: form.copyStatus,
        userId: 1,
      }

      if (isEdit && copyId) {
        await updateBookCopy(copyId, payload)
      } else {
        await createBookCopy(Number(form.bookId), payload)
      }

      navigate('/librarian/inventory')
    } catch (error) {
      const serverMessage = error?.response?.data?.message
      setSubmitError(serverMessage || 'Lưu thông tin bản sao thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <LibrarianLayout
      active="inventory"
      title={isEdit ? 'Chỉnh sửa bản sao' : 'Thêm bản sao mới'}
      description={
        isEdit
          ? 'Cập nhật trạng thái lưu thông, mã vạch và vị trí kệ của bản sao trực tiếp từ backend.'
          : 'Tạo thêm bản sao mới với giao diện đồng bộ cùng form admin.'
      }
    >
      <form onSubmit={handleSubmit}>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 p-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Sách gốc</p>
              <h2 className="mt-2 font-serif text-[22px] font-semibold tracking-tight text-slate-950">
                {selectedBook?.title || 'Chọn đầu sách để liên kết'}
              </h2>
              <p className="mt-1 text-[13px] text-slate-600">Mã đầu sách: {formatBookCode(form.bookId)}</p>
            </div>
          </div>

          <div className="p-5">
            {submitError && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}
            {loading && <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Đang tải thông tin bản sao...</div>}

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Mã vạch" required>
                {isEdit ? (
                  <TextInput value={form.barcode} onChange={(event) => updateField('barcode', event.target.value)} placeholder="Ví dụ: 123456789" icon={Hash} />
                ) : (
                  <TextInput value={form.barcode} placeholder="Hệ thống tự tạo mã vạch" icon={Hash} disabled />
                )}
              </Field>
              <Field label="Vị trí kệ" required>
                {isEdit ? (
                  <TextInput value={form.shelfLocation} onChange={(event) => updateField('shelfLocation', event.target.value)} placeholder="Ví dụ: A-102-04" icon={Building2} />
                ) : (
                  <SelectInput value={form.shelfLocation} onChange={(event) => updateField('shelfLocation', event.target.value)}>
                    <option value="">Chọn vị trí kệ...</option>
                    {shelfLocationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </SelectInput>
                )}
              </Field>
              <Field label="Ngày nhập kho" required>
                <TextInput value={form.acquisitionDate} onChange={(event) => updateField('acquisitionDate', event.target.value)} type="date" icon={CalendarDays} />
              </Field>
              <Field label="Trạng thái hiện tại" required>
                <SelectInput value={form.copyStatus} onChange={(event) => updateField('copyStatus', event.target.value)}>
                  <option value="AVAILABLE">Sẵn sàng</option>
                  <option value="BORROWED">Đang mượn</option>
                  <option value="RESERVED">Đã đặt trước</option>
                  <option value="DAMAGED">Hỏng</option>
                  <option value="LOST">Thất lạc</option>
                  <option value="DRAFT">Bản nháp</option>
                </SelectInput>
              </Field>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_260px]">
              <Field
                label="Đầu sách"
                required={!isEdit}
                hint={isEdit ? 'Đầu sách được giữ nguyên khi cập nhật bản sao.' : 'Chọn đầu sách sẽ sở hữu bản sao này.'}
              >
                <SelectInput value={form.bookId} onChange={(event) => updateField('bookId', event.target.value)} disabled={isEdit}>
                  <option value="">Chọn đầu sách...</option>
                  {books.map((book) => (
                    <option key={book.bookId} value={book.bookId}>
                      {formatBookCode(book.bookId)} - {book.title}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">
                <p className="flex items-center gap-2 font-medium text-slate-800">
                  <UserRoundCog size={16} />
                  Thông tin cập nhật
                </p>
                <p className="mt-3">Mã bản sao: {copyCode}</p>
                <p className="mt-1">Người xử lý: Librarian User</p>
                <p className="mt-1">Đầu sách: {selectedBook?.title || 'Chưa chọn'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
              <Link to="/librarian/inventory" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700">
                Hủy
              </Link>
              <button type="submit" disabled={saving || loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                <Save size={16} />
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật thông tin' : 'Lưu thông tin'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </LibrarianLayout>
  )
}

export default LibrarianInventoryForm
