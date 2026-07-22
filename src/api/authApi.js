import axiosClient from './axiosClient'

export const login = (username, password) =>
  axiosClient.post('/api/v1/auth/login', { username, password })

export const register = ({ email, password, firstName, lastName }) =>
  axiosClient.post('/api/v1/auth/register', { email, password, firstName, lastName })

export const logout = (refreshToken, idToken) =>
  axiosClient.post('/api/v1/auth/logout', { refreshToken, idToken, id_token: idToken })

export const forgotPassword = (email) =>
  axiosClient.post('/api/v1/auth/forgot-password', { email })
export const exchangeOAuth2Code = (code, codeVerifier, redirectUri) =>
  axiosClient.post('/api/v1/auth/oauth2/exchange', { code, codeVerifier, redirectUri })
