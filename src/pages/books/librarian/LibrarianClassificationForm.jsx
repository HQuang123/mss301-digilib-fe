import { useEffect, useState } from 'react'
import { ChevronDown, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createClassification, getClassificationById, updateClassification } from '@/api/bookApi'
import LibrarianLayout from './LibrarianLayout'

const initialForm = {
  classificationSystem: 'DDC',
  classificationName: '',
  classificationCode: '',
}

function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || fallbackMessage
}

function LibrarianClassificationForm({ mode = 'add' }) {
  const { classificationId } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClassification() {
      if (!isEdit || !classificationId) return

      try {
        setLoading(true)
        setError('')
        const response = await getClassificationById(classificationId)
        const classification = response.data || {}

        setForm({
          classificationSystem: classification.classificationSystem || 'DDC',
          classificationName: classification.classificationName || '',
          classificationCode: classification.classificationCode != null ? String(classification.classificationCode) : '',
        })
      } catch (error) {
        setError(getApiErrorMessage(error, 'Không tải được dữ liệu phân loại từ backend.'))
      } finally {
        setLoading(false)
      }
    }

    loadClassification()
  }, [classificationId, isEdit])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.classificationSystem.trim() || !form.classificationName.trim() || !form.classificationCode.trim()) {
      setError('Vui lòng nhập đủ hệ thống, tên phân loại và mã phân loại.')
      return
    }

    const parsedCode = Number(form.classificationCode)
    if (Number.isNaN(parsedCode)) {
      setError('Mã phân loại phải là số.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const payload = {
        classificationSystem: form.classificationSystem.trim(),
        classificationName: form.classificationName.trim(),
        classificationCode: parsedCode,
      }

      if (isEdit && classificationId) {
        await updateClassification(classificationId, payload)
      } else {
        await createClassification(payload)
      }

      navigate('/librarian/classifications')
    } catch (error) {
      setError(getApiErrorMessage(error, 'Lưu phân loại thất bại. Vui lòng kiểm tra backend.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <LibrarianLayout
      active="classifications"
      title={isEdit ? 'Chỉnh sửa phân loại' : 'Thêm phân loại'}
      description="Tạo hoặc cập nhật phân loại DDC cho librarian bằng dữ liệu thật từ backend."
    >
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
        {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="text-[13px] font-semibold text-slate-700">Mã phân loại</span>
            <input value={classificationId || 'Tự động tạo sau khi lưu'} readOnly className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 text-[14px] text-slate-500 outline-none" />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-slate-700">Hệ thống</span>
            <div className="relative mt-2">
              <select value={form.classificationSystem} onChange={(event) => updateField('classificationSystem', event.target.value)} disabled={loading || submitting} className="h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 text-[14px] text-slate-800 outline-none disabled:bg-slate-50">
                <option value="DDC">DDC</option>
                <option value="LCC">LCC</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-slate-700">Tên phân loại</span>
            <input value={form.classificationName} onChange={(event) => updateField('classificationName', event.target.value)} placeholder="Ví dụ: Khoa học máy tính" disabled={loading || submitting} className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50" />
          </label>
          <label className="block">
            <span className="text-[13px] font-semibold text-slate-700">Code</span>
            <input value={form.classificationCode} onChange={(event) => updateField('classificationCode', event.target.value)} placeholder="Ví dụ: 004" disabled={loading || submitting} className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[14px] text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50" />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Link to="/librarian/classifications" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-medium text-slate-700">
            Hủy
          </Link>
          <button type="submit" disabled={loading || submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50">
            <Save size={16} />
            {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật phân loại' : 'Lưu phân loại'}
          </button>
        </div>
      </form>
    </LibrarianLayout>
  )
}

export default LibrarianClassificationForm
