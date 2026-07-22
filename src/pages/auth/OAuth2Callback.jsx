import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/authSlice'
import { OAUTH_CONFIG } from '@/lib/oauth2'
import { exchangeOAuth2Code } from '@/api/authApi'

// Surfaces the actual backend error code returned by AuthService so the user
// (or developer) sees the real reason the Google login failed instead of a
// generic "Có lỗi xảy ra...". Maps backend error codes to Vietnamese copy.
function describeExchangeError(err) {
  const status = err?.response?.status
  const code = err?.response?.data?.code
  const backendMessage = err?.response?.data?.message

  if (!err.response) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.'
  }
  switch (status) {
    case 401:
      if (code === 'INVALID_CREDENTIALS') {
        return 'Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại bằng Google.'
      }
      return 'Phiên xác thực không hợp lệ. Vui lòng quay lại trang đăng nhập và thử lại.'
    case 403:
      if (code === 'EMAIL_NOT_VERIFIED') {
        return 'Tài khoản Google của bạn chưa được xác minh email. Vui lòng hoàn tất xác minh trong Google và thử lại.'
      }
      if (code === 'ACCOUNT_SETUP_INCOMPLETE') {
        return 'Tài khoản chưa được thiết lập đầy đủ. Vui lòng liên hệ quản trị viên.'
      }
      if (code === 'ACCOUNT_DISABLED') {
        return 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
      }
      return 'Tài khoản không thể đăng nhập. Vui lòng liên hệ quản trị viên.'
    case 429:
      return 'Quá nhiều lần thử đăng nhập. Vui lòng đợi trước khi thử lại.'
    case 502:
    case 503:
      return 'Dịch vụ xác thực (Keycloak) tạm thời không khả dụng (502/503). Vui lòng thử lại sau.'
    default:
      return backendMessage || 'Có lỗi xảy ra khi xác thực với máy chủ. Vui lòng thử lại.'
  }
}

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

        const { access_token, refresh_token, id_token, idToken } = res.data

        // Clear PKCE storage
        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('oauth_code_verifier')

        // Dispatch to store
        useAuthStore.getState().setTokens(access_token, refresh_token, id_token || idToken)

        // Trigger JIT profile generation / fetch
        try {
          await useAuthStore.getState().fetchProfile()
        } catch (profileErr) {
          console.warn('Lỗi khi lấy thông tin hồ sơ JIT:', profileErr)
          // Non-fatal, let user continue to home
        }

        // Federated (Google) users go through the same onboarding gate as
        // email/password registrants: if their JWT carries no onboarded realm
        // role, send them to /onboarding instead of the home page so they pick
        // student/lecturer.  Protected endpoints would otherwise 403 anyway.
        const roles = useAuthStore.getState().roles
        const ONBOARDED = ['student', 'lecturer', 'librarian', 'admin']
        if (!roles.some((r) => ONBOARDED.includes(r))) {
          navigate('/onboarding?reason=forced', { replace: true })
          return
        }

        // Navigate to dashboard
        navigate('/', { replace: true })
      } catch (err) {
        console.error('Lỗi trao đổi token:', err)
        setError(describeExchangeError(err))
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
