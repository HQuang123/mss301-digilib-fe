import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  FileText,
  Globe2,
  Lock,
  Save,
  Shield,
  Upload,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createDigitalResource,
  getBooks,
  getDigitalResources,
  getDigitalResourceById,
  replaceDigitalResourceFile,
  updateDigitalResource,
  uploadDigitalResourceFile,
} from '@/api/bookApi'
import { resolveBackendFileUrl } from '@/utils/fileUrl'
import LibrarianLayout from './LibrarianLayout'

const accessOptions = [
  {
    value: 'PUBLIC',
    title: 'Công khai',
    description: 'Mọi người dùng đều có thể mở tài liệu điện tử này.',
    icon: Globe2,
  },
  {
    value: 'MEMBER',
    title: 'Thành viên',
    description: 'Chỉ thành viên thư viện mới có quyền truy cập tài liệu.',
    icon: BookOpen,
  },
  {
    value: 'INTERNAL',
    title: 'Nội bộ',
    description: 'Chỉ dùng trong nội bộ thư viện hoặc quản trị viên.',
    icon: Shield,
  },
]

const emptyForm = {
  bookId: '',
  fileFormat: 'PDF',
  resourceUrl: '',
  accessPermission: 'PUBLIC',
}

function isSelectableBook(book) {
  if (!book) return false
  if (book.isDeleted === true || book.deleted === true || book.deletedAt) return false
  if (['DELETED', 'ARCHIVED', 'INACTIVE'].includes(String(book.recordStatus || '').toUpperCase())) return false
  if (['DELETED', 'ARCHIVED', 'INACTIVE'].includes(String(book.status || '').toUpperCase())) return false
  if (['ARCHIVED', 'INACTIVE'].includes(String(book.availabilityStatus || '').toUpperCase())) return false
  return true
}

function isActiveDigitalResource(resource) {
  return resource && !resource.isDeleted
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('vi-VN')
  } catch {
    return ''
  }
}

function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (responseData?.message) return responseData.message
  if (responseData?.error) return responseData.error
  if (responseData?.details) return responseData.details

  return fallback
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4 text-slate-900">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100">
          <Icon size={18} />
        </span>
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

function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`h-11 w-full rounded-2xl border border-slate-300 px-4 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 ${
        disabled ? 'bg-slate-100' : 'bg-white'
      }`}
    />
  )
}

function SelectInput({ value, onChange, children, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`h-11 w-full appearance-none rounded-2xl border border-slate-300 px-4 text-[14px] text-slate-800 outline-none ${
          disabled ? 'bg-slate-100' : 'bg-white'
        }`}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function AccessOption({ option, checked, onChange }) {
  const Icon = option.icon

  return (
    <label
      className={`relative flex cursor-pointer gap-4 rounded-2xl border p-4 transition ${
        checked ? 'border-slate-950 bg-slate-50 ring-1 ring-slate-950' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input type="radio" name="access" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`absolute right-4 top-4 h-4 w-4 rounded-full border ${checked ? 'border-slate-950 bg-slate-950 ring-4 ring-white' : 'border-slate-400'}`} />
      <Icon size={20} className="text-slate-900" />
      <span>
        <span className="block text-sm font-semibold text-slate-950">{option.title}</span>
        <span className="mt-1 block text-[13px] leading-6 text-slate-600">{option.description}</span>
      </span>
    </label>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || 'Chưa cập nhật'}</p>
    </div>
  )
}

function LibrarianDigitalBookForm({ mode = 'add' }) {
  const { resourceId } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(emptyForm)
  const [books, setBooks] = useState([])
  const [linkedBookIds, setLinkedBookIds] = useState(new Set())
  const [uploadedAt, setUploadedAt] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadBooksForSelect() {
      try {
        const [booksResponse, resourcesResponse] = await Promise.all([
          getBooks({ page: 0, size: 100, sort: 'bookId,asc' }),
          getDigitalResources({ page: 0, size: 5000, sort: 'resourceId,asc' }),
        ])
        const nextLinkedBookIds = new Set(
          (resourcesResponse.data?.content || [])
            .filter(isActiveDigitalResource)
            .map((resource) => String(resource.bookId)),
        )

        if (!ignore) {
          setLinkedBookIds(nextLinkedBookIds)
          setBooks(
            (booksResponse.data?.content || [])
              .filter(isSelectableBook)
              .filter((book) => isEdit || !nextLinkedBookIds.has(String(book.bookId))),
          )
        }
      } catch {
        if (!ignore) {
          setSubmitError('Không tải được danh sách sách từ backend.')
        }
      }
    }

    loadBooksForSelect()
    return () => {
      ignore = true
    }
  }, [isEdit])

  useEffect(() => {
    let ignore = false

    async function loadResource() {
      if (!isEdit || !resourceId) return

      try {
        setLoading(true)
        setSubmitError('')

        const response = await getDigitalResourceById(resourceId)
        const resource = response.data || {}

        if (!ignore) {
          setForm({
            bookId: resource.bookId ? String(resource.bookId) : '',
            fileFormat: resource.fileFormat || 'PDF',
            resourceUrl: resource.resourceUrl || '',
            accessPermission: resource.accessPermission || 'PUBLIC',
          })
          setUploadedAt(formatDate(resource.uploadedAt))
        }
      } catch {
        if (!ignore) {
          setSubmitError('Không tải được thông tin tài nguyên số từ backend.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadResource()
    return () => {
      ignore = true
    }
  }, [isEdit, resourceId])

  const selectedBook = useMemo(
    () => books.find((item) => String(item.bookId) === String(form.bookId)) || null,
    [books, form.bookId],
  )

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleBookChange(value) {
    setSubmitError('')
    setUploadError('')
    setUploadMessage('')
    setSelectedFile(null)
    updateField('bookId', value)
  }

  function handleFileChange(event) {
    if (!form.bookId || !selectedBook) {
      setUploadError('Vui lòng chọn đầu sách hợp lệ trước khi tải file PDF.')
      event.target.value = ''
      return
    }

    const file = event.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadMessage('')

    if (file.type !== 'application/pdf') {
      setUploadError('Backend hiện chỉ hỗ trợ upload file PDF cho tài nguyên số.')
      event.target.value = ''
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File PDF phải nhỏ hơn 20MB.')
      event.target.value = ''
      return
    }

    setSelectedFile(file)
    updateField('fileFormat', 'PDF')
    setUploadMessage(`Đã chọn file: ${file.name}`)
    event.target.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    setUploadError('')

    if (!form.bookId) {
      setSubmitError('Vui lòng chọn đầu sách.')
      return
    }

    if (!form.accessPermission) {
      setSubmitError('Vui lòng chọn quyền truy cập.')
      return
    }

    if (!selectedBook) {
      setSubmitError('Đầu sách đã chọn không còn hợp lệ. Vui lòng chọn lại.')
      return
    }

    if (!isEdit && linkedBookIds.has(String(form.bookId))) {
      setSubmitError('Đầu sách này đã có tài nguyên số, vui lòng chọn sách khác.')
      return
    }

    if (!isEdit && !selectedFile && !form.resourceUrl.trim()) {
      setSubmitError('Vui lòng nhập đường dẫn tài liệu hoặc chọn file PDF để tải lên.')
      return
    }

    if (isEdit && !selectedFile && !form.resourceUrl.trim()) {
      setSubmitError('Vui lòng nhập đường dẫn tài liệu.')
      return
    }

    try {
      setSaving(true)

      if (selectedFile && !isEdit) {
        await uploadDigitalResourceFile({
          bookId: Number(form.bookId),
          file: selectedFile,
          accessPermission: form.accessPermission,
          userId: 1,
        })
        navigate('/librarian/digital-books')
        return
      }

      if (selectedFile && isEdit && resourceId) {
        await replaceDigitalResourceFile({
          resourceId: Number(resourceId),
          file: selectedFile,
          accessPermission: form.accessPermission,
          userId: 1,
        })
        navigate('/librarian/digital-books')
        return
      }

      const payload = {
        fileFormat: form.fileFormat.trim() || 'PDF',
        resourceUrl: form.resourceUrl.trim(),
        accessPermission: form.accessPermission,
        userId: 1,
      }

      if (isEdit && resourceId) {
        await updateDigitalResource(resourceId, payload)
      } else {
        await createDigitalResource(Number(form.bookId), payload)
      }

      navigate('/librarian/digital-books')
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Lưu tài nguyên số thất bại.'))
    } finally {
      setSaving(false)
    }
  }

  const generatedResourceCode = isEdit
    ? `DR${String(resourceId || '').padStart(4, '0')}`
    : form.bookId
      ? `DR-BK${String(form.bookId).padStart(4, '0')}`
      : 'Tự động tạo sau khi chọn sách'

  const previewUrl = resolveBackendFileUrl(form.resourceUrl)

  return (
    <LibrarianLayout
      active="digital"
      title={isEdit ? 'Chỉnh sửa tài nguyên số' : 'Thêm tài nguyên số mới'}
      description={
        isEdit
          ? 'Cập nhật tài nguyên số trực tiếp từ backend với giao diện gọn, rõ và dễ nhập liệu hơn.'
          : 'Tạo tài nguyên số mới cho đầu sách đang có trong hệ thống, không cần nhập ISBN thủ công.'
      }
    >
      <form onSubmit={handleSubmit}>
        <div className={`grid gap-5 ${isEdit ? 'xl:grid-cols-[1fr_300px]' : 'xl:grid-cols-[1fr_320px]'}`}>
          <div className="space-y-5">
            <Panel icon={BookOpen} title="Liên kết đầu sách">
              {submitError && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}
              {loading && <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Đang tải thông tin tài nguyên số...</div>}

              <div className="grid gap-5 lg:grid-cols-2">
                <Field
                  label="Đầu sách"
                  required
                  hint={isEdit ? 'Đầu sách liên kết được giữ nguyên khi chỉnh sửa.' : 'Chọn sách để hệ thống tự hiện thông tin cần thiết.'}
                >
                  <SelectInput
                    value={form.bookId}
                    onChange={(event) => handleBookChange(event.target.value)}
                    disabled={isEdit}
                  >
                    <option value="">Chọn đầu sách</option>
                    {books.map((book) => (
                      <option key={book.bookId} value={book.bookId}>
                        {book.title}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Mã tài nguyên">
                  <TextInput value={generatedResourceCode} disabled />
                </Field>
              </div>

              {selectedBook && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoItem label="Tên sách" value={selectedBook.title} />
                  <InfoItem label="Tác giả" value={selectedBook.author} />
                  <InfoItem label="Danh mục" value={selectedBook.categoryName} />
                  <InfoItem label="ISBN" value={selectedBook.isbn} />
                  <InfoItem label="Năm xuất bản" value={selectedBook.publicationYear} />
                  <InfoItem label="Ngôn ngữ" value={selectedBook.language} />
                  <InfoItem label="Nhà xuất bản" value={selectedBook.publisher} />
                  <InfoItem label="Trạng thái sách" value={selectedBook.availabilityStatus} />
                </div>
              )}
            </Panel>

            <Panel icon={FileText} title="Tài liệu số">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Định dạng tệp" required>
                  <SelectInput
                    value={form.fileFormat}
                    onChange={(event) => updateField('fileFormat', event.target.value)}
                    disabled={Boolean(selectedFile)}
                  >
                    <option value="PDF">PDF</option>
                    <option value="EPUB">EPUB</option>
                  </SelectInput>
                </Field>

                <Field label="Tải file PDF" hint={isEdit ? 'Chọn PDF mới nếu bạn muốn thay file điện tử hiện tại.' : 'Nếu chọn file PDF, hệ thống sẽ dùng endpoint upload của backend khi lưu.'}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={!selectedBook}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {selectedFile ? 'Đổi file PDF' : isEdit ? 'Chọn PDF mới' : 'Chọn file PDF'}
                  </button>
                </Field>
              </div>

              {selectedFile && (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  File đã chọn: <strong>{selectedFile.name}</strong>
                </div>
              )}

              <div className="mt-5">
                <Field
                  label="Đường dẫn tài liệu"
                  required={!selectedFile}
                  hint={
                    isEdit
                      ? 'Có thể giữ nguyên đường dẫn hiện tại hoặc chọn file PDF mới để thay thế.'
                      : 'Có thể nhập URL trực tiếp nếu không dùng upload PDF.'
                  }
                >
                  <TextInput
                    value={form.resourceUrl}
                    onChange={(event) => updateField('resourceUrl', event.target.value)}
                    placeholder="/files/resources/ten-tai-lieu.pdf hoặc https://..."
                    disabled={Boolean(selectedFile)}
                  />
                </Field>
              </div>

              {previewUrl && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Xem tài liệu:{' '}
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="font-semibold text-sky-700 hover:text-sky-800">
                    Mở file điện tử
                  </a>
                </div>
              )}

              {(uploadMessage || uploadError) && (
                <div className="mt-5 space-y-2">
                  {uploadMessage && <p className="text-sm font-medium text-emerald-700">{uploadMessage}</p>}
                  {uploadError && <p className="text-sm font-medium text-red-600">{uploadError}</p>}
                </div>
              )}
            </Panel>

            <Panel icon={Lock} title="Quyền truy cập">
              <div className="grid gap-4 lg:grid-cols-3">
                {accessOptions.map((option) => (
                  <AccessOption
                    key={option.value}
                    option={option}
                    checked={form.accessPermission === option.value}
                    onChange={() => updateField('accessPermission', option.value)}
                  />
                ))}
              </div>
            </Panel>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Tóm tắt</h2>
              <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-[13px] text-slate-600">
                <p className="flex justify-between gap-3">
                  <span>Mã tài nguyên</span>
                  <strong className="text-right text-slate-900">{generatedResourceCode}</strong>
                </p>
                <p className="flex justify-between gap-3">
                  <span>Đầu sách</span>
                  <strong className="text-right text-slate-900">{selectedBook?.title || 'Chưa chọn'}</strong>
                </p>
                <p className="flex justify-between gap-3">
                  <span>Định dạng</span>
                  <strong className="text-right text-slate-900">{form.fileFormat || 'PDF'}</strong>
                </p>
                <p className="flex justify-between gap-3">
                  <span>Quyền truy cập</span>
                  <strong className="text-right text-slate-900">{form.accessPermission || 'PUBLIC'}</strong>
                </p>
                {isEdit && (
                  <p className="flex justify-between gap-3">
                    <span>Ngày tải lên</span>
                    <strong className="text-right text-slate-900">{uploadedAt || 'Chưa có dữ liệu'}</strong>
                  </p>
                )}
              </div>
            </div>

            {!isEdit && (
              <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)] p-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">Hướng dẫn nhanh</h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <p>1. Chọn đầu sách từ danh sách thả xuống.</p>
                  <p>2. Hệ thống tự sinh mã tài nguyên và hiện thông tin sách.</p>
                  <p>3. Chọn file PDF hoặc nhập đường dẫn tài liệu.</p>
                  <p>4. Chọn quyền truy cập rồi lưu tài nguyên số.</p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Link to="/librarian/digital-books" className="inline-flex h-11 min-w-28 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật thông tin' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </LibrarianLayout>
  )
}

export default LibrarianDigitalBookForm
