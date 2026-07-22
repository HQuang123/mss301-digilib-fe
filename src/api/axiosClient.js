import axios from 'axios'

const apiBaseUrl = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL || ''

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'X-Client-Type': 'web',
  },
})

// ── Request interceptor: attach Bearer token ────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: handle 401 → auto-logout, 403 ONBOARDING_REQUIRED → /onboarding ─
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const code = error.response?.data?.code

    if (status === 401) {
      // Skip auto-logout for unauthenticated auth endpoints (login, register, oauth2/exchange)
      if (!url.includes('/auth/')) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // Redirect to login — using window.location to break out of React Router
        window.location.href = '/login'
      }
    } else if (
      status === 403 &&
      code === 'ONBOARDING_REQUIRED' &&
      !url.includes('/auth/') &&
      !window.location.pathname.startsWith('/onboarding')
    ) {
      // The gateway's OnboardingRequiredFilter blocks authenticated-but-not-onboarded
      // users from every protected endpoint.  Redirect them to the role-choice page
      // (using window.location to break out of React Router and avoid loops).
      window.location.href = '/onboarding?reason=forced'
    }

    return Promise.reject(error)
  },
)

export default axiosClient
