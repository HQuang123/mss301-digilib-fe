import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  CreditCard,
  BookOpen,
  Calendar,
  Shield,
  Pencil,
  Check,
  X,
  Loader2,
  LogOut
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import useAuthStore from '@/store/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getInitials(firstName, lastName) {
  const f = firstName?.charAt(0)?.toUpperCase() || ''
  const l = lastName?.charAt(0)?.toUpperCase() || ''
  return f + l || '?'
}

function getStatusConfig(status) {
  switch (status) {
    case 'UNLOCKED':
      return { label: 'Hoạt động', variant: 'success' }
    case 'SOFT_LOCKED':
      return { label: 'Hạn chế', variant: 'warning' }
    case 'LOCKED':
      return { label: 'Đã khóa', variant: 'danger' }
    default:
      return { label: status || 'Không rõ', variant: 'default' }
  }
}

function getMemberTypeLabel(type) {
  switch (type) {
    case 'STUDENT':
      return 'Sinh viên'
    case 'LECTURER':
      return 'Giảng viên'
    case 'STAFF':
      return 'Nhân viên'
    case 'RESEARCHER':
      return 'Nghiên cứu sinh'
    default:
      return type || 'Thành viên'
  }
}

function formatCurrency(amount) {
  if (amount == null) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function ProfileSkeleton() {



  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header card skeleton */}
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="h-20 w-20 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="h-6 w-48 rounded bg-slate-200" />
            <div className="h-4 w-36 rounded bg-slate-100" />
            <div className="flex justify-center gap-2 sm:justify-start">
              <div className="h-6 w-20 rounded-full bg-slate-100" />
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Info cards skeleton */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-5 space-y-4">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="h-3 w-20 rounded bg-slate-100" />
                  <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {children || <p className="mt-0.5 text-sm font-semibold text-slate-950">{value || '—'}</p>}
      </div>
    </div>
  )
}

// ── Success Toast ───────────────────────────────────────────────────────────

function SuccessBanner({ show, onClose }) {
  if (!show) return null

  return (
    <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-[slideDown_0.3s_ease-out]">
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg">
        <Check size={16} className="text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700">Cập nhật hồ sơ thành công!</span>
        <button onClick={onClose} className="ml-2 text-emerald-400 hover:text-emerald-600">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

function Profile() {
  const navigate = useNavigate()
  const { user, initialized, loading: storeLoading, isAuthenticated, fetchProfile, updateProfile } = useAuthStore()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' })

  // Redirect if not authenticated once store is initialized
  useEffect(() => {
    if (initialized && !isAuthenticated()) {
      navigate('/login', { replace: true })
    }
  }, [initialized, isAuthenticated, navigate])

  // Fetch profile if user is null but authenticated
  useEffect(() => {
    if (initialized && isAuthenticated() && !user) {
      fetchProfile()
    }
  }, [initialized, isAuthenticated, user, fetchProfile])

  // Sync form state when user loads or changes
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  // Auto-dismiss success banner
  useEffect(() => {
    if (!showSuccess) return
    const timer = setTimeout(() => setShowSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [showSuccess])

  function handleEdit() {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    })
    setError('')
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Họ và tên không được để trống.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await useAuthStore.getState().updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      })
      setEditing(false)
      setShowSuccess(true)
    } catch {
      setError('Không thể cập nhật hồ sơ. Vui lòng thử lại sau.')
    } finally {
      setSaving(false)
    }
  }
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
  }

  // Show skeleton while initializing or loading user
  if (!initialized || (!user && storeLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main>
          <ProfileSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  // User not loaded (and not redirected yet)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main>
          <ProfileSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  const statusConfig = getStatusConfig(user.status)
  const initials = getInitials(user.firstName, user.lastName)
  const fullName = [user.lastName, user.firstName].filter(Boolean).join(' ') || 'Chưa cập nhật'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <SuccessBanner show={showSuccess} onClose={() => setShowSuccess(false)} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* ── Page Title ──────────────────────────────────────────────── */}
        <h1 className="font-serif text-[28px] font-semibold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý thông tin tài khoản thư viện của bạn</p>

        {/* ── Profile Header Card ─────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            {/* Avatar */}
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-slate-900 text-2xl font-bold text-white">
              {initials}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">{fullName}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {user.memberCode && (
                  <Badge variant="dark">{user.memberCode}</Badge>
                )}
                <Badge className="bg-amber-50 text-amber-700">
                  {getMemberTypeLabel(user.memberType)}
                </Badge>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
            </div>

            {/* Edit button */}
            <div className="shrink-0">
              {!editing ? (
                <Button variant="secondary" size="sm" onClick={handleEdit} className="rounded-full">
                  <Pencil size={14} />
                  Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-full"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Lưu
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-full"
                  >
                    <X size={14} />
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Validation error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* ── Info Cards Grid ─────────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Personal Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-950">
              <User size={16} className="text-slate-400" />
              Thông tin cá nhân
            </h3>

            <div className="mt-5 space-y-4">
              <InfoRow icon={User} label="Họ">
                {editing ? (
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="mt-1 h-9"
                    placeholder="Nhập họ"
                  />
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-slate-950">{user.lastName || '—'}</p>
                )}
              </InfoRow>

              <InfoRow icon={User} label="Tên">
                {editing ? (
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="mt-1 h-9"
                    placeholder="Nhập tên"
                  />
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-slate-950">{user.firstName || '—'}</p>
                )}
              </InfoRow>

              <InfoRow icon={Mail} label="Email" value={user.email} />

              <InfoRow icon={Phone} label="Số điện thoại">
                {editing ? (
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 h-9"
                    placeholder="Nhập số điện thoại"
                    type="tel"
                  />
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-slate-950">{user.phone || '—'}</p>
                )}
              </InfoRow>

              <InfoRow icon={Calendar} label="Ngày tham gia" value={formatDate(user.createdAt)} />
            </div>
          </div>

          {/* Member Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-950">
              <CreditCard size={16} className="text-slate-400" />
              Thông tin thành viên
            </h3>

            <div className="mt-5 space-y-4">
              <InfoRow icon={Shield} label="Loại thành viên" value={getMemberTypeLabel(user.memberType)} />

              <InfoRow icon={CreditCard} label="Mã thành viên" value={user.memberCode} />

              <InfoRow icon={BookOpen} label="Giới hạn mượn">
                <p className="mt-0.5 text-sm font-semibold text-slate-950">
                  {user.borrowingLimit != null ? `${user.borrowingLimit} cuốn` : '—'}
                </p>
              </InfoRow>

              <InfoRow icon={Calendar} label="Thời hạn mượn">
                <p className="mt-0.5 text-sm font-semibold text-slate-950">
                  {user.loanPeriodDays != null ? `${user.loanPeriodDays} ngày` : '—'}
                </p>
              </InfoRow>

              <InfoRow icon={CreditCard} label="Dư nợ phạt">
                <p
                  className={cn(
                    'mt-0.5 text-sm font-semibold',
                    user.outstandingBalance > 0 ? 'text-red-600' : 'text-slate-950',
                  )}
                >
                  {formatCurrency(user.outstandingBalance)}
                </p>
              </InfoRow>
            </div>
          </div>
        </div>

        {/* ── Account Metadata ────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-slate-950">
            <Calendar size={16} className="text-slate-400" />
            Thời gian
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[13px] font-medium text-slate-500">Ngày tạo tài khoản</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-950">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500">Cập nhật lần cuối</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-950">{formatDate(user.updatedAt)}</p>
            </div>
          </div>
        </div>

                  {/* LOGOUT */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="destructive"
              className="rounded-2xl px-3 text-red-600 hover:bg-red-50 hover:text-red-700 w-full border border-red-600"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Đăng xuất
            </Button>
          </div>
      </main>

      <Footer />
    </div>
  )
}

export default Profile
