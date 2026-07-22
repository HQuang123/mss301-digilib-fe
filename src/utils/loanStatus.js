export const LOAN_STATUS_LABELS = Object.freeze({
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  BORROWED: 'Đang mượn',
  OVERDUE: 'Quá hạn',
  RETURNED: 'Đã trả',
  LOST: 'Đã mất',
})

export function getLoanStatusLabel(status) {
  return LOAN_STATUS_LABELS[status] || status || 'Không rõ'
}
