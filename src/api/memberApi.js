import axiosClient from './axiosClient'

export const getMyProfile = () =>
  axiosClient.get('/api/v1/members/me')

export const updateMyProfile = (payload) =>
  axiosClient.patch('/api/v1/members/me', payload)

export const getAllMembers = () =>
  axiosClient.get('/api/v1/members')

export const getMemberById = (memberId) =>
  axiosClient.get(`/api/v1/members/${memberId}`)

export const updateMemberStatus = (memberId, status) =>
  axiosClient.put(`/api/v1/members/${memberId}/status`, { status })

// Onboarding: self-assign student or lecturer realm role. Backend mirrors the
// choice into Keycloak realm roles AND profile.memberType.  The current access
// token is NOT refreshed by this call — the caller must re-login (or otherwise
// obtain a fresh JWT) before protected endpoints stop returning 403.
export const selectRole = (role) =>
  axiosClient.patch('/api/v1/members/me/role', { role })
