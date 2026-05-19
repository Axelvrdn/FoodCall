# Testing Patterns

**Analysis Date:** 2026-05-19

## Test Framework

**Runner:**
- Vitest 4.0.14 from `package.json`.
- Config: `vite.config.ts` defines `test.environment: 'jsdom'`, `globals: true`, and `setupFiles: ['./src/test/setup.ts']`.
- Type support: `tsconfig.app.json` includes `vitest/globals` and `@testing-library/jest-dom` in `compilerOptions.types`.

**Assertion Library:**
- Use Vitest `expect` for unit assertions in `src/lib/formatters.test.ts`, `src/types/api.test.ts`, and `src/services/api-client.test.ts`.
- Use Testing Library DOM matchers from `@testing-library/jest-dom/vitest`, loaded by `src/test/setup.ts`, for UI assertions in `src/app/App.test.tsx`.
- Use React Testing Library `render` and `screen` for component tests, as shown in `src/app/App.test.tsx`.

**Run Commands:**
```bash
npm run test          # Run all tests once with vitest run
npm run test:watch    # Run Vitest in watch mode
npm run build         # Type-check with tsc -b and build with Vite
npm run lint          # Run ESLint against src with zero warnings allowed
```

## Test File Organization

**Location:**
- Tests are co-located inside `src` near the layer they validate.
- Application-level smoke/navigation tests live in `src/app/App.test.tsx`.
- Service helper tests live beside services in `src/services/api-client.test.ts`.
- Utility tests live beside utilities in `src/lib/formatters.test.ts` and `src/lib/constants.test.ts`.
- Type contract tests live in `src/types/api.test.ts`.

**Naming:**
- Use `*.test.ts` for TypeScript utilities, services, and type contracts, e.g. `src/lib/constants.test.ts` and `src/services/api-client.test.ts`.
- Use `*.test.tsx` for React component rendering tests, e.g. `src/app/App.test.tsx`.

**Structure:**
```text
src/
├── app/
│   └── App.test.tsx              # component/scaffold behavior
├── lib/
│   ├── constants.test.ts         # route/navigation constants
│   └── formatters.test.ts        # formatting, parsing, validation utilities
├── services/
│   └── api-client.test.ts        # HTTP client helper behavior
├── test/
│   └── setup.ts                  # global matcher setup
└── types/
    └── api.test.ts               # API type contract invariants
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from 'vitest';

describe('FoodCall utilities', () => {
  it('formats French distances and budgets', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatBudget('15.00')).toBe('15,00 €');
  });
});
```

**Patterns:**
- Use one `describe` block per domain or behavior group, as in `src/lib/formatters.test.ts`, `src/types/api.test.ts`, and `src/app/App.test.tsx`.
- Write behavior-oriented `it` names in present tense, such as `keeps product navigation constrained` in `src/app/App.test.tsx` and `normalizes documented API status codes to French messages` in `src/services/api-client.test.ts`.
- Keep assertions concrete and product-specific; navigation tests assert exact French labels from `NAV_ITEMS` and `USER_MENU_ITEMS` in `src/app/App.test.tsx` and `src/lib/constants.test.ts`.
- Use Testing Library accessibility queries for rendered UI: `screen.getByRole('navigation', { name: 'Navigation principale' })` in `src/app/App.test.tsx`.
- Set Zustand state directly through `useAuthStore.getState()` before rendering authenticated UI in `src/app/App.test.tsx`.

## Mocking

**Framework:** Vitest mocks plus MSW fixtures are available.

**Patterns:**
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('api client helpers', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('normalizes documented API status codes to French messages', () => {
    const error = { response: { status: 404 } } as AxiosError;
    expect(normalizeApiError(error).message).toBe('Ressource introuvable.');
  });
});
```

**What to Mock:**
- Use MSW request handlers in `src/mocks/handlers.ts` for API-facing component or service tests that need network behavior.
- Reuse typed fixtures from `src/mocks/fixtures.ts` for users, groups, restaurants, sessions, candidates, votes, calls, and feedback.
- Mock browser state explicitly through Zustand store methods for layout tests, as `src/app/App.test.tsx` does with `useAuthStore.getState().setUser(...)`.

**What NOT to Mock:**
- Do not mock pure utilities in `src/lib/formatters.ts`, `src/lib/parsers.ts`, or `src/lib/validators.ts`; test their actual output and errors.
- Do not mock constants from `src/lib/constants.ts` when asserting product navigation constraints; direct imports catch accidental route or label drift.
- Do not mock React Router when route context is required; wrap components in `MemoryRouter` as shown in `src/app/App.test.tsx`.

## Fixtures and Factories

**Test Data:**
```typescript
export const userFixture: User = {
  id: 'user-thomas',
  email: 'thomas@foodcall.test',
  displayName: 'Thomas',
  avatarUrl: null,
  reputationScore: 842,
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-12T10:00:00.000Z',
};
```

**Location:**
- Shared fixture data lives in `src/mocks/fixtures.ts` and is consumed by `src/mocks/handlers.ts` and UI scaffold pages such as `src/features/discover/DiscoverPage.tsx`.
- Keep API contract examples in tests minimal and inline when they only validate type shape, as shown in `src/types/api.test.ts`.

## Coverage

**Requirements:** None enforced in the current configuration. `package.json` has no coverage script, and `vite.config.ts` does not define Vitest coverage thresholds.

**View Coverage:**
```bash
npm run test          # Current available test command; no coverage reporter configured
```

## Test Types

**Unit Tests:**
- Use unit tests for formatting, parsing, validation, constants, API type contracts, and service helper normalization.
- Examples: `src/lib/formatters.test.ts`, `src/lib/constants.test.ts`, `src/types/api.test.ts`, and `src/services/api-client.test.ts`.

**Integration Tests:**
- Use jsdom-based React integration tests for layout and navigation behavior. `src/app/App.test.tsx` renders `TopBar` inside `MemoryRouter` and asserts the user menu and main navigation.
- API integration support exists through MSW setup modules `src/mocks/server.ts`, `src/mocks/browser.ts`, and `src/mocks/handlers.ts`, but the current tests do not start `server` globally in `src/test/setup.ts`.

**E2E Tests:**
- Not used. No Playwright, Cypress, or browser E2E configuration appears in `package.json` or the source tree.

## Common Patterns

**Async Testing:**
```typescript
// Prefer async tests for future service or component behavior that waits on API calls.
// Use MSW handlers from src/mocks/handlers.ts and Testing Library async queries.
it('loads data from an API-backed component', async () => {
  // render(<MemoryRouter><Component /></MemoryRouter>);
  // expect(await screen.findByText('Bento Volcan')).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
expect(() => parseCoords('', '')).toThrow('Coordonnées invalides');
expect(normalizeApiError({ response: { status: 404 } } as AxiosError).message).toBe('Ressource introuvable.');
```

**Component Testing:**
```typescript
useAuthStore.getState().setUser({
  id: 'user-test',
  email: 'test@foodcall.test',
  displayName: 'Thomas',
  avatarUrl: null,
  reputationScore: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});
render(<MemoryRouter><TopBar /></MemoryRouter>);
expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toHaveTextContent('DécouvrirGroupesAvisMes calls');
```

---

*Testing analysis: 2026-05-19*
