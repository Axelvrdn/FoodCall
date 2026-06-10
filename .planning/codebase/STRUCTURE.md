# Codebase Structure

**Analysis Date:** Wed May 20 2026

## Directory Layout

```
FoodCall/
├── index.html                 # Vite HTML entry, mounts `src/main.tsx`
├── package.json               # npm scripts and dependency manifest
├── package-lock.json          # npm lockfile
├── vite.config.ts             # Vite, React plugin, path alias, Vitest config
├── tsconfig.json              # TypeScript project references
├── tsconfig.app.json          # Strict browser app TypeScript config
├── tsconfig.node.json         # Node/tooling TypeScript config
├── tailwind.config.ts         # FoodCall design tokens and Tailwind content paths
├── postcss.config.js          # Tailwind + Autoprefixer PostCSS plugins
├── eslint.config.js           # Flat ESLint config for TS/TSX and React hooks
├── docs/
│   └── backend/               # Backend API reference and integration guide
├── src/
│   ├── main.tsx               # Browser app bootstrap and optional MSW startup
│   ├── app/                   # Global providers, router, query client
│   ├── assets/styles/         # Global CSS and responsive CSS
│   ├── components/            # Reusable UI, layouts, and cross-feature widgets
│   ├── features/              # Route-level feature screens and feature adapters
│   ├── lib/                   # Env, constants, formatters, parsers, validators
│   ├── mocks/                 # MSW handlers, fixtures, browser worker, test server
│   ├── services/              # Axios API client and typed backend services
│   ├── stores/                # Zustand client-state stores
│   ├── test/                  # Vitest setup
│   └── types/                 # API and UI TypeScript contracts
└── .planning/codebase/        # Generated codebase maps for GSD planning
```

## Directory Purposes

**`src/app/`:**
- Purpose: Application composition and global routing.
- Contains: `App.tsx`, `router.tsx`, `query-client.ts`.
- Key files: `src/app/App.tsx`, `src/app/router.tsx`, `src/app/query-client.ts`, `src/app/App.test.tsx`.

**`src/features/`:**
- Purpose: Route-level feature ownership, feature-specific adapters, and page tests.
- Contains: feature folders for `auth`, `calls`, `discover`, `groups`, `not-found`, `profile`, `reviews`, `sessions`, `settings`, plus shared server-state files.
- Key files: `src/features/server-state.ts`, `src/features/query-keys.ts`, `src/features/discover/DiscoverPage.tsx`, `src/features/groups/GroupDetailPage.tsx`, `src/features/sessions/SessionDetailPage.tsx`.

**`src/features/auth/`:**
- Purpose: Authentication screens and auth bootstrap.
- Contains: login, register, forgot password, onboarding, auth query, bootstrap provider, and auth lifecycle tests.
- Key files: `src/features/auth/LoginPage.tsx`, `src/features/auth/RegisterPage.tsx`, `src/features/auth/AuthBootstrapProvider.tsx`, `src/features/auth/auth-queries.ts`.

**`src/features/discover/`:**
- Purpose: Restaurant discovery, geocoding, nearby search, external restaurant panel, and restaurant detail.
- Contains: `DiscoverPage.tsx`, `RestaurantDetailPage.tsx`, `ExternalRestaurantPanel.tsx`, `discovery-queries.ts`, tests.
- Key files: `src/features/discover/DiscoverPage.tsx`, `src/features/discover/discovery-queries.ts`, `src/features/discover/RestaurantDetailPage.tsx`.

**`src/features/groups/`:**
- Purpose: Group list/detail, group form, invites, group recommendations, role helpers, and tests.
- Contains: `GroupsPage.tsx`, `GroupDetailPage.tsx`, `GroupForm.tsx`, `GroupInvitesPanel.tsx`, `GroupRecommendations.tsx`, `group-queries.ts`.
- Key files: `src/features/groups/group-queries.ts`, `src/features/groups/GroupDetailPage.tsx`, `src/features/groups/GroupRecommendations.tsx`.

**`src/features/sessions/`:**
- Purpose: Session list/detail, state controls, candidates, session recommendations, session query adapters, and tests.
- Contains: `SessionsPage.tsx`, `SessionDetailPage.tsx`, `CandidatesPage.tsx`, `SessionStateControls.tsx`, `SessionRecommendations.tsx`, `session-queries.ts`, `candidate-queries.ts`.
- Key files: `src/features/sessions/session-queries.ts`, `src/features/sessions/candidate-queries.ts`, `src/features/sessions/SessionDetailPage.tsx`, `src/features/sessions/SessionStateControls.tsx`.

**`src/features/calls/`:**
- Purpose: User-facing calls page and test coverage.
- Contains: `CallsPage.tsx`, `CallsPage.test.tsx`.
- Key files: `src/features/calls/CallsPage.tsx`.

**`src/features/reviews/`:**
- Purpose: Review list page and tests.
- Contains: `ReviewsPage.tsx`, `ReviewsPage.test.tsx`.
- Key files: `src/features/reviews/ReviewsPage.tsx`.

**`src/components/`:**
- Purpose: Reusable components shared across features.
- Contains: cross-feature widgets (`CallsList`, `ReviewsList`, `ReviewForm`, `RecommendationsList`, `ExplanationBreakdown`), layouts, and UI primitives.
- Key files: `src/components/RecommendationsList.tsx`, `src/components/ExplanationBreakdown.tsx`, `src/components/CallsList.tsx`, `src/components/ReviewsList.tsx`, `src/components/ReviewForm.tsx`.

**`src/components/layouts/`:**
- Purpose: App chrome, auth shell, settings shell, and layout barrel export.
- Contains: `AppLayout.tsx`, `AuthLayout.tsx`, `SettingsLayout.tsx`, `TopBar.tsx`, `index.ts`.
- Key files: `src/components/layouts/AppLayout.tsx`, `src/components/layouts/TopBar.tsx`.

**`src/components/ui/`:**
- Purpose: Design-system-style primitives and cards.
- Contains: `BadgeCard`, `CallCard`, `Hero`, `MapPlaceholder`, `MemberRow`, `Pill`, `ProgressBar`, `RestaurantCard`, `ReviewCard`, `ScoreRing`, `SearchRow`, `StatCard`, `Tag`, `Toggle`, `VoteCard`, and `index.ts`.
- Key files: `src/components/ui/RestaurantCard.tsx`, `src/components/ui/Hero.tsx`, `src/components/ui/index.ts`.

**`src/services/`:**
- Purpose: HTTP client and typed backend domain services.
- Contains: `api-client.ts`, `auth-service.ts`, `users-service.ts`, `domain-services.ts`, `index.ts`, service tests.
- Key files: `src/services/api-client.ts`, `src/services/domain-services.ts`, `src/services/auth-service.ts`.

**`src/stores/`:**
- Purpose: Client-owned global state.
- Contains: Zustand auth store.
- Key files: `src/stores/auth-store.ts`.

**`src/lib/`:**
- Purpose: Shared constants, environment, formatting, parsing, validation, and barrel export.
- Contains: `constants.ts`, `env.ts`, `formatters.ts`, `parsers.ts`, `validators.ts`, `index.ts`, tests.
- Key files: `src/lib/constants.ts`, `src/lib/env.ts`, `src/lib/formatters.ts`.

**`src/types/`:**
- Purpose: Shared TypeScript contracts.
- Contains: backend API contracts, UI types, and type tests.
- Key files: `src/types/api.ts`, `src/types/ui.ts`, `src/types/index.ts`.

**`src/mocks/`:**
- Purpose: MSW-backed local and test API simulation.
- Contains: `handlers.ts`, `fixtures.ts`, `browser.ts`, `server.ts`.
- Key files: `src/mocks/handlers.ts`, `src/mocks/fixtures.ts`.

**`docs/backend/`:**
- Purpose: Backend API reference and frontend integration guidance.
- Contains: API documentation, integration guide, prototype notes.
- Key files: `docs/backend/api-documentation.md`, `docs/backend/frontend-integration-guide.md`.

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell and Vite module script.
- `src/main.tsx`: SPA bootstrap, MSW enablement, React render.
- `src/app/App.tsx`: Global providers and router provider.
- `src/app/router.tsx`: Route table, guards, redirects, and app shell.

**Configuration:**
- `package.json`: npm scripts and dependency versions.
- `vite.config.ts`: React plugin, `@` alias, Vitest jsdom setup.
- `tsconfig.app.json`: strict browser TypeScript settings and `@/*` alias.
- `tailwind.config.ts`: design tokens and Tailwind content scan.
- `eslint.config.js`: TypeScript, React Hooks, React Refresh, and no-explicit-any rules.
- `postcss.config.js`: Tailwind and Autoprefixer plugins.
- `.env.development`: local environment file present; contents are not read or quoted.

**Core Logic:**
- `src/services/api-client.ts`: Axios instance, auth header, refresh retry, normalized errors.
- `src/services/domain-services.ts`: REST service methods for groups, restaurants, sessions, candidates, votes, calls, feedback, reviews, recommendations, and geo.
- `src/features/server-state.ts`: TanStack Query hooks and mutation invalidation.
- `src/features/query-keys.ts`: Query-key factories.
- `src/stores/auth-store.ts`: Zustand auth state and token persistence.
- `src/types/api.ts`: API request/response contracts.
- `src/lib/constants.ts`: Frontend routes, backend routes, API error labels, route builder.

**Feature Pages:**
- `src/features/discover/DiscoverPage.tsx`: geolocation/address discovery and nearby restaurants.
- `src/features/discover/RestaurantDetailPage.tsx`: restaurant detail and review context.
- `src/features/groups/GroupsPage.tsx`: group listing and creation entry.
- `src/features/groups/GroupDetailPage.tsx`: group profile, members, editable defaults, invites, recent sessions, recommendations link.
- `src/features/groups/GroupRecommendations.tsx`: group-level recommendations.
- `src/features/sessions/SessionsPage.tsx`: group session list.
- `src/features/sessions/SessionDetailPage.tsx`: session details, candidates, calls, votes, transitions.
- `src/features/sessions/CandidatesPage.tsx`: candidate management.
- `src/features/sessions/SessionRecommendations.tsx`: session-level recommendations.
- `src/features/calls/CallsPage.tsx`: user's calls.
- `src/features/reviews/ReviewsPage.tsx`: reviews overview.

**Testing:**
- `src/test/setup.ts`: MSW test lifecycle and jest-dom setup.
- `src/mocks/server.ts`: MSW node server for Vitest.
- `src/mocks/handlers.ts`: mocked backend handlers.
- `src/**/*.test.ts` and `src/**/*.test.tsx`: colocated unit/component tests.

## Naming Conventions

**Files:**
- React route/component files use PascalCase: `src/features/groups/GroupDetailPage.tsx`, `src/components/ui/RestaurantCard.tsx`.
- Feature query adapters use kebab-case: `src/features/discover/discovery-queries.ts`, `src/features/sessions/session-queries.ts`, `src/features/groups/group-queries.ts`.
- Services use kebab-case with `-service`: `src/services/auth-service.ts`, `src/services/users-service.ts`, `src/services/domain-services.ts`.
- Tests colocate with implementation using `.test.ts` or `.test.tsx`: `src/features/sessions/SessionDetailPage.test.tsx`, `src/services/api-client.test.ts`.
- Barrel files are named `index.ts`: `src/services/index.ts`, `src/components/ui/index.ts`, `src/components/layouts/index.ts`, `src/lib/index.ts`, `src/types/index.ts`.

**Directories:**
- Feature folders use lower-case domain names: `src/features/discover/`, `src/features/groups/`, `src/features/sessions/`.
- Shared component subfolders separate primitives from layouts: `src/components/ui/`, `src/components/layouts/`.
- Infrastructure folders are singular/plural by content: `src/services/`, `src/stores/`, `src/mocks/`, `src/types/`, `src/lib/`.

## Where to Add New Code

**New Feature:**
- Primary route page: add a folder or page under `src/features/<feature>/`.
- Route registration: add imports and route entries in `src/app/router.tsx`.
- Route constants: add user-facing route paths to `ROUTES` in `src/lib/constants.ts`.
- Tests: colocate as `src/features/<feature>/<FeaturePage>.test.tsx`.

**New Backend Domain Endpoint:**
- API path: add to `API_ROUTES` in `src/lib/constants.ts`.
- Types: add request/response contracts to `src/types/api.ts`.
- Service method: add to `src/services/domain-services.ts` or a dedicated service in `src/services/` if the domain is large.
- Query key: add namespace/key factory to `src/features/query-keys.ts`.
- Hook: add `useXQuery` / `useXMutation` to `src/features/server-state.ts`.
- Mock: add handler and fixture coverage in `src/mocks/handlers.ts` and `src/mocks/fixtures.ts`.
- Tests: add or update service/hook/page tests near the implementation.

**New Component/Module:**
- Reusable primitive/card: `src/components/ui/<ComponentName>.tsx` and export from `src/components/ui/index.ts`.
- Reusable layout: `src/components/layouts/<LayoutName>.tsx` and export from `src/components/layouts/index.ts`.
- Cross-feature widget with domain behavior: `src/components/<WidgetName>.tsx` when shared by multiple features, as with `src/components/RecommendationsList.tsx`.
- Feature-specific component: keep beside the page under `src/features/<feature>/`.

**Utilities:**
- Constants and route builders: `src/lib/constants.ts`.
- Environment reads: `src/lib/env.ts`; only read browser-safe `VITE_*` variables.
- Formatting: `src/lib/formatters.ts`.
- Parsing: `src/lib/parsers.ts`.
- Validation helpers: `src/lib/validators.ts`.
- Shared exports: update `src/lib/index.ts` when utility modules should be imported as `@/lib`.

**State:**
- Backend server state: `src/features/server-state.ts` with keys in `src/features/query-keys.ts`.
- Auth/client identity state: `src/stores/auth-store.ts`.
- Page-local form/UI state: keep in the page/component with React state.

**Mocks:**
- Browser MSW setup: `src/mocks/browser.ts`.
- Vitest MSW setup: `src/mocks/server.ts` and `src/test/setup.ts`.
- New endpoint handlers: `src/mocks/handlers.ts`.
- New response data: `src/mocks/fixtures.ts`.

## Special Directories

**`src/mocks/`:**
- Purpose: Executable API contract for local dev and tests.
- Generated: No.
- Committed: Yes.

**`src/test/`:**
- Purpose: Global Vitest setup.
- Generated: No.
- Committed: Yes.

**`docs/backend/`:**
- Purpose: Reference and integration documents for the backend consumed by the frontend.
- Generated: No.
- Committed: Yes.

**`.planning/codebase/`:**
- Purpose: GSD-generated codebase maps consumed by planning/execution commands.
- Generated: Yes.
- Committed: Yes when orchestrator chooses to commit documentation updates.

**`dist/`:**
- Purpose: Vite production build output when generated.
- Generated: Yes.
- Committed: No; ignored by `eslint.config.js` and normally excluded from source control.

---

*Structure analysis: Wed May 20 2026*
