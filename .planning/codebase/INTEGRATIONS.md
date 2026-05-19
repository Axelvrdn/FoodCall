# External Integrations

**Analysis Date:** 2026-05-19

## APIs & External Services

**FoodCall Backend REST API:**
- FoodCall frontend consumes a JSON REST API through `src/services/api-client.ts`, with route constants defined in `src/lib/constants.ts`.
  - SDK/Client: `axios` via `apiClient` in `src/services/api-client.ts`.
  - Auth: `Authorization: Bearer <accessToken>` header injected by the request interceptor in `src/services/api-client.ts`.
  - Base URL: `VITE_API_URL` from `src/lib/env.ts`, defaulting to `http://localhost:3000/api`.
  - Environments: local `http://localhost:3000`, staging `https://staging-api.foodcall.app`, and production `https://api.foodcall.app` are documented in `docs/backend/frontend-integration-guide.md` and `docs/backend/api-documentation.md`.

**Authentication API:**
- Frontend auth services call `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`, and `POST /auth/change-password` through `src/services/auth-service.ts` and `src/services/api-client.ts`.
  - SDK/Client: `axios` via `src/services/api-client.ts`.
  - Auth: login/register return access and refresh tokens; refresh uses the refresh token from `src/stores/auth-store.ts`.
  - Token retry: 401 responses trigger one refresh attempt in `src/services/api-client.ts` unless the failed URL includes the refresh route.

**Domain API:**
- Groups, restaurants, sessions, votes, calls, users, and geocoding are wrapped by service modules under `src/services/`.
  - Groups: `src/services/domain-services.ts` calls `GET /groups` and `GET /groups/:id`.
  - Restaurants: `src/services/domain-services.ts` calls `GET /restaurants/nearby` and `GET /restaurants/search`.
  - Sessions: `src/services/domain-services.ts` calls `GET /sessions` and `POST /sessions/:id/activate`.
  - Votes: `src/services/domain-services.ts` calls `POST /votes`.
  - Calls: `src/services/domain-services.ts` calls `GET /calls` and `POST /calls`.
  - Users: `src/services/users-service.ts` calls `GET /users/me`, `PATCH /users/me`, and `POST /users/me/avatar`.
  - Geocoding: `src/services/domain-services.ts` calls `GET /geo/geocode`.

**External Restaurant Discovery through backend:**
- The backend exposes provider-neutral external restaurant search and import endpoints documented in `docs/backend/api-documentation.md` and summarized in `docs/backend/frontend-integration-guide.md`.
  - SDK/Client: not yet wrapped in `src/services/`; route constants for external discovery are not detected in `src/lib/constants.ts`.
  - Providers: backend accepts `nominatim`, `google`, or `mapbox` provider identifiers for import, according to `docs/backend/api-documentation.md`.
  - Search: `GET /api/external-restaurants/search` returns normalized, non-persisted restaurant candidates.
  - Import: `POST /api/external-restaurants/import` persists a provider-validated result server-side and optionally adds it as a session candidate.

**Maps, Geocoding, and Routing through backend:**
- The backend uses Nominatim for geocoding and OSRM for routing, according to `docs/backend/api-documentation.md`.
  - SDK/Client: frontend currently calls only `GET /geo/geocode` through `src/services/domain-services.ts`.
  - Auth: backend endpoints require bearer auth for application API calls as documented in `docs/backend/api-documentation.md`.
  - Backend env: provider config names are documented in `docs/backend/api-documentation.md`; keep provider secrets/configuration on the backend.

**Fonts:**
- Google Fonts is loaded directly from CSS in `src/assets/styles/globals.css` for Limelight and JetBrains Mono.
  - SDK/Client: CSS `@import`.
  - Auth: none.

**Mock API Service:**
- MSW intercepts frontend API calls for development and tests through `src/mocks/browser.ts`, `src/mocks/server.ts`, and `src/mocks/handlers.ts`.
  - SDK/Client: `msw` with `setupWorker`, `setupServer`, `http`, and `HttpResponse`.
  - Auth: mock handlers return placeholder token strings in `src/mocks/handlers.ts`; do not treat these as real credentials.
  - Runtime switch: `VITE_MSW_ENABLED` in `src/lib/env.ts`; `src/main.tsx` starts the worker only when enabled.

## Data Storage

**Databases:**
- Frontend: no direct database connection is present in source files under `src/`.
  - Connection: not applicable in frontend runtime.
  - Client: not applicable in frontend runtime.
- Backend dependency: PostgreSQL with PostGIS is documented as the FoodCall backend database in `docs/backend/api-documentation.md` and `docs/backend/frontend-integration-guide.md`.
  - Connection: backend-only environment configuration; do not add database clients to frontend code.
  - Client: backend uses Drizzle ORM according to `docs/backend/api-documentation.md`.

**File Storage:**
- Frontend uploads avatar data as JSON base64 through `src/services/users-service.ts` to `POST /users/me/avatar`.
- Backend stores avatar files and returns avatar URLs according to `docs/backend/api-documentation.md`; no direct S3, cloud storage, or filesystem integration is detected in frontend code.
- Local static assets are served from `public/` and `src/assets/styles/globals.css`; `public/mockServiceWorker.js` is the MSW service worker asset.

**Caching:**
- Client-side query cache: TanStack React Query `QueryClient` is created in `src/app/App.tsx`.
- Client-side token persistence: `localStorage` is used only in `src/stores/auth-store.ts` for `foodcall.accessToken` and `foodcall.refreshToken`.
- Mock runtime cache/interception: MSW service worker asset lives at `public/mockServiceWorker.js`.
- Backend cache: Redis is documented for cache and rate limiting in `docs/backend/api-documentation.md` and `docs/backend/frontend-integration-guide.md`; frontend has no direct Redis client.

## Authentication & Identity

**Auth Provider:**
- Custom FoodCall backend auth.
  - Implementation: `src/services/auth-service.ts` calls backend auth endpoints, `src/services/api-client.ts` injects bearer tokens and refreshes on 401, and `src/stores/auth-store.ts` centralizes token/user state.
  - Token storage: `src/stores/auth-store.ts` persists access and refresh tokens in browser `localStorage` keys `foodcall.accessToken` and `foodcall.refreshToken`.
  - Backend model: `docs/backend/frontend-integration-guide.md` describes short-lived JWT access tokens and UUID refresh tokens.
  - No third-party identity SDKs such as Clerk, Auth0, Firebase Auth, Supabase Auth, or next-auth are detected in `package.json` or source imports.

## Monitoring & Observability

**Error Tracking:**
- None detected in frontend dependencies or source imports; no Sentry, PostHog, Datadog, LogRocket, or analytics SDK is listed in `package.json`.

**Logs:**
- Browser console warning is used in `src/main.tsx` when MSW fails to start.
- API errors are normalized into `{ status, message, code }` by `normalizeApiError` in `src/services/api-client.ts`.
- Backend health endpoint `GET /health` is documented in `docs/backend/api-documentation.md` and `docs/backend/frontend-integration-guide.md`; frontend does not currently call it.

## CI/CD & Deployment

**Hosting:**
- No frontend hosting platform configuration is detected in `.github/workflows/`, Vercel config, Netlify config, or package metadata.
- The deployable artifact is the Vite static build produced by `npm run build` from `package.json`.

**CI Pipeline:**
- None detected; `.github/workflows/` is absent.
- Local quality gates are `npm run build`, `npm run lint`, and `npm run test` from `package.json`.

## Environment Configuration

**Required env vars:**
- `VITE_API_URL` - optional frontend API base URL read in `src/lib/env.ts`; defaults to `http://localhost:3000/api` when omitted.
- `VITE_MSW_ENABLED` - optional frontend mock switch read in `src/lib/env.ts`; browser MSW is enabled by default in development unless this is exactly `false`.
- Backend-only variables for database, Redis, JWT, Nominatim, OSRM, and CORS are documented in `docs/backend/api-documentation.md`; keep these out of frontend code.

**Secrets location:**
- `.env.development` is present in the repo root and contains environment configuration; do not read or quote its contents.
- `.gitignore` ignores `.env.local`, but does not ignore `.env.development`; treat committed Vite env files as non-secret frontend configuration only.
- No package-manager auth files such as `.npmrc` are detected during this scan.

## Webhooks & Callbacks

**Incoming:**
- None detected in frontend code; a static SPA has no incoming webhook handlers.
- Backend notifications and moderation endpoints are documented as not implemented or future work in `docs/backend/api-documentation.md`.

**Outgoing:**
- Browser HTTP calls go through `src/services/api-client.ts` to the configured FoodCall backend API.
- No direct outgoing calls from frontend to Nominatim, OSRM, Google, Mapbox, Stripe, email providers, or webhook receivers are detected.
- External restaurant provider interaction is mediated by backend endpoints documented in `docs/backend/api-documentation.md`.

---

*Integration audit: 2026-05-19*
