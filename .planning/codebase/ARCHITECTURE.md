<!-- refreshed: 2026-05-19 -->
# Architecture

**Analysis Date:** 2026-05-19

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                Browser React Single Page App                 │
│                  `src/main.tsx`, `src/app/App.tsx`            │
├──────────────────┬──────────────────┬───────────────────────┤
│ Auth gate/router │  App shell/layout │     Feature pages      │
│ `src/app/router.tsx` │ `src/components/layouts` │ `src/features` │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Shared UI, constants, helpers, and typed service facades      │
│ `src/components/ui`, `src/lib`, `src/services`, `src/types`   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Auth state, API client, backend REST contracts, optional MSW  │
│ `src/stores/auth-store.ts`, `src/services/api-client.ts`,     │
│ `docs/backend/api-documentation.md`, `src/mocks`              │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| React bootstrap | Load global CSS, optionally start browser MSW, mount `<App />` into `#root`. | `src/main.tsx` |
| App providers | Own app-level React Query client and route provider. | `src/app/App.tsx` |
| Router | Define authenticated and unauthenticated route trees, route guards, and app shell nesting. | `src/app/router.tsx` |
| Auth state | Persist access/refresh tokens, expose auth status, user, and logout operations. | `src/stores/auth-store.ts` |
| API client | Configure Axios base URL, bearer-token injection, token refresh, and normalized API errors. | `src/services/api-client.ts` |
| Service facades | Provide typed domain-specific REST methods over `apiClient`. | `src/services/auth-service.ts`, `src/services/domain-services.ts`, `src/services/users-service.ts` |
| Feature pages | Compose layout and UI components for route screens. | `src/features/*/*Page.tsx` |
| Layout components | Provide cross-route page chrome, auth shell, settings shell, and top navigation. | `src/components/layouts/*.tsx` |
| UI components | Provide reusable presentational cards, tags, stats, toggles, and placeholders. | `src/components/ui/*.tsx` |
| Contract types | Mirror backend API models and request/response payloads. | `src/types/api.ts` |
| Mock backend | Serve development/test REST responses through MSW. | `src/mocks/handlers.ts`, `src/mocks/fixtures.ts`, `src/mocks/browser.ts`, `src/mocks/server.ts` |

## Pattern Overview

**Overall:** Feature-routed frontend scaffold with shared UI primitives, typed service facades, module-level app providers, and optional MSW-backed API simulation.

**Key Characteristics:**
- Route ownership is centralized in `src/app/router.tsx`; feature folders export page components consumed by the router.
- Business data contracts are centralized in `src/types/api.ts` and consumed by services, fixtures, and typed UI props.
- Backend endpoints are centralized as route constants in `src/lib/constants.ts`; do not hardcode API paths in feature pages.
- Authentication side effects are centralized in `src/stores/auth-store.ts` and `src/services/api-client.ts`.
- Presentational UI is shared through barrel exports in `src/components/ui/index.ts` and `src/components/layouts/index.ts`.
- Current route pages mostly render fixture data from `src/mocks/fixtures.ts`; service facades are prepared for backend integration.

## Layers

**Bootstrap Layer:**
- Purpose: Start development mocks when enabled, then mount React in strict mode.
- Location: `src/main.tsx`
- Contains: `enableMocks()` dynamic import and `ReactDOM.createRoot(...).render(...)`.
- Depends on: `src/lib/env.ts`, `src/mocks/browser.ts`, `src/app/App.tsx`, `src/assets/styles/globals.css`.
- Used by: Vite entry configured from `index.html`.

**Provider and Routing Layer:**
- Purpose: Provide React Query and browser routing, gate routes by auth status, and wrap protected routes in app chrome.
- Location: `src/app/App.tsx`, `src/app/router.tsx`
- Contains: `QueryClientProvider`, `RouterProvider`, `AuthenticatedRoute`, `UnauthenticatedRoute`, `AppShell`, `createBrowserRouter` config.
- Depends on: `@tanstack/react-query`, `react-router-dom`, `src/stores/auth-store.ts`, `src/lib/constants.ts`, feature pages, layouts.
- Used by: `src/main.tsx`.

**Feature Layer:**
- Purpose: Implement route-level screens by composing shared components and feature-local page logic.
- Location: `src/features/auth`, `src/features/discover`, `src/features/groups`, `src/features/calls`, `src/features/reviews`, `src/features/profile`, `src/features/settings`, `src/features/not-found`
- Contains: `LoginPage`, `RegisterPage`, `DiscoverPage`, `GroupsPage`, `GroupDetailPage`, `CallsPage`, `ReviewsPage`, `ProfilePage`, `SettingsPage`, `NotFoundPage`.
- Depends on: `src/components/ui`, `src/components/layouts`, `src/lib`, `src/services`, `src/stores/auth-store.ts`, and currently `src/mocks/fixtures.ts` for scaffold data.
- Used by: `src/app/router.tsx`.

**Presentation Layer:**
- Purpose: Reusable layout wrappers and UI primitives with Tailwind classes and typed props.
- Location: `src/components/layouts`, `src/components/ui`
- Contains: `AppLayout`, `AuthLayout`, `SettingsLayout`, `TopBar`, `Hero`, `RestaurantCard`, `CallCard`, `VoteCard`, `StatCard`, `Tag`, `Toggle`, and related cards.
- Depends on: `react-router-dom`, `src/lib/constants.ts`, `src/stores/auth-store.ts`, `src/types/api.ts`, helper formatters.
- Used by: Feature pages and tests such as `src/app/App.test.tsx`.

**State Layer:**
- Purpose: Hold client auth state and synchronize token persistence to browser storage.
- Location: `src/stores/auth-store.ts`
- Contains: Zustand store with `user`, `accessToken`, `refreshToken`, `isAuthenticated`, `setTokens`, `setUser`, `clearTokens`, `logout`.
- Depends on: Browser `localStorage` when available and `src/types/api.ts`.
- Used by: Route guards in `src/app/router.tsx`, `TopBar` in `src/components/layouts/TopBar.tsx`, auth pages, and Axios interceptors.

**API Layer:**
- Purpose: Encapsulate backend communication and enforce typed request/response boundaries.
- Location: `src/services`
- Contains: `apiClient`, `normalizeApiError`, `authService`, `groupsService`, `restaurantsService`, `sessionsService`, `votesService`, `callsService`, `geoService`, `usersService`.
- Depends on: `axios`, `src/lib/env.ts`, `src/lib/constants.ts`, `src/stores/auth-store.ts`, `src/types/api.ts`.
- Used by: Auth pages now; domain pages should use this layer when replacing fixture reads.

**Contract and Utility Layer:**
- Purpose: Share constants, API route strings, validation rules, parsers, formatters, env flags, and TypeScript contract types.
- Location: `src/lib`, `src/types`
- Contains: `ROUTES`, `API_ROUTES`, `NAV_ITEMS`, `API_ERROR_CODES`, `validatePassword`, `formatDistance`, API interfaces, UI types.
- Depends on: TypeScript only and browser `import.meta.env` for `src/lib/env.ts`.
- Used by: Router, components, services, mocks, and tests.

**Mock and Test Support Layer:**
- Purpose: Provide deterministic data and REST handlers for local development and tests.
- Location: `src/mocks`, `src/test`
- Contains: MSW browser worker, node server, handlers, fixtures, and Vitest setup.
- Depends on: `msw`, `src/lib/env.ts`, `src/types/api.ts`.
- Used by: `src/main.tsx` for browser mocks and test suites through `src/test/setup.ts`.

## Data Flow

### Primary Browser Startup Path

1. Vite loads `index.html`, which points at the application entry module (`index.html`).
2. The bootstrap imports global Tailwind/CSS tokens from `src/assets/styles/globals.css` (`src/main.tsx:3`).
3. The bootstrap reads `env.mswEnabled` and dynamically imports `src/mocks/browser.ts` when development mocks are active (`src/main.tsx:7`).
4. React mounts `<App />` under `React.StrictMode` after mock startup resolves or is skipped (`src/main.tsx:14`).
5. `<App />` provides `QueryClientProvider` and `RouterProvider` (`src/app/App.tsx:5`).
6. The router evaluates auth guards and renders either auth pages, protected app pages, or not-found (`src/app/router.tsx:25`).

### Protected Route Rendering Path

1. `AuthenticatedRoute` reads `isAuthenticated` from the Zustand store (`src/app/router.tsx:20`).
2. Unauthenticated users are redirected to `ROUTES.login`; authenticated users render nested routes via `<Outlet />` (`src/app/router.tsx:20`).
3. Protected routes render inside `AppShell`, which applies `AppLayout` and then a nested page outlet (`src/app/router.tsx:23`).
4. `AppLayout` renders `TopBar` and page content in a centered max-width container (`src/components/layouts/AppLayout.tsx:4`).
5. `TopBar` builds navigation from `NAV_ITEMS` and user menu links from `USER_MENU_ITEMS` (`src/components/layouts/TopBar.tsx:2`).

### Login Flow

1. `LoginPage` collects form values through `FormData` and calls `authService.login(...)` (`src/features/auth/LoginPage.tsx:13`).
2. `authService.login` posts to `API_ROUTES.login` through `apiClient` and unwraps `response.data` (`src/services/auth-service.ts:6`).
3. `apiClient` sends requests to `env.apiUrl` with JSON headers (`src/services/api-client.ts:9`).
4. On success, `LoginPage` stores tokens and user in `useAuthStore` (`src/features/auth/LoginPage.tsx:13`).
5. `useAuthStore.setTokens` writes `foodcall.accessToken` and `foodcall.refreshToken` to localStorage (`src/stores/auth-store.ts:17`).
6. `LoginPage` navigates to `ROUTES.discover`, and subsequent route guards read authenticated state (`src/features/auth/LoginPage.tsx:13`, `src/app/router.tsx:20`).

### Authenticated API Request and Refresh Flow

1. A service method calls `apiClient.get/post/patch` with an endpoint from `API_ROUTES` (`src/services/domain-services.ts:5`).
2. The request interceptor reads `accessToken` from `useAuthStore.getState()` and sets `Authorization: Bearer ...` (`src/services/api-client.ts:33`).
3. If the backend returns `401`, the response interceptor starts a single shared `refreshPromise` unless the request is already retried or targets refresh (`src/services/api-client.ts:10`, `src/services/api-client.ts:39`).
4. `refreshAccessToken()` posts the refresh token to `${env.apiUrl}${API_ROUTES.refresh}` using plain Axios (`src/services/api-client.ts:17`).
5. Successful refresh updates tokens and user in `useAuthStore`; failed refresh logs the user out (`src/services/api-client.ts:21`).
6. The original request is replayed with the new bearer token or rejected as a normalized error (`src/services/api-client.ts:44`).

### Mock API Flow

1. `env.mswEnabled` is true by default during development unless `VITE_MSW_ENABLED=false` (`src/lib/env.ts:3`).
2. `src/main.tsx` imports `worker` from `src/mocks/browser.ts` and starts MSW with `onUnhandledRequest: 'bypass'` (`src/main.tsx:9`).
3. `src/mocks/browser.ts` builds a browser service worker from `handlers` (`src/mocks/browser.ts`).
4. `src/mocks/handlers.ts` maps REST paths under `env.apiUrl` to JSON responses from `src/mocks/fixtures.ts` (`src/mocks/handlers.ts:5`).
5. `public/mockServiceWorker.js` provides the committed browser worker script required by MSW.

**State Management:**
- Use Zustand for authentication-only client state in `src/stores/auth-store.ts`.
- Use React component state for local form and error state in pages such as `src/features/auth/LoginPage.tsx` and `src/features/auth/RegisterPage.tsx`.
- Use React Query provider for future server-state caching in `src/app/App.tsx`; current feature pages mostly render fixtures directly instead of `useQuery` calls.

## Key Abstractions

**Routes and Navigation Constants:**
- Purpose: Single source of truth for app URLs, API URLs, top-level nav, and user-menu items.
- Examples: `ROUTES`, `API_ROUTES`, `NAV_ITEMS`, `USER_MENU_ITEMS` in `src/lib/constants.ts`.
- Pattern: Export `as const` objects/arrays from `src/lib/constants.ts` and import them through `@/lib`.

**API Contract Types:**
- Purpose: Keep frontend objects aligned with backend REST documentation.
- Examples: `User`, `Group`, `Restaurant`, `VoteSession`, `FoodCall`, `AuthResponse`, `CursorPage<T>` in `src/types/api.ts`.
- Pattern: Define transport-shaped interfaces in `src/types/api.ts`; import with `import type` in components, services, and fixtures.

**Service Objects:**
- Purpose: Provide thin endpoint-specific methods and hide Axios response unwrapping from callers.
- Examples: `authService` in `src/services/auth-service.ts`, `groupsService` and `callsService` in `src/services/domain-services.ts`, `usersService` in `src/services/users-service.ts`.
- Pattern: Export named const service objects; each method returns `response.data` when a response body is expected.

**Auth Store:**
- Purpose: Centralize token persistence and auth status for route guards, top navigation, and interceptors.
- Examples: `useAuthStore` in `src/stores/auth-store.ts`.
- Pattern: Use selector reads inside React components and `useAuthStore.getState()` inside non-React service/interceptor code.

**Layout Shells:**
- Purpose: Separate route chrome from page content.
- Examples: `AppLayout`, `AuthLayout`, `SettingsLayout`, `TopBar` in `src/components/layouts`.
- Pattern: Layouts accept `PropsWithChildren` and should remain independent of feature-specific business state unless they own global chrome.

**UI Primitives:**
- Purpose: Reusable presentational components for cards, tags, progress, hero blocks, and controls.
- Examples: `RestaurantCard`, `CallCard`, `VoteCard`, `StatCard`, `Hero`, `Toggle` in `src/components/ui`.
- Pattern: Components receive typed props, render Tailwind utility classes, and are exported from `src/components/ui/index.ts`.

**Fixture Data:**
- Purpose: Provide typed scaffold data for route screens and MSW responses.
- Examples: `userFixture`, `restaurantFixtures`, `callFixtures`, `groupFixtures` in `src/mocks/fixtures.ts`.
- Pattern: Keep fixtures typed against `src/types/api.ts` so mock data breaks at compile time when API contracts change.

## Entry Points

**Browser Application:**
- Location: `src/main.tsx`
- Triggers: Vite loads the app from `index.html` in dev/build output.
- Responsibilities: Load styles, enable browser mocks, and mount React.

**Application Shell:**
- Location: `src/app/App.tsx`
- Triggers: Rendered by `src/main.tsx`.
- Responsibilities: Provide app-level context and router.

**Route Table:**
- Location: `src/app/router.tsx`
- Triggers: Consumed by `RouterProvider` in `src/app/App.tsx`.
- Responsibilities: Redirect `/` to `/decouvrir`, gate auth routes, gate app routes, and map paths to pages.

**Mock Browser Worker:**
- Location: `src/mocks/browser.ts`
- Triggers: Dynamic import in `src/main.tsx` when `env.mswEnabled` is true.
- Responsibilities: Start browser-side MSW request handling.

**Mock Node Server:**
- Location: `src/mocks/server.ts`
- Triggers: Available for test setup or node-based tests; current `src/test/setup.ts` only imports Jest DOM matchers.
- Responsibilities: Configure node-side MSW with shared handlers.

**Test Setup:**
- Location: `src/test/setup.ts`
- Triggers: Vitest `setupFiles` in `vite.config.ts`.
- Responsibilities: Register `@testing-library/jest-dom/vitest` matchers.

## Architectural Constraints

- **Threading:** Browser UI runs on the single-threaded JavaScript event loop. No web workers are present except the MSW service worker file `public/mockServiceWorker.js` used for request interception.
- **Global state:** `queryClient` is module-scoped in `src/app/App.tsx`; `refreshPromise` is module-scoped in `src/services/api-client.ts`; auth state is module/global through Zustand in `src/stores/auth-store.ts`; MSW handler data is module-scoped in `src/mocks/fixtures.ts`.
- **Circular imports:** No circular dependency chain is detected from the observed imports. Preserve direction from app/router → features → components/services/lib/types; avoid importing features into `src/components`, `src/lib`, `src/services`, or `src/types`.
- **Path aliases:** Use `@/*` for `src/*`, configured in `tsconfig.app.json` and `vite.config.ts`.
- **Backend contract:** Frontend route constants and types must stay aligned with `docs/backend/api-documentation.md`, especially auth, users, groups, restaurants, sessions, votes, calls, cursor pagination, and JWT refresh behavior.
- **Environment:** `src/lib/env.ts` uses `VITE_API_URL` with fallback `http://localhost:3000/api`; MSW is enabled by default in dev unless `VITE_MSW_ENABLED=false`.

## Anti-Patterns

### Fetching Backend Endpoints Directly From Pages

**What happens:** A page calls `fetch` or `axios` with a hardcoded URL.
**Why it's wrong:** It bypasses auth headers, refresh handling, normalized errors, `env.apiUrl`, and `API_ROUTES` centralization in `src/services/api-client.ts` and `src/lib/constants.ts`.
**Do this instead:** Add or reuse a method in `src/services/auth-service.ts`, `src/services/domain-services.ts`, or `src/services/users-service.ts`, then call that service from the page.

### Adding Feature Logic to Shared UI Components

**What happens:** A shared card imports feature stores, feature services, or page-only fixtures.
**Why it's wrong:** `src/components/ui` is the reusable presentation layer; feature-specific dependencies make shared components hard to reuse and test.
**Do this instead:** Keep feature data loading in `src/features/<feature>/<FeaturePage>.tsx` and pass typed props into components such as `src/components/ui/RestaurantCard.tsx`.

### Duplicating Route Strings

**What happens:** Components write strings like `/connexion`, `/groupes`, or `/auth/login` inline.
**Why it's wrong:** The router, nav, tests, and service methods drift when paths change.
**Do this instead:** Import `ROUTES` or `API_ROUTES` from `src/lib/constants.ts` through `@/lib`.

### Reading Tokens Outside the Auth Store

**What happens:** Components or services use `localStorage.getItem('foodcall.accessToken')` directly.
**Why it's wrong:** Token key names, auth status, and persistence behavior are centralized in `src/stores/auth-store.ts`; direct reads create inconsistent auth behavior.
**Do this instead:** In React code, use `useAuthStore((state) => ...)`; in service/interceptor code, use `useAuthStore.getState()` as done in `src/services/api-client.ts`.

### Importing Mock Fixtures Into Production Feature Logic Long Term

**What happens:** Route pages render directly from `src/mocks/fixtures.ts`, as current scaffold pages do in `src/features/discover/DiscoverPage.tsx` and `src/features/groups/GroupsPage.tsx`.
**Why it's wrong:** It keeps UI disconnected from typed services and hides backend contract integration issues.
**Do this instead:** Use service facades from `src/services` and React Query from `src/app/App.tsx` for server data; reserve `src/mocks/fixtures.ts` for MSW responses and tests.

## Error Handling

**Strategy:** Normalize API errors at the Axios boundary and keep route-level user messages near the form or screen that can recover from the error.

**Patterns:**
- Axios errors are transformed to `{ status, message, code }` through `normalizeApiError` in `src/services/api-client.ts`.
- Auth refresh failure clears all auth state and tokens through `useAuthStore.getState().logout()` in `src/services/api-client.ts`.
- `LoginPage` catches login failures and renders a localized `role="alert"` message in `src/features/auth/LoginPage.tsx`.
- `RegisterPage` validates password locally through `validatePassword` before posting registration data in `src/features/auth/RegisterPage.tsx`.
- Bootstrap catches MSW startup failures and logs a warning without blocking app rendering in `src/main.tsx`.

## Cross-Cutting Concerns

**Logging:** Use `console.warn` only for non-fatal infrastructure startup issues, as in `src/main.tsx`. No application-wide logger exists.

**Validation:** Use helpers in `src/lib/validators.ts` for frontend validation. `RegisterPage` currently uses `validatePassword`; `validateEmail` and `validateInviteCode` are available for future forms.

**Authentication:** Use `useAuthStore` for auth state, route guards in `src/app/router.tsx` for page access, and `apiClient` interceptors in `src/services/api-client.ts` for bearer headers and refresh.

**Styling:** Use Tailwind utility classes and design tokens from `tailwind.config.ts` and CSS custom properties in `src/assets/styles/globals.css`.

**Testing:** Use Vitest with jsdom configured in `vite.config.ts`; keep UI tests under the related source directories such as `src/app/App.test.tsx`.

**Project skills:** No repository-local `.claude/skills` or `.agents/skills` directory is present, so no project-specific skill rules apply to this map.

---

*Architecture analysis: 2026-05-19*
