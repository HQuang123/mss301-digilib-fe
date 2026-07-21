import { create } from 'zustand'
import * as authApi from '@/api/authApi'
import * as memberApi from '@/api/memberApi'
import useNotificationStore from '@/store/notificationSlice'

// ── JWT helpers (no external dependency) ────────────────────────────────────

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

function extractRoles(payload) {
  if (!payload) return []
  const roles = payload.realm_access?.roles || []
  return roles.filter(
    (r) => !['offline_access', 'uma_authorization', 'default-roles-digilib-realm'].includes(r),
  )
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  // Consider expired 30 seconds early to avoid edge-case failures
  return Date.now() >= (payload.exp - 30) * 1000
}

export function getRoleHomePath(roles) {
  if (roles?.includes('admin')) return '/admin'
  if (roles?.includes('librarian')) return '/librarian'
  return '/'
}

// ── Zustand store ───────────────────────────────────────────────────────────

const useAuthStore = create((set, get) => ({
  // State
  accessToken: null,
  refreshToken: null,
  user: null,
  roles: [],
  initialized: false,
  loading: false,

  // ── Computed helpers (call as functions) ─────────────────────────────────
  isAuthenticated: () => {
    const { accessToken } = get()
    return !!accessToken && !isTokenExpired(accessToken)
  },

  hasRole: (...requiredRoles) => {
    const { roles } = get()
    return requiredRoles.some((r) => roles.includes(r))
  },

  // ── Token management ────────────────────────────────────────────────────
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    const payload = decodeJwtPayload(accessToken)
    const roles = extractRoles(payload)
    set({ accessToken, refreshToken, roles })
  },

  clearSession: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      roles: [],
    })
    useNotificationStore.getState().reset()
  },

  // ── Actions ─────────────────────────────────────────────────────────────

  initialize: async () => {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')

    if (!accessToken || isTokenExpired(accessToken)) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ initialized: true })
      return
    }

    const payload = decodeJwtPayload(accessToken)
    const roles = extractRoles(payload)
    set({ accessToken, refreshToken, roles })

    // Attempt to fetch profile silently
    try {
      const res = await memberApi.getMyProfile()
      set({ user: res.data })
    } catch {
      // Profile fetch failure is non-fatal; token might still be valid for
      // other requests (or the member-service is down)
    }

    set({ initialized: true })
  },

  login: async (username, password) => {
    set({ loading: true })
    try {
      const res = await authApi.login(username, password)
      const { access_token, refresh_token } = res.data
      get().setTokens(access_token, refresh_token)

      // Pull full profile
      try {
        const profileRes = await memberApi.getMyProfile()
        set({ user: profileRes.data })
      } catch {
        // Non-fatal: profile will be JIT-provisioned next time
      }

      return res.data
    } finally {
      set({ loading: false })
    }
  },

  register: async ({ email, password, firstName, lastName }) => {
    set({ loading: true })
    try {
      const res = await authApi.register({ email, password, firstName, lastName })
      return res.data
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    const { refreshToken, accessToken } = get()
    get().clearSession()

    // Best-effort server-side revocation
    if (refreshToken && accessToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // Already cleared locally; server failure is acceptable
      }
    }
  },

  fetchProfile: async () => {
    try {
      const res = await memberApi.getMyProfile()
      set({ user: res.data })
      return res.data
    } catch (err) {
      throw err
    }
  },

  updateProfile: async (payload) => {
    set({ loading: true })
    try {
      const res = await memberApi.updateMyProfile(payload)
      set({ user: res.data })
      return res.data
    } finally {
      set({ loading: false })
    }
  },
}))

export default useAuthStore
