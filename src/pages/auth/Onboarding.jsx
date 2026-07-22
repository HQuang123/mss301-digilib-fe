import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, GraduationCap, BookOpen, AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/authSlice'

const ONBOARDED_ROLES = ['student', 'lecturer', 'librarian', 'admin']

function Onboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { roles, selectRole, clearSession } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const alreadyOnboarded = roles.some((r) => ONBOARDED_ROLES.includes(r))
  const reason = searchParams.get('reason')

  const handleChoose = async (role) => {
    setSelectedRole(role)
    setError('')
    setLoading(true)
    try {
      await selectRole(role)
      // The backend has updated the Keycloak realm role and the profile, but
      // the JWT in localStorage still does not contain the new role.  Force a
      // re-login so the next access token reflects the choice and the gateway's
      // OnboardingRequiredFilter stops blocking.  Clear the stale tokens first
      // so the existing (un-onboarded) token isn't reused.
      clearSession()
      navigate('/login?reason=onboarded', { replace: true })
    } catch (err) {
      const code = err?.response?.data?.code
      if (code === 'INVALID_ROLE') {
        setError('Vai trò không hợp lệ. Vui lòng chọn Sinh viên hoặc Giảng viên.')
      } else if (code === 'MEMBER_PROFILE_NOT_FOUND') {
        setError('Chưa có hồ sơ thành viên. Vui lòng hoàn tất đăng ký trước.')
      } else if (code === 'SERVICE_ACCOUNT_UNAUTHORIZED') {
        setError(
          'Hệ thống không có quyền gán vai trò trong Keycloak. Vui lòng liên hệ quản trị viên cấp quyền "realm-management.view-realm" và "realm-management.manage-users" cho service account "digilib-auth" trong Keycloak Admin Console.',
        )
      } else if (code === 'ROLE_NOT_FOUND') {
        setError(
          'Vai trò chưa được tạo trong Keycloak. Vui lòng liên hệ quản trị viên tạo realm roles "student" và "lecturer" trong realm "digilib-realm".',
        )
      } else if (err?.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        clearSession()
        navigate('/login', { replace: true })
      } else {
        setError('Không thể cập nhật vai trò. Vui lòng thử lại sau.')
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
        <section className="w-full max-w-[520px] border border-slate-300 bg-white px-8 py-12 sm:px-12">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold text-slate-950">Readora</h1>
            <div className="mx-auto mt-4 h-0.5 w-12 bg-slate-950" />
            <h2 className="mt-8 font-serif text-3xl font-semibold text-slate-950">
              Hoàn tất đăng ký
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Chọn vai trò của bạn để bắt đầu sử dụng thư viện số. Việc này sẽ xác định quyền truy cập
              và các tính năng dành riêng cho bạn.
            </p>
          </div>

          {alreadyOnboarded && reason !== 'forced' && (
            <div className="mt-8 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>
                Tài khoản của bạn đã được chọn vai trò. Nếu bạn muốn đổi vai trò, vui lòng liên hệ
                quản trị viên.
              </span>
            </div>
          )}

          {error && (
            <div className="mt-8 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleChoose('student')}
              disabled={loading || (alreadyOnboarded && reason !== 'forced')}
              className={[
                'flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition',
                selectedRole === 'student'
                  ? 'border-slate-950 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-400',
                (loading || (alreadyOnboarded && reason !== 'forced')) &&
                  'cursor-not-allowed opacity-60',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white">
                <BookOpen size={22} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-950">Sinh viên</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Mượn sách, theo dõi khoản mượn và nhận thông báo nhắc nhở.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleChoose('lecturer')}
              disabled={loading || (alreadyOnboarded && reason !== 'forced')}
              className={[
                'flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition',
                selectedRole === 'lecturer'
                  ? 'border-slate-950 bg-slate-50'
                  : 'border-slate-200 bg-white hover:border-slate-400',
                (loading || (alreadyOnboarded && reason !== 'forced')) &&
                  'cursor-not-allowed opacity-60',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white">
                <GraduationCap size={22} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-950">Giảng viên</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Quyền mượn sách với hạn mức dài hơn và các tài nguyên nghiên cứu.
                </p>
              </div>
            </button>
          </div>

          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 size={14} className="animate-spin" />
              Đang cập nhật vai trò...
            </div>
          )}

          <p className="mt-8 text-center text-xs text-slate-500">
            Vai trò thủ thư (librarian) và quản trị viên (admin) chỉ được cấp bởi quản trị viên
            thông qua hệ thống Keycloak.
          </p>
        </section>
      </main>
    </div>
  )
}

export default Onboarding