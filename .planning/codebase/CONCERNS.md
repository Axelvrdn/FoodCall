# Codebase Concerns

**Analysis Date:** 2026-05-19

## Tech Debt

**Scaffold pages render fixture data directly:**
- Issue: Route pages import mock fixtures instead of using service facades or TanStack Query, so UI behavior can drift away from backend contracts while still looking functional.
- Files: `src/features/discover/DiscoverPage.tsx`, `src/features/groups/GroupsPage.tsx`, `src/features/profile/ProfilePage.tsx`, `src/features/calls/CallsPage.tsx`, `src/mocks/fixtures.ts`
- Impact: API integration work must replace component data access one page at a time; pagination, loading, empty states, and errors are not exercised by current screens.
- Fix approach: Move page data access through `src/services/domain-services.ts` and React Query from `src/app/App.tsx`; keep `src/mocks/fixtures.ts` behind MSW handlers only.

**Compressed one-line components reduce maintainability:**
- Issue: Several page and layout components pack imports, state, event handlers, and JSX into very long lines.
- Files: `src/features/auth/LoginPage.tsx`, `src/features/auth/RegisterPage.tsx`, `src/features/discover/DiscoverPage.tsx`, `src/features/profile/ProfilePage.tsx`, `src/components/layouts/TopBar.tsx`, `src/components/ui/Toggle.tsx`
- Impact: Reviews and targeted diffs are noisy, accessibility changes are harder to inspect, and small UI edits risk touching unrelated markup.
- Fix approach: Expand components into multiline JSX blocks, extract repeated form field/button styling into shared components in `src/components/ui`, and keep behavior handlers above the return.

**API route constants are partial and manually interpolated:**
- Issue: `API_ROUTES` includes parameterized routes such as `/groups/:id/invites` and `/calls/:id/feedback`, while service methods manually concatenate paths for other dynamic endpoints.
- Files: `src/lib/constants.ts`, `src/services/domain-services.ts`, `src/services/users-service.ts`
- Impact: Endpoint construction can drift from backend documentation and colon placeholders can accidentally be sent literally when new services are added.
- Fix approach: Add route builder functions in `src/lib/constants.ts` or a dedicated API routes module, e.g. `groupInvites(id)` and `callFeedback(id)`, then use those builders from `src/services`.

**MSW handlers cover only happy paths:**
- Issue: Mock endpoints always return successful static responses and do not validate request payloads, auth headers, roles, pagination cursors, vote state, or error states.
- Files: `src/mocks/handlers.ts`, `src/mocks/fixtures.ts`
- Impact: Components and services can pass tests without handling 400, 401, 403, 404, 409, 422, 429, 500, or empty-list behavior defined by `src/lib/constants.ts` and backend docs.
- Fix approach: Add scenario-specific handlers in `src/mocks/handlers.ts` and service/component tests that exercise documented error responses and pagination.

## Known Bugs

**Authenticated refresh restores tokens but not the user:**
- Symptoms: On page reload with tokens in storage, `isAuthenticated` is true but `user` initializes as `null`; the top bar falls back to `Thomas` until a page explicitly loads profile data.
- Files: `src/stores/auth-store.ts`, `src/components/layouts/TopBar.tsx`, `src/app/router.tsx`, `src/services/users-service.ts`
- Trigger: Log in, reload the browser, and render any authenticated route before `usersService.me()` has populated the store.
- Workaround: None in the UI; add an auth bootstrap query that calls `usersService.me()` before authenticated layouts render, or persist a minimal user snapshot with explicit invalidation.

**Registration errors are not handled in the UI:**
- Symptoms: `RegisterPage` awaits `authService.register()` without `try/catch`; backend validation or network errors reject the submit handler without a visible error message.
- Files: `src/features/auth/RegisterPage.tsx`, `src/services/auth-service.ts`, `src/services/api-client.ts`
- Trigger: Submit the registration form when the backend returns a non-2xx response or when the API is unreachable.
- Workaround: Login has a local catch pattern in `src/features/auth/LoginPage.tsx`; mirror that pattern and display normalized API errors from `src/services/api-client.ts`.

**Settings toggles do not persist or update local state:**
- Symptoms: Settings cards render toggles with a fixed `checked={index % 2 === 0}` value and no `onChange`, so clicking does not change the visual state or save settings.
- Files: `src/features/settings/SettingsPage.tsx`, `src/components/ui/Toggle.tsx`
- Trigger: Click any toggle on `/parametres`.
- Workaround: None; introduce controlled page state or service-backed preferences before presenting these controls as editable settings.

## Security Considerations

**Tokens are persisted in `localStorage`:**
- Risk: Access and refresh tokens are readable by any script that executes in the origin, increasing blast radius for XSS.
- Files: `src/stores/auth-store.ts`, `src/services/api-client.ts`, `docs/backend/frontend-integration-guide.md`
- Current mitigation: Storage access is centralized in `src/stores/auth-store.ts`, and auth headers are injected only by `src/services/api-client.ts`.
- Recommendations: Prefer access tokens in memory and refresh tokens in secure httpOnly cookies when backend support exists; keep all component code away from direct token reads.

**Development API defaults to plain HTTP:**
- Risk: `env.apiUrl` falls back to `http://localhost:3000/api`; this is acceptable locally but unsafe if reused for deployed builds without a `VITE_API_URL` override.
- Files: `src/lib/env.ts`, `.env.development`
- Current mitigation: Environment configuration is centralized in `src/lib/env.ts`; `.env.development` exists but its contents were not read.
- Recommendations: Validate `VITE_API_URL` during production builds, fail fast when it is missing, and document HTTPS-only deployment configuration.

**Avatar upload accepts raw base64 payloads without client constraints:**
- Risk: Large or unsupported base64 payloads can create memory pressure before the backend rejects them.
- Files: `src/services/users-service.ts`, `src/types/api.ts`
- Current mitigation: `uploadAvatar` requires `{ filename, contentType, base64 }` shape but performs no size or MIME checks.
- Recommendations: Add file size/type validation before calling `usersService.uploadAvatar()` and prefer multipart upload if the backend supports it.

**Mock auth tokens are hardcoded:**
- Risk: Static `access-token` and `refresh-token` strings can be mistaken for real auth behavior in demos and tests.
- Files: `src/mocks/handlers.ts`, `src/mocks/fixtures.ts`
- Current mitigation: The tokens are confined to MSW mock responses.
- Recommendations: Keep mock tokens clearly non-secret, add tests that assert real auth failures via MSW scenarios, and never reuse mock token names in production documentation.

## Performance Bottlenecks

**Application render waits for MSW startup:**
- Problem: `src/main.tsx` waits for `enableMocks()` to resolve before mounting React.
- Files: `src/main.tsx`, `src/mocks/browser.ts`, `public/mockServiceWorker.js`
- Cause: Browser mock startup is awaited to prevent early network requests from bypassing MSW.
- Improvement path: Keep this sequencing in development, but ensure `env.mswEnabled` is always false for production builds and monitor startup delay if more worker initialization logic is added.

**No pagination or lazy data handling is exercised:**
- Problem: Services type paginated responses as `CursorPage<T>`, but mock handlers always return full fixture arrays with `nextCursor: null`, and pages render fixture arrays directly.
- Files: `src/types/api.ts`, `src/services/domain-services.ts`, `src/mocks/handlers.ts`, `src/features/discover/DiscoverPage.tsx`
- Cause: The scaffold uses small static data and does not load through React Query.
- Improvement path: Add paginated MSW responses and page-level query patterns before increasing restaurant, group, call, or vote list sizes.

**Route components are eagerly imported:**
- Problem: Every page component is imported into `src/app/router.tsx` and included in the initial bundle.
- Files: `src/app/router.tsx`, `src/app/App.tsx`
- Cause: The scaffold favors simple static routing over code splitting.
- Improvement path: Use `React.lazy` and route-level suspense for heavier future pages such as map discovery, profile activity, reviews, and group detail flows.

## Fragile Areas

**Authentication flow and request retry coupling:**
- Files: `src/services/api-client.ts`, `src/stores/auth-store.ts`, `src/app/router.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/auth/RegisterPage.tsx`
- Why fragile: Axios interceptors, Zustand storage, route guards, and page submit handlers all participate in auth state changes; a change to token shape or refresh behavior affects every layer.
- Safe modification: Update API types in `src/types/api.ts` first, then adjust `src/services/api-client.ts`, then update store behavior in `src/stores/auth-store.ts`, and finally cover route/page behavior with tests.
- Test coverage: `src/services/api-client.test.ts` covers only `normalizeApiError`; it does not cover request headers, refresh retry, logout on refresh failure, or route guard redirects.

**Backend contract mirroring is manual:**
- Files: `src/types/api.ts`, `src/lib/constants.ts`, `docs/backend/api-documentation.md`, `docs/backend/frontend-integration-guide.md`
- Why fragile: API models, endpoint strings, error codes, and frontend services are manually synchronized with backend documentation.
- Safe modification: Treat `src/types/api.ts` as the first frontend contract checkpoint and update tests in `src/types/api.test.ts` whenever backend docs change.
- Test coverage: Type tests exist in `src/types/api.test.ts`, but runtime validation is not present for API responses.

**Feature gaps are intentionally visible in routes:**
- Files: `GAPS.md`, `src/features/reviews/ReviewsPage.tsx`, `src/features/profile/ProfilePage.tsx`, `src/features/auth/ForgotPasswordPage.tsx`, `src/features/auth/OnboardingPage.tsx`, `src/features/settings/SettingsPage.tsx`
- Why fragile: Placeholder pages and static sections can be mistaken for complete functionality because they render polished UI.
- Safe modification: Keep every placeholder tied to `GAPS.md`; when adding real behavior, remove the matching gap entry and add service/test coverage in the same change.
- Test coverage: Current tests do not assert that placeholder-only features avoid unsupported API calls or show clear user-facing limitations.

## Scaling Limits

**Local-only auth state does not support multi-tab consistency:**
- Current capacity: A single tab receives immediate Zustand updates through `src/stores/auth-store.ts`.
- Limit: Multiple tabs can disagree about login/logout state because no `storage` event listener synchronizes token changes.
- Scaling path: Add a storage synchronization effect or auth bootstrap provider that listens for token changes and invalidates queries in `src/app/App.tsx`.

**MSW fixture dataset is single-tenant and tiny:**
- Current capacity: One user, one group, one restaurant, one session, one vote, one call, and one feedback entry are represented in `src/mocks/fixtures.ts`.
- Limit: Role-dependent behavior, empty states, large lists, pagination, and multi-user vote conflicts cannot be simulated from the current fixtures.
- Scaling path: Expand `src/mocks/fixtures.ts` into named scenario fixtures and add handler branches in `src/mocks/handlers.ts`.

## Dependencies at Risk

**Browser storage auth strategy:**
- Risk: The frontend depends on `localStorage` availability for initial authenticated state.
- Impact: Private browsing restrictions, disabled storage, or server-side rendering attempts can leave users logged out or partially authenticated.
- Migration plan: Keep `storage()` defensive in `src/stores/auth-store.ts`, add memory-token fallback, and move long-lived refresh state to backend-managed cookies when available.

**MSW development setup:**
- Risk: Browser mocks depend on a committed generated service worker asset.
- Impact: Removing or desynchronizing `public/mockServiceWorker.js` can silently disable local API mocking while `src/main.tsx` continues after logging a warning.
- Migration plan: Verify `public/mockServiceWorker.js` during setup/build checks and keep mock startup failures visible in development.

## Missing Critical Features

**Real password reset flow:**
- Problem: The forgot-password page states that no P1 reset endpoint exists and does not submit a recovery request.
- Blocks: Self-service account recovery cannot be completed from the frontend.
- Files: `GAPS.md`, `src/features/auth/ForgotPasswordPage.tsx`, `src/lib/constants.ts`

**Onboarding persistence and preference setup:**
- Problem: Onboarding displays planned steps but does not write city, dietary preferences, or group setup data.
- Blocks: New-user setup cannot affect restaurant discovery or group defaults.
- Files: `GAPS.md`, `src/features/auth/OnboardingPage.tsx`, `docs/backend/frontend-integration-guide.md`

**Real-time voting updates:**
- Problem: The backend guide describes vote/session workflows, but the frontend has no WebSocket, SSE, polling, or query invalidation pattern for live vote changes.
- Blocks: Group decision screens cannot stay current during active voting.
- Files: `GAPS.md`, `src/services/domain-services.ts`, `src/features/discover/DiscoverPage.tsx`, `src/components/ui/VoteCard.tsx`

## Test Coverage Gaps

**Auth store and route guards:**
- What's not tested: Token persistence, user bootstrap after reload, logout cleanup, authenticated redirects, unauthenticated redirects, and refresh failure handling.
- Files: `src/stores/auth-store.ts`, `src/app/router.tsx`, `src/services/api-client.ts`, `src/app/App.test.tsx`
- Risk: Auth regressions can ship while current tests still pass.
- Priority: High

**Service integrations with MSW:**
- What's not tested: `groupsService`, `restaurantsService`, `sessionsService`, `votesService`, `callsService`, `geoService`, and `usersService` request paths, payloads, headers, and response mapping.
- Files: `src/services/domain-services.ts`, `src/services/users-service.ts`, `src/mocks/server.ts`, `src/mocks/handlers.ts`, `src/test/setup.ts`
- Risk: Endpoint string or payload drift reaches runtime because tests only cover helper normalization.
- Priority: High

**Placeholder feature boundaries:**
- What's not tested: Reviews, favorites, notifications, onboarding, settings, and forgot-password pages remain explicit scaffold boundaries and do not imply working backend behavior.
- Files: `GAPS.md`, `src/features/reviews/ReviewsPage.tsx`, `src/features/profile/ProfilePage.tsx`, `src/features/settings/SettingsPage.tsx`, `src/features/auth/ForgotPasswordPage.tsx`
- Risk: Unsupported P2+ features appear complete to users and planners.
- Priority: Medium

---

*Concerns audit: 2026-05-19*
