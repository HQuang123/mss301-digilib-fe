import { useEffect, useRef, useState } from 'react'
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
import AdminLayout from '@/components/layout/AdminLayout'
import { resolveBackendFileUrl } from '@/utils/fileUrl'

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

function isActiveDigitalResource(resource) {
  return resource && !resource.isDeleted
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

function formatDate(value) {
  if (!value) return ''

  try {
    return new Date(value).toLocaleString('vi-VN')
  } catch {
    return ''
  }
}

function AdminDigitalBookForm({ mode = 'add' }) {
  const { resourceId } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(emptyForm)
  const [books, setBooks] = useState([])
  const [linkedBookIds, setLinkedBookIds] = useState(new Set())
  const [bookTitle, setBookTitle] = useState('')
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
          setBooks((booksResponse.data?.content || []).filter((book) => isEdit || !nextLinkedBookIds.has(String(book.bookId))))
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
  }, [])

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
          setSubmitError('Không tải được thông tin sách điện tử từ backend.')
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

  useEffect(() => {
    if (!form.bookId) {
      setBookTitle('')
      return
    }

    const book = books.find((item) => String(item.bookId) === String(form.bookId))
    setBookTitle(book?.title || '')
  }, [books, form.bookId])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadMessage('')

    if (file.type !== 'application/pdf') {
      setUploadError('Backend hiện chỉ hỗ trợ upload file PDF cho sách điện tử.')
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
        navigate('/admin/digital-books')
        return
      }

      if (selectedFile && isEdit && resourceId) {
        await replaceDigitalResourceFile({
          resourceId: Number(resourceId),
          file: selectedFile,
          accessPermission: form.accessPermission,
          userId: 1,
        })
        navigate('/admin/digital-books')
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

      navigate('/admin/digital-books')
    } catch (error) {
      const serverMessage = error?.response?.data?.message
      setSubmitError(serverMessage || 'Lưu sách điện tử thất bại.')
    } finally {
      setSaving(false)
    }
  }

  const currentBookCode = form.bookId ? `BK${String(form.bookId).padStart(4, '0')}` : 'Chưa chọn'
  const previewUrl = resolveBackendFileUrl(form.resourceUrl)

  return (
    <AdminLayout
      active="digital-books"
      title={isEdit ? 'Chỉnh sửa Sách điện tử' : 'Thêm Sách điện tử mới'}
      description={
        isEdit
          ? 'Cập nhật dữ liệu tài liệu số trực tiếp từ backend.'
          : 'Tạo mới tài liệu số và liên kết với sách đang có trong catalog-service.'
      }
    >
      <form onSubmit={handleSubmit}>
        <div className={`grid gap-5 ${isEdit ? 'xl:grid-cols-[1fr_280px]' : ''}`}>
          <div className="space-y-5">
            <Panel icon={BookOpen} title="Liên kết đầu sách">
              {submitError && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}
              {loading && <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Đang tải thông tin sách điện tử...</div>}

              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Đầu sách" required hint={isEdit ? 'Liên kết sách được giữ nguyên khi chỉnh sửa tài liệu số.' : 'Chọn sách cần gắn tài liệu điện tử.'}>
                  <SelectInput
                    value={form.bookId}
                    onChange={(event) => updateField('bookId', event.target.value)}
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
                <Field label="Mã sách">
                  <TextInput value={currentBookCode} disabled />
                </Field>
              </div>

              {bookTitle && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Đầu sách đang liên kết: <strong className="text-slate-950">{bookTitle}</strong>
                </div>
              )}
            </Panel>

            <Panel icon={FileText} title="Tài liệu số">
              <div className="grid gap-5 lg:grid-cols-2">
                <Field label="Định dạng tệp" required>
                  <SelectInput value={form.fileFormat} onChange={(event) => updateField('fileFormat', event.target.value)} disabled={Boolean(selectedFile)}>
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
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-700"
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
                  Xem tài liệu:
                  {' '}
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

          {isEdit && (
            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Trạng thái</h2>
                <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-[13px] text-slate-600">
                  <p className="flex justify-between gap-3">
                    <span>Mã tài liệu</span>
                    <strong className="text-slate-900">DR{String(resourceId || '').padStart(4, '0')}</strong>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span>Ngày tải lên</span>
                    <strong className="text-right text-slate-900">{uploadedAt || 'Chưa có dữ liệu'}</strong>
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>

        <div className={`mt-6 flex gap-3 border-t border-slate-200 pt-5 ${isEdit ? 'justify-center' : 'justify-end'}`}>
          <Link to="/admin/digital-books" className="inline-flex h-11 min-w-28 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700">
            Hủy
          </Link>
          <button type="submit" disabled={saving || loading} className="inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật thông tin' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}

export default AdminDigitalBookForm
