import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useAuthStore from '@/store/authSlice'

function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    // Clear field-level error on change
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    setError('')
  }

  const validate = () => {
    const errors = {}

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email.trim()) {
      errors.email = 'Vui lòng nhập email.'
    } else if (!emailRegex.test(form.email)) {
      errors.email = 'Email không đúng định dạng.'
    }

    // Password
    if (!form.password) {
      errors.password = 'Vui lòng nhập mật khẩu.'
    } else if (form.password.length < 8 || form.password.length > 64) {
      errors.password = 'Mật khẩu phải từ 8 đến 64 ký tự.'
    }

    // Confirm password
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    } else if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }

    // firstName / lastName (optional but max 100)
    if (form.firstName.length > 100) {
      errors.firstName = 'Họ không được vượt quá 100 ký tự.'
    }
    if (form.lastName.length > 100) {
      errors.lastName = 'Tên không được vượt quá 100 ký tự.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setError('')
    setLoading(true)

    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      })
      navigate('/verify-email')
    } catch (err) {
      const status = err?.response?.status
      const code = err?.response?.data?.code
      const backendMessage = err?.response?.data?.message
      switch (status) {
        case 409:
          setError('Email này đã được đăng ký.')
          break
        case 400:
          if (code === 'PASSWORD_POLICY_VIOLATION') {
            setError('Mật khẩu không đáp ứng chính sách bảo mật. Vui lòng chọn mật khẩu mạnh hơn.')
          } else if (code === 'INVALID_PASSWORD') {
            setError('Mật khẩu không hợp lệ.')
          } else {
            setError('Thông tin không hợp lệ. Vui lòng kiểm tra lại.')
          }
          break
        case 503:
          // Backend returns 503 when Keycloak is unavailable or the service
          // account can't create users — show the backend's structured
          // message so the operator/user sees the actual cause.
          setError(backendMessage || 'Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.')
          break
        case 500:
          setError(backendMessage || 'Lỗi máy chủ khi đăng ký. Vui lòng thử lại sau.')
          break
        default:
          setError(backendMessage || 'Đăng ký không thành công. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
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
              Tạo tài khoản mới
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Đăng ký để truy cập hệ thống thư viện số.
            </p>
          </div>

          {error && (
            <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="text-sm font-bold tracking-wide text-slate-900">
                  Họ
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="family-name"
                  value={form.firstName}
                  onChange={updateField('firstName')}
                  placeholder="Nguyễn"
                  className={fieldErrors.firstName ? inputErrorClass : inputClass}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm font-bold tracking-wide text-slate-900">
                  Tên
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="given-name"
                  value={form.lastName}
                  onChange={updateField('lastName')}
                  placeholder="Văn A"
                  className={fieldErrors.lastName ? inputErrorClass : inputClass}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-bold tracking-wide text-slate-900">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={updateField('email')}
                placeholder="example@university.edu.vn"
                className={fieldErrors.email ? inputErrorClass : inputClass}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-sm font-bold tracking-wide text-slate-900">
                Mật khẩu
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

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-bold tracking-wide text-slate-900">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                placeholder="Nhập lại mật khẩu"
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
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-300 pt-8 text-center">
            <p className="text-sm text-slate-600">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-bold text-slate-950 underline-offset-4 hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Register
