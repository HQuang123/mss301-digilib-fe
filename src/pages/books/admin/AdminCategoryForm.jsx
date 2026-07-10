import { useEffect, useMemo, useState } from 'react'
import { Eye, Info, Layers3, LockKeyhole, Save, Tags, XCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCategory, getCategoryById, updateCategory } from '@/api/bookApi'
import AdminLayout from '@/components/layout/AdminLayout'

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

function HintCard({ icon: Icon, title, text, active }) {
  return (
    <div className={`rounded-2xl border p-4 ${active ? 'border-blue-200 bg-blue-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600'}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Icon size={16} />
        {title}
      </p>
      <p className="mt-2 text-[13px] leading-6">{text}</p>
    </div>
  )
}

const emptyForm = {
  categoryName: '',
  description: '',
}

function AdminCategoryForm({ mode = 'add' }) {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadCategory() {
      if (!isEdit || !categoryId) return

      try {
        const response = await getCategoryById(categoryId)
        const category = response.data || {}

        if (!ignore) {
          setForm({
            categoryName: category.categoryName || '',
            description: category.description || '',
          })
        }
      } catch {
        if (!ignore) {
          setSubmitError('Không tải được thông tin danh mục từ backend.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadCategory()

    return () => {
      ignore = true
    }
  }, [categoryId, isEdit])

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const categoryCode = useMemo(() => {
    if (!categoryId) return 'Tự động tạo sau khi lưu'
    return `CAT-${String(categoryId).padStart(4, '0')}`
  }, [categoryId])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    if (!form.categoryName.trim() || !form.description.trim()) {
      setSubmitError('Vui lòng nhập đầy đủ tên danh mục và mô tả.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        categoryName: form.categoryName.trim(),
        description: form.description.trim(),
      }

      if (isEdit && categoryId) {
        await updateCategory(categoryId, payload)
      } else {
        await createCategory(payload)
      }

      navigate('/admin/categories')
    } catch (error) {
      const serverMessage = error?.response?.data?.message
      setSubmitError(serverMessage || 'Lưu thông tin danh mục thất bại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      active="categories"
      title={isEdit ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
      description={
        isEdit
          ? 'Cập nhật nhóm phân loại sách trực tiếp từ backend.'
          : 'Tạo danh mục mới và lưu trực tiếp xuống backend.'
      }
    >
      <form onSubmit={handleSubmit}>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 text-slate-900">
            <Tags size={18} />
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em]">Thông tin danh mục</h2>
          </div>

          {submitError && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}
          {loading && <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Đang tải thông tin danh mục...</div>}

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Field label="Mã danh mục" hint="Được hệ thống tạo tự động để bảo đảm duy nhất.">
              <div className="relative">
                <input
                  value={categoryCode}
                  disabled
                  className="h-11 w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 pr-11 text-[14px] text-slate-700 outline-none"
                />
                <LockKeyhole size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </Field>
            <Field label="Tên danh mục" required>
              <input
                value={form.categoryName}
                onChange={(event) => updateField('categoryName', event.target.value)}
                placeholder="Ví dụ: Kỹ thuật lập trình"
                className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Mô tả" required hint="Mô tả ngắn gọn để người dùng hiểu rõ phạm vi của danh mục này.">
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Nhập mô tả về mục đích và phạm vi của danh mục..."
                className="min-h-36 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[14px] leading-6 text-slate-800 outline-none placeholder:text-slate-400"
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link to="/admin/categories" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700">
              {isEdit && <XCircle size={16} />}
              Hủy
            </Link>
            <button type="submit" disabled={saving || loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật thông tin' : 'Lưu thông tin'}
            </button>
          </div>
        </section>
      </form>

      {!isEdit && (
        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <HintCard icon={Info} title="Lưu ý" text="Tên danh mục nên ngắn gọn và dễ hiểu để hiển thị đẹp trên cả desktop lẫn mobile." active />
          <HintCard icon={Eye} title="Hiển thị" text="Mô tả sẽ xuất hiện tại phần lọc và chi tiết danh mục khi người dùng duyệt sách." />
          <HintCard icon={Layers3} title="Mở rộng" text="Bạn có thể gắn thêm cấu trúc phân cấp hoặc quy tắc phân loại sau khi lưu bản ghi." />
        </section>
      )}
    </AdminLayout>
  )
}

export default AdminCategoryForm
