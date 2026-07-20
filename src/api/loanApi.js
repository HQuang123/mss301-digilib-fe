import axiosClient from './axiosClient'

export const getLoans = ({ page = 0, size = 20, sort = 'borrowedAt,desc' } = {}) =>
  axiosClient.get('/api/v1/loans', { params: { page, size, sort } })

export const getLoanById = (loanId) =>
  axiosClient.get(`/api/v1/loans/${loanId}`)

export const getLoansByMember = (memberId) =>
  axiosClient.get('/api/v1/loans/my-loans', { params: { memberId } })

export const borrowBook = ({ memberId, bookId, bookType, idempotencyKey }) =>
  axiosClient.post('/api/v1/rent-books', { memberId, bookId, bookType, idempotencyKey })

export const returnBook = (loanId, idempotencyKey) =>
  axiosClient.post('/api/v1/loans/return', { loanId, idempotencyKey })

export const renewLoan = (loanId, actorId = 'WEB_USER') =>
  axiosClient.put(`/api/v1/loans/${loanId}/renew`, null, {
    headers: { 'X-Actor-Id': actorId },
  })
