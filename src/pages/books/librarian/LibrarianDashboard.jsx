import { AlertTriangle, BookOpen, Filter, MoreVertical, Repeat2, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import LibrarianLayout from './LibrarianLayout'

const stats = [
  { label: 'Tổng số đầu sách', value: '12,482', icon: BookOpen, badge: '+2.4%' },
  { label: 'Đang cho mượn', value: '458', icon: Repeat2, badge: 'Ổn định' },
  { label: 'Quá hạn trả', value: '34', icon: AlertTriangle, badge: '+12', danger: true },
  { label: 'Thành viên mới', value: '126', icon: UserPlus, badge: '+15%' },
]

const activities = [
  ['LA', 'Lê Anh Tuấn', 'The Great Gatsby', '10/10/2023', '24/10/2023', 'AVAILABLE'],
  ['HM', 'Hoàng Minh', 'Sapiens: Lược sử loài người', '05/10/2023', '19/10/2023', 'OVERDUE'],
  ['VT', 'Vũ Thị Trinh', 'Tư duy nhanh và chậm', '15/10/2023', '29/10/2023', 'LOANED'],
  ['ND', 'Nguyễn Duy', 'Clean Code', '18/10/2023', '01/11/2023', 'LOANED'],
]

function StatCard({ stat }) {
  const Icon = stat.icon
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${stat.danger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-900'}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <strong className={`text-2xl font-semibold ${stat.danger ? 'text-red-700' : 'text-slate-950'}`}>{stat.value}</strong>
        <span className={`mb-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${stat.danger ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {stat.badge}
        </span>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    OVERDUE: 'bg-red-100 text-red-700',
    LOANED: 'bg-slate-100 text-slate-700',
  }
  return <span className={`rounded-full px-3 py-1 text-[10px] font-semibold ${styles[status]}`}>{status}</span>
}

function TrendPanel() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Operations</p>
      <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Biểu đồ mượn sách tuần này</h2>
      <p className="mt-1.5 text-[13px] text-slate-600">Theo dõi tần suất mượn trả để cân đối nghiệp vụ thư viện trong tuần hiện tại.</p>
      <div className="mt-6 grid h-56 grid-cols-7 items-end gap-3 px-2 sm:gap-5 sm:px-6">
        {[34, 58, 42, 76, 64, 88, 52].map((height, index) => (
          <div key={height} className="flex h-full flex-col justify-end gap-2">
            <div className="rounded-t-2xl bg-slate-950" style={{ height: `${height}%` }} />
            <span className="text-center text-[11px] font-semibold text-slate-600">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function RecentActivities() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Recent activity</p>
          <h2 className="mt-2 font-serif text-[24px] font-semibold tracking-tight text-slate-950">Hoạt động mượn trả gần đây</h2>
        </div>
        <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-[13px] font-medium text-slate-700">
          <Filter size={15} />
          Lọc
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-slate-50 text-[13px] font-semibold text-slate-500">
            <tr>
              <th className="px-5 py-4">Tên thành viên</th>
              <th className="px-5 py-4">Tên sách</th>
              <th className="px-5 py-4">Ngày mượn</th>
              <th className="px-5 py-4">Ngày hết hạn</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map(([initials, member, book, loanDate, dueDate, status], index) => (
              <tr key={member} className="hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold ${index % 2 ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                      {initials}
                    </span>
                    <span className="font-semibold text-slate-950">{member}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{book}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{loanDate}</td>
                <td className={`px-5 py-4 text-sm ${status === 'OVERDUE' ? 'font-semibold text-red-600' : 'text-slate-600'}`}>{dueDate}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="text-slate-500" aria-label="Thao tác">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-[13px] text-slate-600">
        <p>Hiển thị 4 trong số 120 giao dịch</p>
        <div className="flex gap-2">
          <button className="h-9 rounded-xl border border-slate-300 px-4">Trước</button>
          <button className="h-9 rounded-xl bg-slate-950 px-4 text-white">Tiếp</button>
        </div>
      </div>
    </section>
  )
}

function LibrarianDashboard() {
  return (
    <LibrarianLayout
      active="dashboard"
      title="Dashboard"
      description="Tổng quan hoạt động mượn trả, thành viên và các đầu việc vận hành thư viện theo cùng phong cách với khu admin."
      action={<Link to="/librarian/borrow-requests" className="inline-flex h-10 w-fit items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[13px] font-semibold text-white">Duyệt yêu cầu mượn</Link>}
    >
      <section className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>
      <div className="mt-5 grid gap-5 2xl:grid-cols-[1.05fr_1fr]">
        <TrendPanel />
        <RecentActivities />
      </div>
    </LibrarianLayout>
  )
}

export default LibrarianDashboard
