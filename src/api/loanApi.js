import axiosClient from './axiosClient.js'

export const getLoans = ({ page = 0, size = 20, sort = 'borrowedAt,desc' } = {}) =>
  axiosClient.get('/api/v1/loans', { params: { page, size, sort } })

export const getLoanById = (loanId) =>
  axiosClient.get(`/api/v1/loans/${loanId}`)

export const getLoansByMember = () =>
  axiosClient.get('/api/v1/loans/my-loans')

export const returnBook = (loanId, idempotencyKey) =>
  axiosClient.post('/api/v1/loans/return', { loanId, idempotencyKey })

export const renewLoan = (loanId) =>
  axiosClient.put(`/api/v1/loans/${loanId}/renew`)

export const createBorrowRequest = ({ bookId, bookType = 'PHYSICAL', idempotencyKey }) =>
  axiosClient.post('/api/v1/borrow-requests', { bookId, bookType, idempotencyKey })

export const checkBorrowEligibility = () =>
  axiosClient.get('/api/v1/borrow-requests/eligibility')

export const getMyBorrowRequests = ({ page = 0, size = 20 } = {}) =>
  axiosClient.get('/api/v1/borrow-requests/me', { params: { page, size } })

export const getBorrowRequests = ({ status = 'PENDING', page = 0, size = 20 } = {}) =>
  axiosClient.get('/api/v1/borrow-requests', { params: { status, page, size } })

export const approveBorrowRequest = (requestId) =>
  axiosClient.post(`/api/v1/borrow-requests/${requestId}/approve`)

export const rejectBorrowRequest = (requestId, reason) =>
  axiosClient.post(`/api/v1/borrow-requests/${requestId}/reject`, { reason })

export const cancelBorrowRequest = (requestId) =>
  axiosClient.delete(`/api/v1/borrow-requests/${requestId}`)
