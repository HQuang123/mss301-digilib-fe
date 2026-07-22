import axiosClient from './axiosClient'

export const getMyNotifications = ({ status, page = 0, size = 20 } = {}) =>
  axiosClient.get('/api/notifications/me', { params: { status, page, size } })

export const markNotificationRead = (id) =>
  axiosClient.patch(`/api/notifications/${id}/read`)
