# Codebase Structure

**Analysis Date:** 2026-05-19

## Directory Layout

```text
FoodCall/
├── .planning/                  # GSD planning and codebase reference documents
├── docs/backend/               # Backend API reference consumed by frontend contracts
├── public/                     # Static assets served by Vite; includes MSW worker
├── src/                        # React frontend source
│   ├── app/                    # App providers, router, route guards, app-level tests
│   ├── assets/styles/          # Global CSS, Tailwind imports, CSS variables
│   ├── components/layouts/     # Route shell and layout components
│   ├── components/ui/          # Reusable presentational UI primitives
│   ├── features/               # Route-level feature pages grouped by product area
│   ├── lib/                    # Constants, env access, validators, parsers, formatters
│   ├── mocks/                  # MSW handlers and typed fixture data
│   ├── services/               # Axios client and typed API service facades
│   ├── stores/                 # Zustand client stores
│   ├── test/                   # Shared Vitest setup
│   ├── types/                  # Shared API and UI TypeScript types
│   ├── main.tsx                # Browser bootstrap entry
│   └── vite-env.d.ts           # Vite type declarations
├── index.html                  # Vite HTML entry
├── package.json                # npm scripts and dependency manifest
├── package-lock.json           # npm lockfile
├── vite.config.ts              # Vite, React plugin, alias, Vitest config
├── tailwind.config.ts          # Tailwind design tokens and content globs
├── tsconfig.json               # TypeScript project references
├── tsconfig.app.json           # Frontend TypeScript compiler options and alias
├── tsconfig.node.json          # Node/config TypeScript compiler options
├── eslint.config.js            # ESLint flat config
├── postcss.config.js           # PostCSS/Tailwind pipeline config
└── .prettierrc.json            # Prettier formatting config
```

## Directory Purposes

**`src/app`:**
- Purpose: Own application-level composition and routing.
- Contains: `App.tsx`, `router.tsx`, `App.test.tsx`.
- Key files: `src/app/App.tsx` provides React Query and React Router; `src/app/router.tsx` declares all routes and route guards.

**`src/assets/styles`:**
- Purpose: Define global style baseline, Tailwind layer imports, CSS variables, and element defaults.
- Contains: `globals.css`.
- Key files: `src/assets/styles/globals.css` imports fonts, Tailwind layers, color variables, base body styles, link styles, and form font inheritance.

**`src/components/layouts`:**
- Purpose: Provide app-wide structural wrappers and navigation chrome.
- Contains: `AppLayout.tsx`, `AuthLayout.tsx`, `SettingsLayout.tsx`, `TopBar.tsx`, `index.ts`.
- Key files: `src/components/layouts/TopBar.tsx` uses `NAV_ITEMS`, `USER_MENU_ITEMS`, and auth user state; `src/components/layouts/AppLayout.tsx` wraps protected pages.

**`src/components/ui`:**
- Purpose: Provide reusable presentational primitives for feature pages.
- Contains: `BadgeCard.tsx`, `CallCard.tsx`, `Hero.tsx`, `MapPlaceholder.tsx`, `MemberRow.tsx`, `Pill.tsx`, `ProgressBar.tsx`, `RestaurantCard.tsx`, `ReviewCard.tsx`, `ScoreRing.tsx`, `SearchRow.tsx`, `StatCard.tsx`, `Tag.tsx`, `Toggle.tsx`, `VoteCard.tsx`, `index.ts`.
- Key files: `src/components/ui/index.ts` is the barrel export for UI primitives; `src/components/ui/RestaurantCard.tsx` demonstrates typed props from `src/types/api.ts` and helper usage from `src/lib/formatters.ts`.

**`src/features`:**
- Purpose: Host route-level screens grouped by product area.
- Contains: `auth`, `calls`, `discover`, `groups`, `not-found`, `profile`, `reviews`, `settings`.
- Key files: `src/features/auth/LoginPage.tsx` and `src/features/auth/RegisterPage.tsx` are service-backed auth forms; `src/features/discover/DiscoverPage.tsx` and `src/features/groups/GroupsPage.tsx` are scaffolded dashboard-style pages using fixtures.

**`src/features/auth`:**
- Purpose: Host unauthenticated and onboarding-related pages.
- Contains: `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `OnboardingPage.tsx`.
- Key files: `src/features/auth/LoginPage.tsx` calls `authService.login`; `src/features/auth/RegisterPage.tsx` validates password and calls `authService.register`.

**`src/features/groups`:**
- Purpose: Host group list/detail screens.
- Contains: `GroupsPage.tsx`, `GroupDetailPage.tsx`.
- Key files: `src/features/groups/GroupsPage.tsx` composes `Hero`, `StatCard`, `VoteCard`, `CallCard`, and `MemberRow`; `src/features/groups/GroupDetailPage.tsx` reads route params with `useParams`.

**`src/lib`:**
- Purpose: Share framework-neutral constants and helper functions.
- Contains: `constants.ts`, `env.ts`, `formatters.ts`, `index.ts`, `parsers.ts`, `validators.ts`, plus tests for constants/formatters.
- Key files: `src/lib/constants.ts` defines app routes, API routes, nav arrays, status enums, and API error messages; `src/lib/env.ts` reads Vite environment flags.

**`src/mocks`:**
- Purpose: Provide Mock Service Worker integration and typed demo data.
- Contains: `browser.ts`, `server.ts`, `handlers.ts`, `fixtures.ts`.
- Key files: `src/mocks/handlers.ts` maps `env.apiUrl` REST paths to `HttpResponse` values; `src/mocks/fixtures.ts` exports typed `User`, `Group`, `Restaurant`, `VoteSession`, `Vote`, and `FoodCall` data.

**`src/services`:**
- Purpose: Encapsulate HTTP transport and backend REST API methods.
- Contains: `api-client.ts`, `auth-service.ts`, `domain-services.ts`, `users-service.ts`, `index.ts`, `api-client.test.ts`.
- Key files: `src/services/api-client.ts` creates Axios client and interceptors; `src/services/domain-services.ts` groups domain service methods; `src/services/index.ts` is the service barrel export.

**`src/stores`:**
- Purpose: Host global client state stores.
- Contains: `auth-store.ts`.
- Key files: `src/stores/auth-store.ts` is the only detected Zustand store and owns tokens/user/auth status.

**`src/test`:**
- Purpose: Host shared test setup.
- Contains: `setup.ts`.
- Key files: `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` and is referenced by `vite.config.ts`.

**`src/types`:**
- Purpose: Host shared TypeScript types for backend contracts and UI data shapes.
- Contains: `api.ts`, `ui.ts`, `index.ts`, `api.test.ts`.
- Key files: `src/types/api.ts` mirrors `docs/backend/api-documentation.md` models and payloads.

**`docs/backend`:**
- Purpose: Store backend API documentation used as the source of contract context.
- Contains: `api-documentation.md`, `FoodCall Prototype.md`.
- Key files: `docs/backend/api-documentation.md` describes REST resources, auth, pagination, response formats, and backend environment assumptions.

**`public`:**
- Purpose: Store static files copied by Vite.
- Contains: `mockServiceWorker.js`.
- Key files: `public/mockServiceWorker.js` is required for browser MSW support started from `src/main.tsx`.

**Repository-local skills:**
- Purpose: Project-specific agent rules if present.
- Contains: Not detected.
- Key files: `.claude/skills` and `.agents/skills` are not present in this repository.

## Key File Locations

**Entry Points:**
- `index.html`: Vite HTML shell and root element location.
- `src/main.tsx`: Browser bootstrap, MSW startup, React root render.
- `src/app/App.tsx`: Application providers and router provider.
- `src/app/router.tsx`: Browser route table, auth redirects, protected app shell.

**Configuration:**
- `package.json`: npm scripts, runtime dependencies, development dependencies.
- `package-lock.json`: npm dependency lockfile.
- `vite.config.ts`: React plugin, `@` alias, Vitest `jsdom`, and setup file.
- `tsconfig.json`: TypeScript project references.
- `tsconfig.app.json`: strict frontend compiler options and `@/*` path mapping to `src/*`.
- `tsconfig.node.json`: Node/config TypeScript options.
- `tailwind.config.ts`: Tailwind content globs, colors, typography, radii, shadows, gradients, breakpoints.
- `postcss.config.js`: CSS processing config.
- `eslint.config.js`: linting config.
- `.prettierrc.json`: formatting config.
- `.env.development`: environment configuration file present; do not read or quote contents.

**Core Logic:**
- `src/stores/auth-store.ts`: Auth store, token persistence, logout behavior.
- `src/services/api-client.ts`: Axios instance, auth header injection, refresh-token retry flow, error normalization.
- `src/services/auth-service.ts`: Auth endpoint facade.
- `src/services/domain-services.ts`: Groups, restaurants, sessions, votes, calls, and geo endpoint facades.
- `src/services/users-service.ts`: Current-user endpoint facade.
- `src/lib/constants.ts`: App and API route constants, navigation constants, enum arrays, API error messages.
- `src/types/api.ts`: Backend model and payload types.
- `src/lib/validators.ts`: Email, password, invite-code validation helpers.
- `src/lib/formatters.ts`: Distance, budget, date, relative date, and score formatting helpers.

**Feature Pages:**
- `src/features/auth/LoginPage.tsx`: Login form and auth store update flow.
- `src/features/auth/RegisterPage.tsx`: Registration form, password validation, onboarding redirect.
- `src/features/auth/ForgotPasswordPage.tsx`: Password recovery page.
- `src/features/auth/OnboardingPage.tsx`: Onboarding page under protected routes.
- `src/features/discover/DiscoverPage.tsx`: Discover route using restaurant fixtures and cards.
- `src/features/groups/GroupsPage.tsx`: Group dashboard route using group/call fixtures.
- `src/features/groups/GroupDetailPage.tsx`: Group detail route using route params.
- `src/features/reviews/ReviewsPage.tsx`: Reviews route.
- `src/features/calls/CallsPage.tsx`: User calls route.
- `src/features/profile/ProfilePage.tsx`: Profile route.
- `src/features/settings/SettingsPage.tsx`: Settings route inside `SettingsLayout`.
- `src/features/not-found/NotFoundPage.tsx`: Catch-all route page.

**Shared Components:**
- `src/components/layouts/AppLayout.tsx`: Protected page shell with `TopBar` and content container.
- `src/components/layouts/AuthLayout.tsx`: Centered auth card shell.
- `src/components/layouts/SettingsLayout.tsx`: Settings sidebar and content shell.
- `src/components/layouts/TopBar.tsx`: Product navigation, notification button, user menu.
- `src/components/ui/index.ts`: UI component barrel export.
- `src/components/layouts/index.ts`: Layout component barrel export.

**Mocking:**
- `src/mocks/browser.ts`: Browser-side MSW worker.
- `src/mocks/server.ts`: Node-side MSW server.
- `src/mocks/handlers.ts`: Mock API handlers.
- `src/mocks/fixtures.ts`: Typed mock API data.
- `public/mockServiceWorker.js`: Browser service worker script.

**Testing:**
- `src/test/setup.ts`: Shared test setup registered in `vite.config.ts`.
- `src/app/App.test.tsx`: Navigation/top-bar rendering tests.
- `src/services/api-client.test.ts`: API error normalization tests.
- `src/lib/constants.test.ts`: Constants tests.
- `src/lib/formatters.test.ts`: Formatter tests.
- `src/types/api.test.ts`: API type/contract tests.

**Documentation:**
- `docs/backend/api-documentation.md`: Backend API contract reference.
- `demo-data-reference.md`: Demo data reference.
- `DA-TAILWIND-MAPPING.md`: Tailwind/design mapping reference.
- `.planning/codebase/ARCHITECTURE.md`: Current architecture reference.
- `.planning/codebase/STRUCTURE.md`: Current structure reference.

## Naming Conventions

**Files:**
- Route/page components use PascalCase with `Page` suffix: `src/features/auth/LoginPage.tsx`, `src/features/groups/GroupDetailPage.tsx`.
- Reusable components use PascalCase: `src/components/ui/RestaurantCard.tsx`, `src/components/layouts/TopBar.tsx`.
- Service files use kebab-case with `-service` or client suffixes: `src/services/auth-service.ts`, `src/services/domain-services.ts`, `src/services/api-client.ts`.
- Store files use kebab-case with `-store`: `src/stores/auth-store.ts`.
- Utility files use plural or domain nouns in kebab/lowercase: `src/lib/constants.ts`, `src/lib/formatters.ts`, `src/lib/validators.ts`, `src/lib/parsers.ts`.
- Test files are colocated beside related source and use `.test.ts` or `.test.tsx`: `src/services/api-client.test.ts`, `src/app/App.test.tsx`.
- Barrel files are named `index.ts`: `src/lib/index.ts`, `src/services/index.ts`, `src/components/ui/index.ts`.

**Directories:**
- Feature directories use product-domain names, often kebab-case for multiword concepts: `src/features/not-found`.
- Component subdirectories are grouped by role: `src/components/layouts`, `src/components/ui`.
- Source top-level directories are lower-case plural nouns by architectural layer: `src/features`, `src/services`, `src/stores`, `src/types`, `src/mocks`.

**Imports:**
- Use `@/` for cross-layer imports from `src`, as configured in `tsconfig.app.json` and `vite.config.ts`.
- Use relative imports for sibling files inside the same directory, as in `src/components/ui/RestaurantCard.tsx` importing `./Tag`.
- Use barrel imports for shared component and service groups when available, as in feature pages importing from `@/components/ui` and auth pages importing from `@/services`.

## Where to Add New Code

**New Route Page:**
- Primary code: create `src/features/<feature>/<FeatureName>Page.tsx`.
- Router registration: add a route in `src/app/router.tsx` using a path from `ROUTES` in `src/lib/constants.ts`.
- Navigation: add to `NAV_ITEMS` or `USER_MENU_ITEMS` in `src/lib/constants.ts` only if it belongs in global navigation.
- Tests: colocate a page or routing test near the owning area, e.g. `src/features/<feature>/<FeatureName>Page.test.tsx` or extend `src/app/App.test.tsx`.

**New Protected Feature:**
- Primary code: `src/features/<feature>/<FeaturePage>.tsx`.
- Shared UI: put reusable cards/controls in `src/components/ui/<ComponentName>.tsx` and export them from `src/components/ui/index.ts`.
- API calls: add service methods to `src/services/domain-services.ts` or create a focused `src/services/<domain>-service.ts`, then export from `src/services/index.ts`.
- Types: add or update transport contracts in `src/types/api.ts` and export shared type groups from `src/types/index.ts` when needed.
- Mock data: add typed fixtures in `src/mocks/fixtures.ts` and route handlers in `src/mocks/handlers.ts`.

**New Auth or Account Capability:**
- Primary code: `src/features/auth` for unauthenticated auth flows or `src/features/profile` / `src/features/settings` for authenticated account UI.
- Auth state: extend `src/stores/auth-store.ts` only when global auth/user state changes.
- API calls: extend `src/services/auth-service.ts` for auth endpoints or `src/services/users-service.ts` for current-user endpoints.
- Validation: add reusable validation helpers to `src/lib/validators.ts`.

**New Component/Module:**
- Shared presentational component: `src/components/ui/<ComponentName>.tsx`, exported by `src/components/ui/index.ts`.
- Shared layout/shell component: `src/components/layouts/<ComponentName>.tsx`, exported by `src/components/layouts/index.ts`.
- Feature-only component: keep it under the owning `src/features/<feature>` folder rather than `src/components/ui`.

**Utilities:**
- Constants and route maps: `src/lib/constants.ts`.
- Environment access: `src/lib/env.ts`.
- Formatting helpers: `src/lib/formatters.ts` with tests in `src/lib/formatters.test.ts`.
- Parsing helpers: `src/lib/parsers.ts`.
- Validation helpers: `src/lib/validators.ts`.
- Shared exports: update `src/lib/index.ts`.

**Server-State Integration:**
- Query provider already exists in `src/app/App.tsx`.
- Add fetcher methods in `src/services` first, then consume them from feature pages with React Query hooks or local async flows.
- Keep response types in `src/types/api.ts` and page-specific display transformations in the feature page or a feature-local helper.

**Mock API Support:**
- Add or update data in `src/mocks/fixtures.ts` using types from `src/types/api.ts`.
- Add matching REST handlers in `src/mocks/handlers.ts` using `http.get`, `http.post`, `http.patch`, or related MSW helpers.
- Use `API_ROUTES` from `src/lib/constants.ts` where practical; current handlers use literal paths under `api(path)`.

**Styles and Design Tokens:**
- Add reusable design tokens to `tailwind.config.ts` and, if needed, matching CSS variables in `src/assets/styles/globals.css`.
- Use Tailwind classes directly in component files for presentational styling.
- Keep global element resets and base styles in `src/assets/styles/globals.css`.

## Special Directories

**`.planning`:**
- Purpose: GSD planning outputs and codebase maps.
- Generated: Yes.
- Committed: Intended to be committed when codebase documentation is part of the work.

**`dist`:**
- Purpose: Vite production build output.
- Generated: Yes.
- Committed: No for normal source changes.

**`node_modules`:**
- Purpose: npm dependency installation directory.
- Generated: Yes.
- Committed: No.

**`public`:**
- Purpose: Static assets copied as-is by Vite.
- Generated: Mixed; `public/mockServiceWorker.js` is generated by MSW but committed for browser mocking.
- Committed: Yes for required static assets.

**`src/mocks`:**
- Purpose: Local/test API simulation layer.
- Generated: No.
- Committed: Yes.

**`src/test`:**
- Purpose: Shared test setup and test-only helpers.
- Generated: No.
- Committed: Yes.

**`docs/backend`:**
- Purpose: Reference documentation for backend API contracts.
- Generated: No.
- Committed: Yes.

**`.sisyphus`:**
- Purpose: Project planning/tracking metadata directory present in the repository root.
- Generated: Tool-managed.
- Committed: Depends on project workflow; do not place application source here.

**`.opencode`:**
- Purpose: OpenCode/tooling metadata directory present in the repository root.
- Generated: Tool-managed.
- Committed: Depends on project workflow; do not place application source here.

---

*Structure analysis: 2026-05-19*
