# Coding Conventions

**Analysis Date:** 2026-05-19

## Naming Patterns

**Files:**
- Use PascalCase for React component files under `src/components/ui/RestaurantCard.tsx`, `src/components/layouts/TopBar.tsx`, and feature page files such as `src/features/discover/DiscoverPage.tsx`.
- Use kebab-case for non-component modules under `src/services/api-client.ts`, `src/services/auth-service.ts`, `src/services/domain-services.ts`, and `src/stores/auth-store.ts`.
- Use `index.ts` barrel files to expose grouped modules from `src/components/ui/index.ts`, `src/components/layouts/index.ts`, `src/services/index.ts`, and `src/lib/index.ts`.
- Co-locate tests beside the source area they protect using `*.test.ts` or `*.test.tsx`, as in `src/lib/formatters.test.ts`, `src/services/api-client.test.ts`, and `src/app/App.test.tsx`.

**Functions:**
- Use camelCase for functions and callbacks: `formatDistance` in `src/lib/formatters.ts`, `parseCoords` in `src/lib/parsers.ts`, `validatePassword` in `src/lib/validators.ts`, and `enableMocks` in `src/main.tsx`.
- Use PascalCase for exported React component functions: `TopBar` in `src/components/layouts/TopBar.tsx`, `RestaurantCard` in `src/components/ui/RestaurantCard.tsx`, and `DiscoverPage` in `src/features/discover/DiscoverPage.tsx`.
- Use local `onSubmit` handlers inside form pages, typed with `FormEvent<HTMLFormElement>` as shown in `src/features/auth/LoginPage.tsx`.

**Variables:**
- Use UPPER_SNAKE_CASE for application constants and route maps: `ROUTES`, `API_ROUTES`, `NAV_ITEMS`, and `API_ERROR_CODES` in `src/lib/constants.ts`.
- Use camelCase for service instances and store hooks: `apiClient` in `src/services/api-client.ts`, `authService` in `src/services/auth-service.ts`, and `useAuthStore` in `src/stores/auth-store.ts`.
- Use `*Fixtures` names for mock data arrays and singular `*Fixture` for one object in `src/mocks/fixtures.ts`.

**Types:**
- Use PascalCase for interfaces and API contracts: `NormalizedApiError` and `RetryConfig` in `src/services/api-client.ts`, `AuthStoreState` in `src/stores/auth-store.ts`, and `RestaurantCardProps` in `src/components/ui/RestaurantCard.tsx`.
- Import shared API types from `src/types/api.ts` through the `@/types/api` alias, as shown in `src/services/auth-service.ts`, `src/mocks/fixtures.ts`, and `src/components/ui/RestaurantCard.tsx`.
- Avoid `any`; `eslint.config.js` enforces `@typescript-eslint/no-explicit-any: error` for `**/*.{ts,tsx}`.

## Code Style

**Formatting:**
- Use Prettier 3 with the settings in `.prettierrc.json`: single quotes, semicolons, trailing commas, and `printWidth: 100`.
- Keep TypeScript strict and JSX compiled through the React automatic runtime from `tsconfig.app.json` (`strict: true`, `jsx: react-jsx`, `moduleResolution: Bundler`).
- Prefer explicit return types for exported utilities where the code already does so, such as `formatDistance` in `src/lib/formatters.ts`, `parseBudget` in `src/lib/parsers.ts`, and `validateInviteCode` in `src/lib/validators.ts`.
- UI classes are Tailwind utility strings using design tokens from `tailwind.config.ts`; reuse tokens like `bg-surface`, `rounded-card`, `shadow-soft`, `text-primary`, and `text-muted` seen in `src/components/layouts/TopBar.tsx` and `src/components/ui/RestaurantCard.tsx`.

**Linting:**
- Run `npm run lint` from `package.json`; it executes `eslint src --max-warnings=0`.
- ESLint is configured in `eslint.config.js` with `@eslint/js`, `typescript-eslint` recommended rules, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, browser globals, and an explicit ban on `any`.
- Keep React refresh exports component-safe; `eslint.config.js` warns on `react-refresh/only-export-components` while allowing constant exports.

## Import Organization

**Order:**
1. External packages first, e.g. `react`, `react-router-dom`, `axios`, `zustand`, `msw`, and `vitest` in `src/main.tsx`, `src/services/api-client.ts`, and `src/mocks/handlers.ts`.
2. Project absolute imports next using `@/`, e.g. `@/lib`, `@/types/api`, `@/components/ui`, and `@/stores/auth-store` in `src/features/discover/DiscoverPage.tsx` and `src/services/api-client.ts`.
3. Relative sibling imports last, e.g. `./api-client` in `src/services/auth-service.ts`, `./fixtures` in `src/mocks/handlers.ts`, and `./Tag` in `src/components/ui/RestaurantCard.tsx`.
4. Type-only imports use `import type`, as in `src/services/auth-service.ts`, `src/mocks/fixtures.ts`, and `src/components/ui/RestaurantCard.tsx`.

**Path Aliases:**
- Use `@/*` for source-root imports. The alias is declared in `vite.config.ts` and mirrored in `tsconfig.app.json` as `@/* -> src/*`.
- Prefer `@/lib` for shared constants, formatters, parsers, validators, and env access; examples include `src/services/api-client.ts` and `src/components/layouts/TopBar.tsx`.
- Use relative imports for files in the same package boundary, such as `./api-client` from service modules and `./handlers` from mock setup modules.

## Error Handling

**Patterns:**
- Normalize HTTP failures at the Axios boundary in `src/services/api-client.ts` using `normalizeApiError`, `API_ERROR_CODES`, and response interceptors.
- Reject normalized service errors from `apiClient.interceptors.response` in `src/services/api-client.ts`; UI code should catch those and display user-facing French messages.
- Parse and validation helpers throw localized `Error` instances for invalid boundary data, as in `parseCoords` and `parseBudget` in `src/lib/parsers.ts`.
- Form pages convert service failures into local UI state instead of leaking raw errors; `src/features/auth/LoginPage.tsx` catches login errors and sets a `role="alert"` message.
- Token refresh is single-flight through module-level `refreshPromise` in `src/services/api-client.ts`; preserve this pattern when adding retryable authentication calls.

## Logging

**Framework:** console

**Patterns:**
- Use logging sparingly for boot-time diagnostics only. `src/main.tsx` uses `console.warn` when MSW fails to start.
- Do not log API payloads, tokens, localStorage values, or user profile data from `src/services/api-client.ts` or `src/stores/auth-store.ts`.
- Prefer visible UI state for expected user failures, as in the login error path in `src/features/auth/LoginPage.tsx`.

## Comments

**When to Comment:**
- Comment security-sensitive tradeoffs and migration seams. `src/stores/auth-store.ts` documents the localStorage token exposure and future httpOnly-cookie migration point.
- Keep simple component rendering and fixture values self-documenting; most files such as `src/components/ui/Tag.tsx` and `src/mocks/fixtures.ts` do not use inline comments.

**JSDoc/TSDoc:**
- Not used in the current scaffold. Prefer descriptive exported names and TypeScript interfaces over JSDoc for local utilities.
- Add TSDoc only when a public helper in `src/lib` has non-obvious constraints not captured by its type signature.

## Function Design

**Size:** Keep shared utilities small and focused. Existing examples include `formatDistance` in `src/lib/formatters.ts`, `parseBudget` in `src/lib/parsers.ts`, and `validateEmail` in `src/lib/validators.ts`.

**Parameters:** Prefer typed objects for API payloads (`LoginRequest`, `RegisterRequest`, `ChangePasswordRequest` in `src/services/auth-service.ts`) and simple primitives for pure utilities (`meters`, `value`, `latitude`, `longitude` in `src/lib`).

**Return Values:** Return typed API response data from service methods after `.then((r) => r.data)` in `src/services/auth-service.ts` and `src/services/domain-services.ts`. Return value objects for validation and parsing results, such as `{ valid, errors }` from `validatePassword` in `src/lib/validators.ts` and `{ lat, lng }` from `parseCoords` in `src/lib/parsers.ts`.

## Module Design

**Exports:**
- Export named functions and constants; there are no default exports in the source files reviewed except config files like `vite.config.ts` and `eslint.config.js`.
- Group API calls by domain as object exports: `authService` in `src/services/auth-service.ts`, `groupsService`, `restaurantsService`, `sessionsService`, `votesService`, `callsService`, and `geoService` in `src/services/domain-services.ts`.
- Keep mock handlers and fixtures separate: request behavior lives in `src/mocks/handlers.ts`, reusable mock data lives in `src/mocks/fixtures.ts`, and runtime setup lives in `src/mocks/browser.ts` and `src/mocks/server.ts`.

**Barrel Files:**
- Use barrel files for ergonomic imports at package boundaries: `src/components/ui/index.ts`, `src/components/layouts/index.ts`, `src/services/index.ts`, and `src/lib/index.ts`.
- Do not import through a barrel from inside the same directory when that would obscure local dependencies; examples use direct `./Tag` and `./api-client` imports.

---

*Convention analysis: 2026-05-19*
