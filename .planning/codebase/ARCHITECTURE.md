<!-- refreshed: Wed May 20 2026 -->
# Architecture

**Analysis Date:** Wed May 20 2026

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    React/Vite SPA Shell                      │
│       `index.html` → `src/main.tsx` → `src/app/App.tsx`       │
├──────────────────┬──────────────────┬───────────────────────┤
│  Router & Guards │  Auth Bootstrap  │    Query Provider      │
│ `src/app/router` │ `features/auth`  │ `src/app/query-client` │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Feature Screens                         │
│ `src/features/auth`, `discover`, `groups`, `sessions`,        │
│ `calls`, `reviews`, `profile`, `settings`, `not-found`        │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server-State Hooks                         │
│ `src/features/server-state.ts`, `src/features/query-keys.ts`  │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Service Layer                          │
│ `src/services/api-client.ts`, `auth-service.ts`,              │
│ `users-service.ts`, `domain-services.ts`                      │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│             FoodCall Backend / MSW Mock Backend               │
│ `docs/backend/api-documentation.md`, `src/mocks/handlers.ts`  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Browser entry | Imports global CSS, conditionally starts browser MSW, mounts React StrictMode | `src/main.tsx` |
| Application shell | Installs TanStack Query provider, auth bootstrap provider, and React Router provider | `src/app/App.tsx` |
| Router | Defines public/authenticated routes, auth guards, app layout nesting, redirects, and 404 | `src/app/router.tsx` |
| Query client | Sets global server-state defaults for stale time, retry, and focus refetch | `src/app/query-client.ts` |
| Auth store | Owns user, access token, refresh token, authentication flag, and localStorage persistence | `src/stores/auth-store.ts` |
| API client | Owns Axios base URL, bearer-token request interceptor, refresh-token retry, and normalized API errors | `src/services/api-client.ts` |
| Domain services | Groups backend endpoints by business domain and returns typed response data | `src/services/domain-services.ts` |
| Server-state hooks | Wraps services with TanStack Query queries/mutations and cache invalidation | `src/features/server-state.ts` |
| Query keys | Provides stable typed cache-key factories per backend domain | `src/features/query-keys.ts` |
| Mock backend | Mirrors backend REST endpoints for tests and local development | `src/mocks/handlers.ts` |

## Pattern Overview

**Overall:** Feature-oriented React SPA with shared service and server-state layers.

**Key Characteristics:**
- Use route-level feature folders under `src/features/<domain>/` for screens and domain adapters.
- Use a single HTTP client in `src/services/api-client.ts`; do not call `axios` directly from feature screens.
- Use TanStack Query hooks from `src/features/server-state.ts` or feature query adapters instead of manual `useEffect` data fetching.
- Use Zustand only for client-owned auth state in `src/stores/auth-store.ts`; use TanStack Query for backend-owned state.
- Use MSW handlers in `src/mocks/handlers.ts` as the local/test backend contract.

## Layers

**Entry Layer:**
- Purpose: Boot the browser app and optional mock worker.
- Location: `src/main.tsx`
- Contains: global CSS import, `env.mswEnabled` check, dynamic `@/mocks/browser` import, React root render.
- Depends on: `src/lib/env.ts`, `src/mocks/browser.ts`, `src/app/App.tsx`.
- Used by: `index.html`.

**Application Composition Layer:**
- Purpose: Compose global providers and route tree.
- Location: `src/app/`
- Contains: `src/app/App.tsx`, `src/app/router.tsx`, `src/app/query-client.ts`.
- Depends on: TanStack Query, React Router, auth bootstrap provider, layout components.
- Used by: `src/main.tsx` and tests under `src/app/App.test.tsx`.

**Feature Layer:**
- Purpose: Implement route screens, feature-specific state derivation, and UI workflows.
- Location: `src/features/`
- Contains: auth, calls, discover, groups, sessions, reviews, profile, settings, not-found screens and adapters.
- Depends on: `src/features/server-state.ts`, `src/services/`, `src/components/`, `src/lib/`, `src/stores/auth-store.ts`.
- Used by: route definitions in `src/app/router.tsx`.

**Server-State Layer:**
- Purpose: Normalize backend data access through cache-aware hooks and mutations.
- Location: `src/features/server-state.ts` and `src/features/query-keys.ts`
- Contains: grouped `useQuery`, `useInfiniteQuery`, and `useMutation` hooks for groups, restaurants, external discovery, sessions, candidates, votes, calls, feedback, reviews, recommendations, and geo.
- Depends on: services from `src/services/index.ts`, types from `src/types/api.ts`, query keys from `src/features/query-keys.ts`.
- Used by: feature pages and feature-specific query adapters such as `src/features/discover/discovery-queries.ts`, `src/features/groups/group-queries.ts`, and `src/features/sessions/session-queries.ts`.

**Service Layer:**
- Purpose: Keep HTTP transport and REST endpoint details out of components.
- Location: `src/services/`
- Contains: Axios client, auth service, user service, domain services, and barrel exports.
- Depends on: `src/lib/constants.ts`, `src/lib/env.ts`, `src/stores/auth-store.ts`, `src/app/query-client.ts`, `src/types/api.ts`.
- Used by: server-state hooks and auth bootstrap.

**Types and Utilities Layer:**
- Purpose: Centralize contracts, constants, formatters, parsers, validators, and environment values.
- Location: `src/types/` and `src/lib/`
- Contains: `src/types/api.ts`, `src/types/ui.ts`, `src/lib/constants.ts`, `src/lib/env.ts`, `src/lib/formatters.ts`, `src/lib/parsers.ts`, `src/lib/validators.ts`.
- Depends on: TypeScript only, plus selected API types.
- Used by: all app layers.

**Mock/Test Backend Layer:**
- Purpose: Provide deterministic HTTP responses matching backend contracts.
- Location: `src/mocks/` and `src/test/setup.ts`
- Contains: MSW browser worker, MSW node server, handlers, fixtures, and Vitest setup.
- Depends on: `msw`, `src/types/api.ts`, `src/lib/env.ts`.
- Used by: local dev startup in `src/main.tsx` and tests via `src/test/setup.ts`.

## Data Flow

### Primary Request Path

1. Browser loads `index.html` and module `/src/main.tsx` (`index.html:10`).
2. `src/main.tsx` optionally starts MSW from `src/mocks/browser.ts` when `env.mswEnabled` is true (`src/main.tsx:7`).
3. `src/main.tsx` renders `<App />` into `#root` (`src/main.tsx:17`).
4. `src/app/App.tsx` installs `QueryClientProvider`, `AuthBootstrapProvider`, and `RouterProvider` (`src/app/App.tsx:12`).
5. `src/app/router.tsx` routes authenticated pages through `AuthenticatedRoute` and `AppLayout` (`src/app/router.tsx:63`).
6. Feature pages call query hooks from `src/features/server-state.ts` or feature adapters such as `src/features/discover/discovery-queries.ts`.
7. Query hooks call domain services in `src/services/domain-services.ts`.
8. Domain services call `apiClient` in `src/services/api-client.ts`, which injects bearer tokens and normalizes errors.
9. Responses are cached by TanStack Query under keys from `src/features/query-keys.ts` and rendered by feature screens.

### Authentication Flow

1. Login/register pages call auth mutations or `authService` from `src/services/auth-service.ts`.
2. Tokens are written to localStorage-backed Zustand state by `useAuthStore.setTokens` in `src/stores/auth-store.ts`.
3. `AuthBootstrapProvider` fetches `/users/me` through `usersService.me` when an access token exists but no user is loaded (`src/features/auth/AuthBootstrapProvider.tsx:15`).
4. `AuthenticatedRoute` blocks authenticated branches until a token has a user or redirects unauthenticated users to `/connexion` (`src/app/router.tsx:26`).
5. `apiClient` refreshes once on 401 by POSTing `/auth/refresh` and replaying the failed request (`src/services/api-client.ts:48`).
6. Failed refresh logs out the auth store and clears the query cache (`src/services/api-client.ts:32`).

### Discovery Flow

1. `DiscoverPage` collects an address or browser geolocation (`src/features/discover/DiscoverPage.tsx:85`).
2. Address search calls `useDiscoveryGeocode`, which wraps `useGeocodeQuery` with a minimum length and two-minute stale time (`src/features/discover/discovery-queries.ts:33`).
3. Coordinates call `useDiscoveryNearby`, which wraps `/restaurants/nearby` and disables the query when coords are absent (`src/features/discover/discovery-queries.ts:43`).
4. Restaurant results render as linked `RestaurantCard` components to `/restaurants/:id` (`src/features/discover/DiscoverPage.tsx:51`).
5. External restaurant search/import is available through `externalRestaurantsService` and `useExternalRestaurantsSearchQuery` / `useImportExternalRestaurantMutation` (`src/services/domain-services.ts:71`, `src/features/server-state.ts:161`).

### Group Flow

1. Group pages use `useGroupsQuery`, `useGroupQuery`, `useGroupMembersQuery`, and group mutations re-exported by `src/features/groups/group-queries.ts`.
2. Role helpers `canManageGroup`, `canCreateInvite`, and `canDeleteGroup` centralize group UI permissions (`src/features/groups/group-queries.ts:24`).
3. Group detail loads group, members, recent sessions, editable defaults, invites, and recommendation link from `src/features/groups/GroupDetailPage.tsx`.
4. Group recommendations require default location values before rendering `RecommendationsList` (`src/features/groups/GroupRecommendations.tsx:73`).

### Session / Candidate / Vote / Call Flow

1. Group sessions are fetched by `useGroupSessionsQuery` from `src/features/server-state.ts` and adapted as `useSessionsQuery` in `src/features/sessions/session-queries.ts`.
2. Session detail loads session, group, candidates, calls, votes, and transition controls from `src/features/sessions/SessionDetailPage.tsx` and `src/features/sessions/SessionStateControls.tsx`.
3. Candidate management uses `candidatesService` and `useAddCandidateMutation` / `useRemoveCandidateMutation` in `src/features/server-state.ts` and `src/features/sessions/candidate-queries.ts`.
4. Voting uses `votesService.cast`, `votesService.list`, and `votesService.results` in `src/services/domain-services.ts` with invalidation in `src/features/server-state.ts`.
5. Calls use `callsService` and `callFeedbackService` in `src/services/domain-services.ts`, rendered by `src/components/CallsList.tsx` and `src/features/calls/CallsPage.tsx`.

### Review Flow

1. Restaurant reviews are fetched by `useRestaurantReviewsQuery` in `src/features/server-state.ts`.
2. Create/update/delete review mutations invalidate `queryKeys.restaurants.reviews(restaurantId)` in `src/features/server-state.ts`.
3. Shared review UI lives in `src/components/ReviewsList.tsx`, `src/components/ReviewForm.tsx`, and `src/components/ui/ReviewCard.tsx`.

### Recommendation Flow

1. `recommendationsService.forSession` calls `/sessions/:id/recommendations` and `recommendationsService.forGroup` calls `/groups/:id/recommendations` (`src/services/domain-services.ts:148`).
2. `useSessionRecommendationsQuery` and `useGroupRecommendationsQuery` cache recommendation pages under session/group detail namespaces (`src/features/server-state.ts:236`).
3. `SessionRecommendationsPage` blocks completed sessions and sessions without candidates before rendering recommendations (`src/features/sessions/SessionRecommendations.tsx:75`).
4. `GroupRecommendationsPage` blocks groups without default coordinates before rendering recommendations (`src/features/groups/GroupRecommendations.tsx:73`).
5. `RecommendationsList` renders rank, score, advisory copy, pagination affordance, and expandable explanation breakdown (`src/components/RecommendationsList.tsx:74`).

**State Management:**
- Backend-owned state belongs in TanStack Query (`src/app/query-client.ts`, `src/features/server-state.ts`).
- Auth/session identity belongs in Zustand (`src/stores/auth-store.ts`).
- Form and UI-only state stays local in components via `useState`, as in `src/features/discover/DiscoverPage.tsx`.
- API cache invalidation must use query factories from `src/features/query-keys.ts`.

## Key Abstractions

**API Route Registry:**
- Purpose: Central source for backend path templates and route building.
- Examples: `src/lib/constants.ts`
- Pattern: `API_ROUTES` object plus `buildApiRoute(template, params, query)` helper.

**Domain Services:**
- Purpose: Typed methods that map business actions to REST calls.
- Examples: `src/services/auth-service.ts`, `src/services/users-service.ts`, `src/services/domain-services.ts`
- Pattern: object-per-domain service with methods returning `r.data`.

**Server-State Hooks:**
- Purpose: Cache-aware query/mutation wrappers with typed errors and invalidation.
- Examples: `src/features/server-state.ts`, `src/features/groups/group-queries.ts`, `src/features/sessions/session-queries.ts`, `src/features/discover/discovery-queries.ts`
- Pattern: `useXQuery` and `useXMutation` functions using services and `queryKeys`.

**Typed API Contracts:**
- Purpose: Frontend representation of backend request and response shapes.
- Examples: `src/types/api.ts`
- Pattern: interfaces grouped by API section comments; monetary and coordinate fields follow backend JSON strings where documented.

**Mock Contract:**
- Purpose: Executable local/test API surface.
- Examples: `src/mocks/handlers.ts`, `src/mocks/fixtures.ts`
- Pattern: grouped MSW handlers per backend domain with scenario-driven error branches.

## Entry Points

**Browser App:**
- Location: `src/main.tsx`
- Triggers: `<script type="module" src="/src/main.tsx">` in `index.html`.
- Responsibilities: Load globals, enable mocks, render app.

**Router:**
- Location: `src/app/router.tsx`
- Triggers: `RouterProvider` in `src/app/App.tsx`.
- Responsibilities: Public auth routes, authenticated app routes, nested layout, redirects, and fallback page.

**Mock Worker:**
- Location: `src/mocks/browser.ts`
- Triggers: dynamic import in `src/main.tsx` when `env.mswEnabled` is true.
- Responsibilities: Intercept browser API calls with MSW handlers.

**Test Server:**
- Location: `src/test/setup.ts`
- Triggers: Vitest `setupFiles` in `vite.config.ts`.
- Responsibilities: Start/reset/stop MSW server and fail unhandled requests.

## Architectural Constraints

- **Threading:** Single-threaded browser React app; no Web Workers are used beyond the MSW service worker from `src/mocks/browser.ts`.
- **Global state:** `queryClient` singleton in `src/app/query-client.ts`, Zustand auth store in `src/stores/auth-store.ts`, Axios `apiClient` and `refreshPromise` singleton in `src/services/api-client.ts`.
- **Circular imports:** Service/auth coupling is intentional but sensitive: `src/services/api-client.ts` imports `src/app/query-client.ts` and `src/stores/auth-store.ts`; `src/app/App.tsx` exports `queryClient` for tests. Avoid adding app/component imports to services beyond the existing query-client/auth-store dependencies.
- **Backend contract ownership:** `src/types/api.ts`, `src/lib/constants.ts`, `src/services/domain-services.ts`, and `src/mocks/handlers.ts` must change together when backend endpoints or response shapes change.
- **Secret handling:** `src/lib/env.ts` only reads `VITE_*` values, which are browser-exposed; do not place secrets in frontend env variables.

## Anti-Patterns

### Direct Axios Calls From Components

**What happens:** A feature screen imports `axios` or constructs raw endpoint URLs.
**Why it's wrong:** It bypasses auth refresh, normalized errors, base URL configuration, and query cache invalidation in `src/services/api-client.ts` and `src/features/server-state.ts`.
**Do this instead:** Add or reuse a service method in `src/services/domain-services.ts`, a query key in `src/features/query-keys.ts`, and a hook in `src/features/server-state.ts`.

### Backend State In Zustand

**What happens:** A store duplicates groups, restaurants, sessions, votes, calls, reviews, or recommendations.
**Why it's wrong:** It creates cache divergence from TanStack Query and skips invalidation behavior in `src/features/server-state.ts`.
**Do this instead:** Keep backend-owned data in TanStack Query hooks from `src/features/server-state.ts`; reserve `src/stores/auth-store.ts` for auth identity and tokens.

### Hardcoded API Paths In Features

**What happens:** A component or hook writes strings like `/sessions/${id}/votes` directly.
**Why it's wrong:** Path changes would need scattered edits and MSW parity becomes fragile.
**Do this instead:** Add path templates to `API_ROUTES` and generate URLs with `buildApiRoute` in `src/lib/constants.ts`.

### Mock Handler Drift

**What happens:** Services or API types are updated without updating `src/mocks/handlers.ts` and `src/mocks/fixtures.ts`.
**Why it's wrong:** Vitest and local MSW continue validating stale contracts.
**Do this instead:** Update `src/types/api.ts`, `src/services/domain-services.ts`, `src/mocks/handlers.ts`, and relevant feature tests in the same change.

## Error Handling

**Strategy:** Normalize transport errors at the Axios boundary and render domain-specific UI messages in pages.

**Patterns:**
- `normalizeApiError` in `src/services/api-client.ts` maps Axios errors to `{ status, message, code }` using `API_ERROR_CODES` from `src/lib/constants.ts`.
- 401 errors get one refresh attempt in `src/services/api-client.ts`; failed refresh logs out and clears query cache.
- Auth logout catches network errors and always clears local state in `src/services/auth-service.ts`.
- Pages render `role="alert"` blocks for error states, for example `src/features/discover/DiscoverPage.tsx`, `src/features/groups/GroupDetailPage.tsx`, and `src/components/RecommendationsList.tsx`.

## Cross-Cutting Concerns

**Logging:** Browser console warning only for MSW startup failure in `src/main.tsx`; no centralized app logger is present.
**Validation:** Frontend uses TypeScript types in `src/types/api.ts`, form-level checks in components, and backend validation errors returned through normalized API errors; generic validators live in `src/lib/validators.ts`.
**Authentication:** Custom token auth with Zustand persistence in `src/stores/auth-store.ts`, Axios bearer injection and refresh in `src/services/api-client.ts`, bootstrap in `src/features/auth/AuthBootstrapProvider.tsx`, and route guards in `src/app/router.tsx`.
**Styling:** Tailwind utility classes use design tokens from `tailwind.config.ts`; shared UI components live in `src/components/ui/` and layout components in `src/components/layouts/`.
**Internationalization:** UI copy is primarily French in route pages and components; no i18n library is present in `package.json`.

---

*Architecture analysis: Wed May 20 2026*
