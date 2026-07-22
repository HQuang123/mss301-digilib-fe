import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'

function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    setError('')
  }

  const validate = () => {
    const errors = {}

    if (!form.password) {
      errors.password = 'Vui lòng nhập mật khẩu mới.'
    } else if (form.password.length < 8 || form.password.length > 64) {
      errors.password = 'Mật khẩu phải từ 8 đến 64 ký tự.'
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    } else if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setError('')
    setLoading(true)

    // UI-only placeholder. A future plan will wire this to the Keycloak Admin
    // REST API (/admin/realms/{realm}/users/{id}/reset-password) or to the
    // action-token flow, validating the reset link signature before updating.
    await new Promise((resolve) => setTimeout(resolve, 700))

    setSuccess(true)
    setLoading(false)
  }

  const inputClass =
    'mt-2 h-11 w-full border border-slate-400 bg-slate-50 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-950 focus:bg-white'
  const inputErrorClass =
    'mt-2 h-11 w-full border border-red-400 bg-red-50 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-red-600 focus:bg-white'

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8 lg:px-10">
          <Link to="/" className="font-serif text-2xl font-bold text-slate-950">
            Readora
          </Link>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 py-12 sm:py-16">
        <section className="w-full max-w-[440px] border border-slate-300 bg-white px-8 py-12 sm:px-12">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold text-slate-950">Readora</h1>
            <div className="mx-auto mt-4 h-0.5 w-12 bg-slate-950" />
            <h2 className="mt-8 font-serif text-3xl font-semibold text-slate-950">
              Đặt mật khẩu mới
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Chọn mật khẩu mới cho tài khoản Readora của bạn.
            </p>
          </div>

          {success ? (
            <div className="mt-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mật khẩu đã được cập nhật</h3>
              <p className="mt-2 text-sm text-slate-600">
                Bạn có thể đăng nhập bằng mật khẩu mới. Nếu quên lại, hãy sử dụng tính năng quên
                mật khẩu một lần nữa.
              </p>
              <Link
                to="/login"
                className="mt-6 flex h-12 w-full items-center justify-center border border-slate-300 bg-white text-sm font-bold tracking-wide text-slate-900 transition hover:bg-slate-50"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="password" className="text-sm font-bold tracking-wide text-slate-900">
                    Mật khẩu mới
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={updateField('password')}
                    placeholder="Tối thiểu 8 ký tự"
                    className={fieldErrors.password ? inputErrorClass : inputClass}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-bold tracking-wide text-slate-900"
                  >
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    placeholder="Nhập lại mật khẩu mới"
                    className={fieldErrors.confirmPassword ? inputErrorClass : inputClass}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-[#020b1b] text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Đang cập nhật...' : 'Đặt mật khẩu mới'}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-300 pt-8 text-center">
                <p className="text-sm text-slate-600">
                  Nhớ ra mật khẩu cũ?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-slate-950 underline-offset-4 hover:underline"
                  >
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default ResetPassword