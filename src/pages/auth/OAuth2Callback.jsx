import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/authSlice'
import { OAUTH_CONFIG } from '@/lib/oauth2'
import { exchangeOAuth2Code } from '@/api/authApi'

function OAuth2Callback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const isProcessing = useRef(false) // Prevent React strict mode double-firing

  useEffect(() => {
    if (isProcessing.current) return
    isProcessing.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (errorParam) {
      setError(errorDescription || 'Xác thực không thành công.')
      return
    }

    if (!code) {
      setError('Không tìm thấy mã xác thực.')
      return
    }

    const savedState = sessionStorage.getItem('oauth_state')
    const savedVerifier = sessionStorage.getItem('oauth_code_verifier')

    if (!savedState || !savedVerifier) {
      setError('Không tìm thấy thông tin phiên xác thực. Vui lòng thử lại.')
      return
    }

    if (state !== savedState) {
      setError('Mã xác thực không khớp (State mismatch).')
      return
    }

    // Exchange code for tokens via the backend (which adds the client_secret)
    const exchangeToken = async () => {
      try {
        const res = await exchangeOAuth2Code(code, savedVerifier, OAUTH_CONFIG.redirectUri)

        const { access_token, refresh_token } = res.data

        // Clear PKCE storage
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_code_verifier')

        // Dispatch to store
        useAuthStore.getState().setTokens(access_token, refresh_token)

        // Trigger JIT profile generation / fetch
        try {
          await useAuthStore.getState().fetchProfile()
        } catch (profileErr) {
          console.warn('Lỗi khi lấy thông tin hồ sơ JIT:', profileErr)
          // Non-fatal, let user continue to home
        }

        // Navigate to dashboard
        navigate('/', { replace: true })
      } catch (err) {
        console.error('Lỗi trao đổi token:', err)
        setError('Có lỗi xảy ra khi xác thực với máy chủ. Vui lòng thử lại.')
      }
    }

    exchangeToken()
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] p-4 text-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-8 text-center shadow-sm">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Đăng nhập thất bại</h2>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-6 flex h-10 w-full items-center justify-center bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Quay lại trang đăng nhập
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-slate-900" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Đang xác thực...</h2>
            <p className="mt-2 text-sm text-slate-600">
              Vui lòng đợi trong giây lát, chúng tôi đang thiết lập tài khoản của bạn.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default OAuth2Callback
