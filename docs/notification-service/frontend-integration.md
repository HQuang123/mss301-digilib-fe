# Frontend Integration — Notification Bell

This describes how the FE (this repo) should consume the notification-service
endpoints defined in [backend-api-contract.md](./backend-api-contract.md) to
drive the header notification bell. It only covers scenarios (d) and (e) from
that contract — the FE never calls `POST /api/notifications` or
`POST /api/notifications/return-confirmation` directly; those are
service-to-service calls made by `loan-service`.

The bell icon already exists as a static placeholder in
[Header.jsx:43-45](../../src/components/layout/Header.jsx#L43-L45) — this doc
describes what needs to be wired behind it.

---

## 1. Endpoints consumed by the FE

| Purpose | Method | Path | Auth |
|---|---|---|---|
| List my notifications | `GET` | `/api/notifications/me?status=UNREAD&page=0&size=20` | `Bearer <JWT>` |
| Mark one as read | `PATCH` | `/api/notifications/{id}/read` | `Bearer <JWT>` |

Both require the standard `Authorization: Bearer <access_token>` header,
already attached automatically by
[axiosClient.js:13-22](../../src/api/axiosClient.js#L13-L22) — no extra wiring
needed there.

`studentId` is never sent by the client; the backend derives it from the JWT
subject/claim (contract doc, scenario e, "Gateway security" note). The FE only
ever asks for "my" notifications.

---

## 2. New API module — `src/api/notificationApi.js`

Follow the existing per-domain module pattern (`loanApi.js`, `memberApi.js`):

```js
import axiosClient from './axiosClient'

export const getMyNotifications = ({ status, page = 0, size = 20 } = {}) =>
  axiosClient.get('/api/notifications/me', { params: { status, page, size } })

export const markNotificationRead = (id) =>
  axiosClient.patch(`/api/notifications/${id}/read`)
```

- `status` is optional — omit it to fetch all channels/statuses; pass
  `'UNREAD'` to fetch just what drives the badge.
- Response items are `WEBSITE`-channel `NotificationLog` rows only — `EMAIL`
  rows are delivery receipts and are never returned by `/me` (contract doc,
  scenario e, step 2).

---

## 3. State — where unread state lives

Add notification state to a dedicated store (`src/store/notificationSlice.js`,
Zustand, same pattern as `authSlice.js`) rather than local component state,
since the count badge in the header and the dropdown list both need it:

- `items: []` — the current page of notifications
- `unreadCount: 0` — derived from `status === 'UNREAD'` rows, or fetched via a
  separate `status=UNREAD` call (contract doc, scenario e, step 4: "no
  separate count endpoint needed" — derive from the same response)
- `loading`, `error`

Fetch on:
- App/session init, once `authSlice.initialize()` resolves with a valid
  session (mirrors how `user` profile is fetched — see
  [authSlice.js:97-104](../../src/store/authSlice.js#L97-L104))
- Bell icon click (refresh on open)
- After a successful borrow ([BookDetail.jsx](../../src/pages/books/BookDetail.jsx),
  once the "Đăng ký mượn sách" button is wired) — the contract doc says
  loan-service triggers the `BOOK_BORROWED` notification synchronously as
  part of the borrow saga, so a short delay or poll-once-after-borrow avoids
  the student missing their own confirmation notification.

**Polling:** the contract doc says the FE "polls or subscribes"
(scenario a, "UI flow"). No websocket/SSE endpoint is defined in the backend
contract, so start with polling — e.g. every 60s while the tab is active —
rather than building a subscription mechanism the backend doesn't expose yet.

---

## 4. Header bell — UI behavior

In [Header.jsx](../../src/components/layout/Header.jsx):

1. Badge: render a small dot/count on the `Bell` icon
   ([Header.jsx:43-45](../../src/components/layout/Header.jsx#L43-L45)) when
   `unreadCount > 0`. Only show for authenticated users — guard behind
   `useAuthStore((s) => s.isAuthenticated())`, same as the "Tài khoản" button.
2. Click → open a dropdown/popover listing recent notifications
   (`items`, sorted `createAt DESC` per the contract, already sorted
   server-side).
3. Each row shows the rendered notification content. The contract's
   `NotificationResponse` isn't fully specified in the doc — confirm actual
   field names with the backend team, but expect at minimum: `id`, `status`
   (`UNREAD`/`READ`), `createdAt`, and rendered subject/body text (since
   templates are rendered server-side from `subjectTemplate`/`bodyTemplate`).
4. Clicking a row (contract doc, scenario d):
   - Call `markNotificationRead(id)`
   - Optimistically flip that row's `status` to `READ` and decrement
     `unreadCount` in the store — the endpoint is idempotent (step 4 of
     scenario d: already-read returns 200 no-op), so an optimistic update
     that later reconciles with the real response is safe.
   - Navigate/expand to whatever the notification is about, if applicable
     (e.g. `DUE_SOON` → the loan in question).

---

## 5. Error handling

- `404` on mark-as-read → notification no longer exists; remove it from local
  state silently.
- `403` on mark-as-read → attempted to read another student's notification;
  this should never happen from normal UI usage (the list only ever shows the
  current student's own rows), so treat it as a bug signal (log, don't show a
  user-facing error).
- Failed `GET /me` (backend down) → fail silently and keep the last-known
  badge count rather than clearing it to 0, so a transient backend blip
  doesn't misleadingly tell the student "nothing new."

---

## 6. Not yet in scope

- No endpoint exists for "mark all as read" — the contract only defines
  per-id `PATCH`. If needed, this is a backend contract change, not an FE-only
  addition.
- No push/websocket delivery is defined — real-time badge updates rely on
  polling until the backend adds one.
