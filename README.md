# Booking App — Frontend

React SPA for a multi-tenant appointment-booking platform. One deployment
serves every tenant business: each gets its own public booking page at
`/<slug>` and shares a single admin panel at `/admin` whose business identity
is derived from the logged-in admin's JWT, not from the URL.

React 19 · React Router 7 · Vite · plain Context API (no Redux/Zustand)

---

## Table of contents

- [Project structure](#project-structure)
- [Routing](#routing)
- [State management](#state-management)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Notable design decisions](#notable-design-decisions)
- [Known limitations](#known-limitations)
- [Deployment](#deployment)

---

## Project structure

```text
booking-app-frontend/
├── src/
│   ├── App.jsx                   # root: routing table, auth state, sliding
│   │                              # session refresh (shared by every route)
│   ├── ClientApp.jsx              # client-facing area, mounted per /:slug
│   ├── AdminApp.jsx               # admin shell: gates on role === "ADMIN"
│   ├── LandingPage.jsx            # marketing page at /
│   ├── RegisterBusiness.jsx       # new-tenant onboarding flow
│   │
│   ├── context/
│   │   ├── TenantContext.jsx      # resolves :slug → business record,
│   │   │                          # exposes businessId to the whole subtree
│   │   └── ToastContext.jsx       # app-wide toast notifications
│   │
│   ├── components/                # client-facing booking flow + shared UI
│   │   ├── LoginSMS/               # phone OTP login (3-step form)
│   │   ├── Home/                   # client landing: profile, reviews, upcoming appt
│   │   ├── SelectService/
│   │   ├── SelectBarber/           # staff picker (internally "barber", UI says "team member")
│   │   ├── SelectDateTime/
│   │   ├── ConfirmScreen/          # shared confirm step for booking + swap
│   │   ├── Swaps/                  # peer-to-peer appointment swap marketplace
│   │   ├── Messages/                # swap updates + broadcast announcements
│   │   ├── MyAppointments/
│   │   ├── Profile/
│   │   └── ConfirmDialog/          # reusable confirm modal (not yet used everywhere — see below)
│   │
│   ├── admin/
│   │   ├── AdminDashboard.jsx     # tab shell, loads shared services/providers once
│   │   └── tabs/
│   │       ├── CalendarTab/        # daily calendar, walk-ins, blocking
│   │       ├── WeeklyPublishTab/   # weekly booking-window publishing
│   │       ├── ServicesStaffTab/   # services + team CRUD
│   │       ├── BroadcastSwapTab/   # announcements + live swap market view
│   │       ├── ReportsTab/         # KPIs
│   │       └── ProfileTab/         # business profile, public link
│   │
│   ├── services/api.js            # every backend call lives here, nowhere else
│   └── utils/dateUtils.js         # date/time formatting helpers
└── package.json
```

---

## Routing

Defined in `App.jsx`:

| Path | Component | Notes |
|---|---|---|
| `/` | `LandingPage` | Public marketing page |
| `/register` | `RegisterBusiness` | Requires login; turns a `CLIENT` into an `ADMIN` of a new business |
| `/admin/*` | `AdminApp` | No slug — business identity comes from the JWT |
| `/:slug/*` | `ClientApp` (wrapped in `TenantProvider`) | Everything client-facing for one business |

`ClientApp` itself isn't further split by React Router — it manages its own
internal "screen" via local state (`currentTab`, `bookingStep`) rather than
nested routes. Worth knowing if you're debugging navigation: switching
businesses (`/:slug` → `/:slug2`) does **not** unmount `ClientApp` — React
Router reuses the same component instance and only updates the route params,
which is exactly what caused the stale-closure bug described below.

---

## State management

No global store. Three layers, deliberately:

1. **`App.jsx`** owns `user` (persisted to `localStorage`) and the sliding
   session refresh — the only state that's truly global.
2. **`TenantContext`** (scoped to the `/:slug/*` subtree) resolves the slug
   to a business record and exposes `businessId` to every client component
   via `useTenant()`.
3. **Local component state** for everything else — appointments, swap
   requests, form state. Data flows down via props from `ClientApp` /
   `AdminDashboard`, which own the fetches.

---

## Getting started

```bash
npm install
npm run dev      # starts Vite on http://localhost:5173
```

Requires the backend running locally (see `booking-app-backend/README.md`)
or a reachable deployed instance via `VITE_API_BASE_URL`.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | no | Backend origin. Falls back to `http://localhost:5000` if unset. **Vite bakes this in at build time** — changing it in Vercel requires a redeploy, not just a dashboard edit |

---

## Notable design decisions

- **Sliding-session token refresh**, implemented here in `App.jsx`: fires on
  mount and on every `focus`/`visibilitychange` event, silently calling
  `/auth/refresh` and swapping the stored token. See the backend README for
  the server side of this.

- **Two fixed bugs worth knowing about if you touch `ClientApp.jsx` or
  `Swaps.jsx`** — both are classic React timing pitfalls, not one-off typos:

  1. *Stale closure in a focus listener.* A `useEffect` that attached a
     `window.addEventListener("focus", ...)` handler depended only on
     `[user]`, not `[user, businessId]`. The listener's closure kept
     referencing whichever `businessId` was active when it was first
     attached — so navigating between two businesses inside the SPA (no full
     reload) appeared to work, until the window regained focus and silently
     re-fetched the *original* business's data over the correct one. Fixed
     by adding `businessId` to the dependency array so the listener is torn
     down and re-attached with a fresh closure on every business switch.

  2. *Race condition on rapid navigation.* Two in-flight requests (old
     business, new business) could resolve out of order, letting a stale
     response overwrite a newer one. Fixed with a `useRef`-based
     request-id guard in both `ClientApp.loadAppointments` and
     `Swaps.loadMarketSwaps`: each call increments a ref, and a response is
     only applied if its id still matches `ref.current` on arrival. Refs
     were used specifically because they're read at call time, not closure
     time — immune to the same staleness trap as #1.

- **Polling, not WebSockets, for swap-request updates.** `Swaps.jsx` polls
  every 12s *only* while the signed-in user has a pending outgoing swap
  request — so the requester sees the other side's decision without manually
  refreshing, without needing persistent-connection infrastructure for what
  is, at current scale, an infrequent event.

- **Internal naming vs. UI copy diverge on purpose in one spot.**
  `SelectBarber.jsx`, `selectedBarber`, `onSelectBarber` etc. still say
  "barber" internally (this started as a single-vertical barbershop app) —
  but all user-facing copy now says "team member" (`איש צוות`) since the
  platform markets itself as vertical-agnostic (salons, clinics, studios).
  A full rename is a mechanical but wide-reaching refactor (component file
  name, props threaded through `ClientApp`/`SelectDateTime`/`ConfirmScreen`,
  CSS class names) that hasn't been prioritized over functional work yet.

---

## Known limitations

- **No automated tests** (no Vitest/RTL/Playwright yet) — the two bugs above
  were both found and fixed through manual testing. Highest-priority planned
  investment; see the backend README for the shared testing-strategy notes.
- **Three separate confirm-dialog implementations** exist
  (`ConfirmDialog.jsx` + two inline ad-hoc modals in `ClientApp.jsx` and
  `CalendarTab.jsx`) that should eventually consolidate to one.
- **No image upload.** Business logo and staff photos are plain URL text
  fields — an owner needs to host images elsewhere themselves.

---

## Deployment

Deployed on [Vercel](https://vercel.com), auto-deploys on push to `main`.
`vercel.json` rewrites all paths to `/index.html` so client-side routes
(e.g. `/tal-barber/book`) don't 404 on a hard refresh.
