# External Integrations

**Analysis Date:** Wed May 20 2026

## APIs & External Services

**FoodCall Backend REST API:**
- FoodCall API - Auth, users, groups, discovery, sessions, candidates, votes, calls, feedback, reviews, recommendations, and geo services are consumed through `src/services/api-client.ts`, `src/services/auth-service.ts`, `src/services/users-service.ts`, and `src/services/domain-services.ts`.
  - SDK/Client: `axios` via `apiClient` in `src/services/api-client.ts`.
  - Auth: `Authorization: Bearer <accessToken>` added by the request interceptor in `src/services/api-client.ts`.
  - Base URL: `VITE_API_URL` from `src/lib/env.ts`, defaulting to `http://localhost:3000/api`.
  - API route registry: `API_ROUTES` in `src/lib/constants.ts`.
  - Backend contract reference: `docs/backend/api-documentation.md` and `docs/backend/frontend-integration-guide.md`.

**Authentication API:**
- Auth endpoints - Login, register, refresh, logout, change password, and current-user bootstrap are implemented by `src/services/auth-service.ts`, `src/services/users-service.ts`, `src/features/auth/auth-queries.ts`, and `src/features/auth/AuthBootstrapProvider.tsx`.
  - SDK/Client: `axios` through `apiClient`; refresh uses raw `axios.post` in `src/services/api-client.ts` to avoid recursive interceptor handling.
  - Auth: access and refresh tokens are stored by `src/stores/auth-store.ts` under `foodcall.accessToken` and `foodcall.refreshToken`.

**Restaurant discovery / geo API:**
- Internal restaurants, external provider search/import, geocoding, and route calculations are consumed by `restaurantsService`, `externalRestaurantsService`, and `geoService` in `src/services/domain-services.ts`.
  - SDK/Client: `axios` via `apiClient`.
  - Auth: bearer token from `src/stores/auth-store.ts`; provider failures and rate limits are represented in MSW scenarios in `src/mocks/handlers.ts`.
  - Browser API: geolocation uses `navigator.geolocation.getCurrentPosition` in `src/features/discover/DiscoverPage.tsx`.

**Recommendations API:**
- Session and group recommendations are consumed by `recommendationsService` in `src/services/domain-services.ts`, cached by `useSessionRecommendationsQuery` and `useGroupRecommendationsQuery` in `src/features/server-state.ts`, and rendered by `src/features/sessions/SessionRecommendations.tsx`, `src/features/groups/GroupRecommendations.tsx`, and `src/components/RecommendationsList.tsx`.
  - SDK/Client: `axios` via `apiClient`.
  - Auth: bearer token from `src/services/api-client.ts` request interceptor.

## Data Storage

**Databases:**
- Frontend: no direct database client is present.
  - Connection: Not applicable in frontend source.
  - Client: Not detected.
- Backend contract: `docs/backend/api-documentation.md` describes PostgreSQL with PostGIS and Redis behind the FoodCall backend; the SPA accesses them only through HTTP APIs.

**File Storage:**
- No direct file storage SDK is present.
- Avatar upload sends `{ filename, contentType, base64 }` to `/users/me/avatar` through `usersService.uploadAvatar` in `src/services/users-service.ts`.

**Caching:**
- TanStack Query in-memory cache is configured by `src/app/query-client.ts` with `staleTime: 60000`, `retry: 1`, and `refetchOnWindowFocus: false`.
- Query-key namespaces live in `src/features/query-keys.ts`; mutation invalidation lives in `src/features/server-state.ts`.
- Auth tokens persist in `localStorage` through `src/stores/auth-store.ts`; query cache is cleared on logout and failed token refresh in `src/services/auth-service.ts` and `src/services/api-client.ts`.

## Authentication & Identity

**Auth Provider:**
- Custom FoodCall backend token auth.
  - Implementation: `src/services/auth-service.ts` calls `/auth/login`, `/auth/register`, `/auth/logout`, and `/auth/change-password`.
  - Token refresh: `src/services/api-client.ts` retries one 401 by POSTing refresh token to `/auth/refresh`, updates `src/stores/auth-store.ts`, and replays the original request.
  - Bootstrap: `src/features/auth/AuthBootstrapProvider.tsx` fetches `/users/me` when an access token exists but no user is loaded.
  - Route protection: `AuthenticatedRoute` and `UnauthenticatedRoute` in `src/app/router.tsx` redirect based on `useAuthStore` state.

## Monitoring & Observability

**Error Tracking:**
- None detected; no Sentry, Datadog, LogRocket, OpenTelemetry, or similar SDK is present in `package.json` or `src/` imports.

**Logs:**
- Browser console warning only for MSW startup failure in `src/main.tsx`.
- API errors are normalized to `{ status, message, code }` by `normalizeApiError` in `src/services/api-client.ts` and handled in page-level UI such as `src/features/discover/DiscoverPage.tsx` and recommendation pages.

## CI/CD & Deployment

**Hosting:**
- Static Vite output from `npm run build`; no deployment target config is detected in the repository.
- Backend environment examples in `docs/backend/frontend-integration-guide.md` list local, staging, and production API URLs.

**CI Pipeline:**
- Not detected; no GitHub Actions, GitLab CI, CircleCI, or deployment workflow files are present in the scanned paths.

## Environment Configuration

**Required env vars:**
- `VITE_API_URL` - optional at code level but required for non-local production deployments; read in `src/lib/env.ts`.
- `VITE_MSW_ENABLED` - optional development toggle; set to `false` to disable browser MSW in `src/lib/env.ts`.

**Secrets location:**
- `.env.development` exists and contains local environment configuration; contents are not read or quoted.
- No frontend secret should be placed in `VITE_*` variables because Vite exposes them to browser code.

## Webhooks & Callbacks

**Incoming:**
- None in the frontend SPA; browser routes are defined in `src/app/router.tsx` and do not receive webhook callbacks.

**Outgoing:**
- HTTP requests to FoodCall backend REST endpoints only, through services in `src/services/`.
- Browser geolocation permission callback is used locally in `src/features/discover/DiscoverPage.tsx`; it is not an external webhook.

## Mocked Integration Surface

**MSW Browser:**
- `src/main.tsx` dynamically imports `src/mocks/browser.ts` when `env.mswEnabled` is true.
- `src/mocks/browser.ts` starts `setupWorker(...handlers)`.

**MSW Test Server:**
- `src/test/setup.ts` starts `src/mocks/server.ts` with `onUnhandledRequest: 'error'`, resets handlers after each test, and closes after all tests.

**Mock Handlers:**
- `src/mocks/handlers.ts` covers `/auth/*`, `/users/me`, `/groups`, `/restaurants`, `/external-restaurants`, `/sessions`, `/votes`, `/calls`, `/feedback`, `/recommendations`, `/geo/geocode`, and `/geo/route`.
- Scenario query parameters (`scenario=empty`, `validation`, `auth`, `permission`, `conflict`, `rate-limit`, `provider-failure`, `not-found`) are supported by `src/mocks/handlers.ts` for error-state testing.

---

*Integration audit: Wed May 20 2026*
