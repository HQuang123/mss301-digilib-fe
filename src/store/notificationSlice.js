import { create } from 'zustand'
import * as notificationApi from '@/api/notificationApi'

const useNotificationStore = create((set, get) => ({
  // State
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // ── Actions ─────────────────────────────────────────────────────────────

  fetchUnread: async () => {
    set({ loading: true, error: null })
    try {
      const res = await notificationApi.getMyNotifications({ status: 'UNREAD' })
      const items = res.data?.content ?? res.data ?? []
      set({ items, unreadCount: items.length })
    } catch (err) {
      // Keep the last-known count on failure rather than clearing it — a
      // transient backend blip shouldn't tell the student "nothing new".
      set({ error: err })
    } finally {
      set({ loading: false })
    }
  },

  markAsRead: async (id) => {
    const { items } = get()

    // Optimistic update — the endpoint is idempotent, so reconciling later
    // with the real response is safe.
    set({
      items: items.map((n) => (n.id === id ? { ...n, status: 'READ' } : n)),
      unreadCount: Math.max(0, get().unreadCount - 1),
    })

    try {
      await notificationApi.markNotificationRead(id)
    } catch (err) {
      if (err?.response?.status === 404) {
        // Notification no longer exists — drop it silently.
        set((state) => ({ items: state.items.filter((n) => n.id !== id) }))
        return
      }
      // Revert optimistic update on unexpected failure.
      set((state) => ({
        items: state.items.map((n) => (n.id === id ? { ...n, status: 'UNREAD' } : n)),
        unreadCount: state.unreadCount + 1,
      }))
      throw err
    }
  },

  reset: () => set({ items: [], unreadCount: 0, loading: false, error: null }),
}))

export default useNotificationStore
