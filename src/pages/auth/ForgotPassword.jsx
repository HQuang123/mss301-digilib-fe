import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import * as authApi from '@/api/authApi'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      // The backend always returns 202 Accepted regardless of whether the
      // email is registered (closes the user-enumeration oracle).  Reaching
      // this catch branch means the request itself failed (network, 429, 5xx);
      // surface a generic message and never reveal whether the email exists.
      const status = err?.response?.status
      if (status === 429) {
        setError('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại sau.')
      }
    } finally {
      setLoading(false)
    }
  }

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
              Quên mật khẩu
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
            </p>
          </div>

          {error && (
            <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="mt-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Yêu cầu đã được gửi</h3>
              <p className="mt-2 text-sm text-slate-600">
                Nếu email <strong>{email}</strong> đã được đăng ký, bạn sẽ nhận được liên kết đặt lại
                mật khẩu trong vài phút. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).
              </p>
              <Link
                to="/login"
                className="mt-6 flex h-12 w-full items-center justify-center border border-slate-300 bg-white text-sm font-bold tracking-wide text-slate-900 transition hover:bg-slate-50"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="text-sm font-bold tracking-wide text-slate-900">
                  Email sinh viên / giảng viên
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@university.edu.vn"
                  className="mt-2 h-11 w-full border border-slate-400 bg-slate-50 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-950 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="flex h-12 w-full items-center justify-center gap-2 bg-[#020b1b] text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Đang gửi yêu cầu...' : 'Gửi liên kết đặt lại'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-8 border-t border-slate-300 pt-8 text-center">
              <p className="text-sm text-slate-600">
                Đã nhớ mật khẩu?{' '}
                <Link
                  to="/login"
                  className="font-bold text-slate-950 underline-offset-4 hover:underline"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default ForgotPassword
