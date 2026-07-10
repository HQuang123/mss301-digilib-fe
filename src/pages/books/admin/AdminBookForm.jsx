import { useEffect, useRef, useState } from 'react'
import { ChevronDown, FileImage, ImageUp, Info, Save, Upload, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBook, getBookById, getBooks, getCategories, getClassifications, updateBook, updateBookStatus, uploadBookCover } from '@/api/bookApi'
import BookCoverImage from '@/components/books/BookCoverImage'
import AdminLayout from '@/components/layout/AdminLayout'
import { resolveBackendFileUrls } from '@/utils/fileUrl'

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

const emptyForm = {
  isbn: '',
  title: '',
  author: '',
  publisher: '',
  publicationYear: '',
  edition: '',
  language: 'Tiếng Việt',
  description: '',
  categoryId: '',
  classificationId: '',
  availabilityStatus: 'ACTIVE',
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function buildFormFromBook(book = {}) {
  return {
    isbn: book.isbn || '',
    title: book.title || '',
    author: book.author || '',
    publisher: book.publisher || '',
    publicationYear: book.publicationYear ? String(book.publicationYear) : '',
    edition: book.edition || '',
    language: book.language || 'Tiếng Việt',
    description: book.description || '',
    categoryId: book.categoryId ? String(book.categoryId) : '',
    classificationId: book.classificationId ? String(book.classificationId) : '',
    availabilityStatus: book.availabilityStatus || 'ACTIVE',
  }
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4 text-slate-900">
        <Icon size={18} />
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">{title}</h2>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  )
}

function Field({ label, required, hint, children }) {
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

function TextInput({ value, onChange, placeholder, disabled, type = 'text' }) {
  return (
    <input
      value={value}
      onChange={onChange}
      disabled={disabled}
      type={type}
      placeholder={placeholder}
      className={`h-11 w-full rounded-2xl border border-slate-300 px-4 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 ${
        disabled ? 'bg-slate-100' : 'bg-white'
      }`}
    />
  )
}

function SelectInput({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 text-[14px] text-slate-800 outline-none">
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function StatusPanel({ createdAt, updatedAt, availabilityStatus, onStatusChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Trạng thái</h2>
      <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-[13px] text-slate-600">
        <p className="flex justify-between gap-3">
          <span>Ngày tạo</span>
          <strong className="text-slate-900">{createdAt || 'Chưa có dữ liệu'}</strong>
        </p>
        <p className="flex justify-between gap-3">
          <span>Cập nhật gần nhất</span>
          <strong className="text-slate-900">{updatedAt || 'Chưa có dữ liệu'}</strong>
        </p>
      </div>
      <div className="mt-4">
        <Field label="Trạng thái lưu hành">
          <SelectInput value={availabilityStatus} onChange={onStatusChange}>
            <option value="ACTIVE">Sẵn sàng</option>
            <option value="INACTIVE">Bảo trì</option>
            <option value="ARCHIVED">Ngừng lưu hành</option>
          </SelectInput>
        </Field>
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('vi-VN')
  } catch {
    return ''
  }
}

function AdminBookForm({ mode = 'add', LayoutComponent = AdminLayout, active = 'books', listPath = '/admin/books' }) {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(emptyForm)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [categories, setCategories] = useState([])
  const [classifications, setClassifications] = useState([])
  const [createdAt, setCreatedAt] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [selectedCoverFile, setSelectedCoverFile] = useState(null)
  const [localCoverPreviewUrl, setLocalCoverPreviewUrl] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [loadedBook, setLoadedBook] = useState(null)

  useEffect(() => {
    return () => {
      if (localCoverPreviewUrl) {
        URL.revokeObjectURL(localCoverPreviewUrl)
      }
    }
  }, [localCoverPreviewUrl])

  useEffect(() => {
    let ignore = false

    async function loadOptions() {
      try {
        const [categoryResponse, classificationResponse] = await Promise.all([
          getCategories(),
          getClassifications(),
        ])

        if (!ignore) {
          setCategories(categoryResponse.data?.content || [])
          setClassifications(classificationResponse.data?.content || [])
        }
      } catch {
        if (!ignore) {
          setSubmitError('Không tải được danh mục hoặc phân loại từ backend.')
        }
      }
    }

    loadOptions()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadBook() {
      if (!isEdit || !bookId) return

      try {
        setLoading(true)
        let book = {}

        try {
          const fallbackResponse = await getBooks({ page: 0, size: 500, sort: 'bookId,asc' })
          const fallbackBooks = fallbackResponse.data?.content || []
          book = fallbackBooks.find((item) => String(item.bookId) === String(bookId)) || {}

          if (!book.bookId) {
            const response = await getBookById(bookId)
            book = response.data || {}
          }
        } catch {
          const response = await getBookById(bookId)
          book = response.data || {}
        }

        if (!ignore) {
          setLoadedBook(book)
          setForm(buildFormFromBook(book))
          setCoverImageUrl(book.coverImageUrl || '')
          setCreatedAt(formatDate(book.createdAt))
          setUpdatedAt(formatDate(book.updatedAt))
        }
      } catch {
        if (!ignore) {
          setSubmitError('Không tải được thông tin sách từ backend.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadBook()
    return () => {
      ignore = true
    }
  }, [bookId, isEdit])

  useEffect(() => {
    if (!isEdit || !loadedBook) return
    if (form.categoryId && form.classificationId) return
    if (categories.length === 0 && classifications.length === 0) return

    const matchedCategory = !form.categoryId
      ? categories.find((category) => normalizeText(category.categoryName) === normalizeText(loadedBook.categoryName))
      : null

    const matchedClassification = !form.classificationId
      ? classifications.find((classification) => {
          const sameName = normalizeText(classification.classificationName) === normalizeText(loadedBook.classificationName)
          const sameCode = String(classification.classificationCode || '') === String(loadedBook.classificationCode || '')
          return sameName || sameCode
        })
      : null

    if (!matchedCategory && !matchedClassification) return

    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || (matchedCategory ? String(matchedCategory.categoryId) : ''),
      classificationId: current.classificationId || (matchedClassification ? String(matchedClassification.classificationId) : ''),
    }))
  }, [categories, classifications, form.categoryId, form.classificationId, isEdit, loadedBook])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function buildPayload() {
    const basePayload = {
      title: form.title.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim(),
      publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
      edition: form.edition.trim(),
      language: form.language.trim(),
      description: form.description.trim(),
      coverImageUrl: coverImageUrl || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      classificationId: form.classificationId ? Number(form.classificationId) : null,
      userId: 1,
    }

    if (!isEdit) {
      return {
        isbn: form.isbn.trim(),
        ...basePayload,
      }
    }

    return basePayload
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    if (
      !form.title.trim() ||
      !form.author.trim() ||
      !form.publisher.trim() ||
      !form.publicationYear ||
      !form.edition.trim() ||
      !form.language.trim() ||
      !form.description.trim() ||
      !form.categoryId ||
      !form.classificationId
    ) {
      setSubmitError('Vui lòng nhập đủ các trường bắt buộc: tên sách, tác giả, nhà xuất bản, năm xuất bản, lần tái bản, ngôn ngữ, mô tả, danh mục và phân loại.')
      return
    }

    if (!isEdit && !form.isbn.trim()) {
      setSubmitError('ISBN là bắt buộc khi thêm sách mới.')
      return
    }

    if (Number(form.publicationYear) > new Date().getFullYear()) {
      setSubmitError('Năm xuất bản không được lớn hơn năm hiện tại.')
      return
    }

    try {
      setSaving(true)
      const payload = buildPayload()

      if (isEdit && bookId) {
        await updateBook(bookId, payload)
        await updateBookStatus(bookId, {
          availabilityStatus: form.availabilityStatus || 'ACTIVE',
          userId: 1,
        })
        navigate(listPath)
      } else {
        const response = await createBook(payload)
        const newBookId = response.data?.bookId

        if (selectedCoverFile && newBookId) {
          try {
            const uploadResponse = await uploadBookCover({ bookId: newBookId, file: selectedCoverFile, userId: 1 })
            setCoverImageUrl(uploadResponse.data?.coverImageUrl || '')
          } catch (uploadError) {
            const uploadServerMessage = uploadError?.response?.data?.message
            setSubmitError(uploadServerMessage || 'Đã tạo sách nhưng tải ảnh bìa thất bại.')
            setSaving(false)
            return
          }
        }

        navigate(listPath)
        return
      }
    } catch (error) {
      const serverMessage = error?.response?.data?.message
      setSubmitError(serverMessage || 'Lưu thông tin sách thất bại.')
    } finally {
      setSaving(false)
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadMessage('')

    if (!acceptedImageTypes.includes(file.type)) {
      setUploadError('Chỉ chấp nhận JPG, PNG hoặc WEBP.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ảnh bìa phải nhỏ hơn 2MB.')
      event.target.value = ''
      return
    }

    if (!isEdit) {
      if (localCoverPreviewUrl) {
        URL.revokeObjectURL(localCoverPreviewUrl)
      }

      const nextPreviewUrl = URL.createObjectURL(file)
      setSelectedCoverFile(file)
      setLocalCoverPreviewUrl(nextPreviewUrl)
      setUploadMessage('Ảnh bìa đã được chọn. Ảnh sẽ tự tải lên sau khi lưu sách.')
      event.target.value = ''
      return
    }

    try {
      setIsUploading(true)
      const response = await uploadBookCover({ bookId, file, userId: 1 })
      setCoverImageUrl(response.data?.coverImageUrl || `/api/catalog/books/${bookId}/cover?ts=${Date.now()}`)
      setUploadMessage('Tải ảnh bìa lên backend thành công.')
    } catch (error) {
      const serverMessage = error?.response?.data?.message
      setUploadError(serverMessage || 'Backend trả lỗi phản hồi sau khi upload. Nếu ảnh đã lưu, hãy tải lại trang để kiểm tra.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  function openFilePicker() {
    if (isUploading) return
    fileInputRef.current?.click()
  }

  const bookCode = bookId ? `BK${String(bookId).padStart(4, '0')}` : 'Sẽ tạo sau khi lưu'
  const previewCoverUrl = localCoverPreviewUrl || coverImageUrl
  const resolvedPreviewCoverUrls = [
    ...new Set([
      ...resolveBackendFileUrls(previewCoverUrl),
    ].filter(Boolean)),
  ]
  const coverFallback = (
    <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-[#10263d]">
      <div className="relative h-52 w-36 rounded-sm bg-[#183d60] shadow-2xl">
        <div className="absolute inset-y-0 left-0 w-4 bg-[#0a1726]" />
      </div>
    </div>
  )

  return (
    <LayoutComponent
      active={active}
      title={isEdit ? 'Chỉnh sửa Thông tin sách' : 'Thêm sách mới'}
      description={isEdit ? 'Cập nhật dữ liệu sách trực tiếp từ backend.' : 'Tạo đầu sách mới và lưu trực tiếp xuống backend.'}
    >
      <form onSubmit={handleSubmit}>
        <div className={`grid gap-5 ${isEdit ? 'xl:grid-cols-[1fr_280px]' : ''}`}>
          <div className="space-y-5">
            <Panel icon={Info} title="Thông tin chung">
              {submitError && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}
              {loading && <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Đang tải thông tin sách...</div>}

              <div className="grid gap-5 lg:grid-cols-3">
                <Field label="Mã sách" hint="Mã định danh được hệ thống tạo tự động.">
                  <TextInput value={bookCode} disabled />
                </Field>
                <Field label="Danh mục sách" required>
                  <SelectInput value={form.categoryId} onChange={(event) => updateField('categoryId', event.target.value)}>
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Mã ISBN" required={!isEdit}>
                  <TextInput value={form.isbn} onChange={(event) => updateField('isbn', event.target.value)} placeholder="978-3-16-148410-0" disabled={isEdit} />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Tên sách" required>
                  <TextInput value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Ví dụ: Giáo trình Cấu trúc dữ liệu và Giải thuật" />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <Field label="Tác giả" required>
                  <TextInput value={form.author} onChange={(event) => updateField('author', event.target.value)} placeholder="Tên tác giả hoặc nhóm tác giả" />
                </Field>
                <Field label="Nhà xuất bản" required>
                  <TextInput value={form.publisher} onChange={(event) => updateField('publisher', event.target.value)} placeholder="NXB Giáo dục, NXB Trẻ..." />
                </Field>
                <Field label="Năm xuất bản" required>
                  <TextInput value={form.publicationYear} onChange={(event) => updateField('publicationYear', event.target.value)} placeholder="2024" type="number" />
                </Field>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                <Field label="Lần tái bản" required>
                  <TextInput value={form.edition} onChange={(event) => updateField('edition', event.target.value)} placeholder="Lần 1, lần 2..." />
                </Field>
                <Field label="Ngôn ngữ" required>
                  <SelectInput value={form.language} onChange={(event) => updateField('language', event.target.value)}>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </SelectInput>
                </Field>
                <Field label="Phân loại" required>
                  <SelectInput value={form.classificationId} onChange={(event) => updateField('classificationId', event.target.value)}>
                    <option value="">Chọn phân loại</option>
                    {classifications.map((classification) => (
                      <option key={classification.classificationId} value={classification.classificationId}>
                        {classification.classificationCode} - {classification.classificationName}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Mô tả ngắn" required>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="Nhập tóm tắt nội dung hoặc mô tả ngắn về tài liệu..."
                    className="min-h-32 w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-[14px] leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </Field>
              </div>
            </Panel>

            <Panel icon={FileImage} title="Tài liệu hình ảnh">
              {previewCoverUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="flex min-h-[18rem] w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-slate-400"
                    >
                      <BookCoverImage
                        src={resolvedPreviewCoverUrls}
                        alt="Book cover"
                        className="max-h-72 w-full object-contain object-center"
                        fallback={coverFallback}
                      />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                    <button type="button" onClick={openFilePicker} disabled={isUploading} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                      <Upload size={16} />
                      {isUploading ? 'Đang tải...' : 'Chọn lại ảnh'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-32 place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                  <div>
                    {isEdit ? <Upload size={24} className="mx-auto text-slate-400" /> : <ImageUp size={24} className="mx-auto text-slate-400" />}
                    <p className="mt-3 text-sm font-medium text-slate-900">{isEdit ? 'Thay đổi ảnh bìa' : 'Chọn ảnh bìa trước khi lưu sách'}</p>
                    <p className="mt-1 text-xs text-slate-500">Định dạng JPG, PNG, WEBP. Tối đa 2MB.</p>
                    <button type="button" onClick={openFilePicker} disabled={isUploading} className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                      <Upload size={16} />
                      {isUploading ? 'Đang tải...' : selectedCoverFile && !isEdit ? 'Đổi ảnh' : 'Chọn ảnh'}
                    </button>
                    {uploadMessage && <p className="mt-3 text-xs font-medium text-emerald-700">{uploadMessage}</p>}
                    {uploadError && <p className="mt-3 text-xs font-medium text-red-600">{uploadError}</p>}
                  </div>
                </div>
              )}
              {(uploadMessage || uploadError) && previewCoverUrl && (
                <div className="mt-3 text-center">
                  {uploadMessage && <p className="text-xs font-medium text-emerald-700">{uploadMessage}</p>}
                  {uploadError && <p className="text-xs font-medium text-red-600">{uploadError}</p>}
                </div>
              )}
            </Panel>
          </div>

          {isEdit && (
            <aside className="space-y-5">
              <StatusPanel
                createdAt={createdAt}
                updatedAt={updatedAt}
                availabilityStatus={form.availabilityStatus}
                onStatusChange={(event) => updateField('availabilityStatus', event.target.value)}
              />
            </aside>
          )}
        </div>

        <div className={`mt-6 flex gap-3 border-t border-slate-200 pt-5 ${isEdit ? 'justify-center' : 'justify-end'}`}>
          <Link to={listPath} className="inline-flex h-11 min-w-28 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700">
            Hủy
          </Link>
          <button type="submit" disabled={saving || loading} className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật thông tin' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
      {isPreviewOpen && previewCoverUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6">
          <button
            type="button"
            aria-label="Đóng xem trước ảnh"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-4 shadow-2xl">
            <button
              type="button"
              aria-label="Đóng xem trước ảnh"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
            >
              <X size={18} />
            </button>
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <BookCoverImage
                src={resolvedPreviewCoverUrls}
                alt={form.title || 'Book cover'}
                className="max-h-[75vh] w-full object-contain object-center"
                fallback={coverFallback}
              />
            </div>
          </div>
        </div>
      )}
      {bookId && <span className="sr-only">Editing {bookId}</span>}
    </LayoutComponent>
  )
}

export default AdminBookForm
