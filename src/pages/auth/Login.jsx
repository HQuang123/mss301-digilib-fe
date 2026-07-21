import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useAuthStore, { getRoleHomePath } from '@/store/authSlice'
import { generateRandomString, generateCodeChallenge, OAUTH_CONFIG } from '@/lib/oauth2'

function Login() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getRoleHomePath(useAuthStore.getState().roles), { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate(getRoleHomePath(useAuthStore.getState().roles))
    } catch (err) {
      const status = err?.response?.status
      switch (status) {
        case 401:
          setError('Email hoặc mật khẩu không chính xác.')
          break
        case 403:
          navigate('/verify-email')
          return
        case 429:
          setError('Quá nhiều lần thử. Vui lòng đợi trước khi thử lại.')
          break
        default:
          setError('Dịch vụ xác thực tạm thời không khả dụng.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // Generate PKCE parameters
    const codeVerifier = generateRandomString(64)
    const state = generateRandomString(32)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Store in sessionStorage for the callback verification
    sessionStorage.setItem('oauth_code_verifier', codeVerifier)
    sessionStorage.setItem('oauth_state', state)

    // Construct authorization URL
    const authUrl = new URL(`${OAUTH_CONFIG.keycloakUrl}/auth`)
    authUrl.searchParams.append('client_id', OAUTH_CONFIG.clientId)
    authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', 'openid profile email')
    authUrl.searchParams.append('kc_idp_hint', 'google')
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')
    authUrl.searchParams.append('state', state)

    // Redirect to Keycloak/Google
    window.location.href = authUrl.toString()
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
              Chào mừng trở lại
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Hệ thống lưu trữ và quản lý học thuật chuyên sâu.
            </p>
          </div>

          {error && (
            <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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

            <div>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="password" className="text-sm font-bold tracking-wide text-slate-900">
                  Mật khẩu
                </label>
                <a href="#" className="text-sm font-bold text-slate-950 underline-offset-4 hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 h-11 w-full border border-slate-400 bg-slate-50 px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-950 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 bg-[#020b1b] text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-500">Hoặc</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 border border-slate-300 bg-white text-sm font-bold tracking-wide text-slate-900 transition hover:bg-slate-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Đăng nhập bằng Google
          </button>

          <p className="mx-auto mt-9 max-w-xs text-center text-sm leading-6 text-slate-600">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" className="text-slate-950 underline">
              Quy định sử dụng
            </a>{' '}
            của thư viện.
          </p>

          <div className="mt-8 border-t border-slate-300 pt-8 text-center">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-bold text-slate-950 underline-offset-4 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Login
