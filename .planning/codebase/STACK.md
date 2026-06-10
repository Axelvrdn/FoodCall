# Technology Stack

**Analysis Date:** Wed May 20 2026

## Languages

**Primary:**
- TypeScript 5.9.3 - Application source, service clients, API contracts, stores, query hooks, Vite config, and Tailwind config live in `src/`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.app.json`, and `tsconfig.node.json`.
- TSX / React JSX - Route pages, feature screens, layouts, and reusable UI components live in `src/app/`, `src/features/`, and `src/components/`.

**Secondary:**
- JavaScript ES modules - Tooling configuration lives in `eslint.config.js` and `postcss.config.js`.
- CSS with Tailwind directives - Global and responsive styling lives in `src/assets/styles/globals.css` and `src/assets/styles/responsive.css`.
- Markdown - Backend API and frontend integration references live in `docs/backend/api-documentation.md` and `docs/backend/frontend-integration-guide.md`.

## Runtime

**Environment:**
- Browser single-page application mounted by `src/main.tsx` into `index.html` `#root`.
- Vite development server runs on `127.0.0.1:5173` via `package.json` script `dev`.
- Node.js is required for Vite, Vitest, TypeScript, ESLint, Tailwind, and npm scripts; no `.nvmrc`, `.node-version`, or `engines.node` pin is present in `package.json`.

**Package Manager:**
- npm - inferred from `package-lock.json` and `package.json` scripts.
- Lockfile: present at `package-lock.json`.

## Frameworks

**Core:**
- React 18.3.1 - UI rendering through `src/main.tsx`, route composition in `src/app/App.tsx`, and pages under `src/features/`.
- Vite 7.2.4 - Dev server, production build, React plugin, alias resolution, and Vitest config in `vite.config.ts`.
- React Router DOM 6.30.2 - Browser routing, auth guards, layouts, and nested routes in `src/app/router.tsx`.
- Tailwind CSS 3.4.18 - Utility-first styling with project design tokens in `tailwind.config.ts` and globals in `src/assets/styles/globals.css`.

**Testing:**
- Vitest 4.0.14 - Unit and component test runner configured in `vite.config.ts` and started by `npm test`.
- Testing Library React 16.3.0 - Component rendering and DOM assertions in `src/**/*.test.tsx`.
- Testing Library jest-dom 6.9.1 - DOM matchers loaded from `src/test/setup.ts`.
- MSW 2.12.3 - HTTP mocking for tests and local browser development through `src/mocks/server.ts`, `src/mocks/browser.ts`, and `src/mocks/handlers.ts`.
- jsdom 27.2.0 - Vitest browser-like test environment configured in `vite.config.ts`.

**Build/Dev:**
- TypeScript build mode - `npm run build` runs `tsc -b` before `vite build` from `package.json`.
- ESLint 9.39.1 with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` - lint rules live in `eslint.config.js`.
- Prettier 3.6.2 - Available as a dev dependency; no repository Prettier config file is detected.
- PostCSS 8.5.6 and Autoprefixer 10.4.22 - Tailwind pipeline configured in `postcss.config.js`.

## Key Dependencies

**Critical:**
- `@tanstack/react-query` 5.90.10 - Server-state cache, query hooks, mutations, retries, and invalidation in `src/app/query-client.ts`, `src/features/server-state.ts`, and feature query adapters.
- `axios` 1.13.2 - HTTP transport, base URL configuration, bearer-token injection, 401 refresh retry, and normalized API errors in `src/services/api-client.ts`.
- `zustand` 5.0.8 - Client auth state, token persistence, and user session store in `src/stores/auth-store.ts`.
- `react-router-dom` 6.30.2 - Public/private route guards and SPA route table in `src/app/router.tsx`.
- `msw` 2.12.3 - Mock backend contract for auth, users, groups, restaurants, external discovery, sessions, votes, calls, feedback, recommendations, and geo endpoints in `src/mocks/handlers.ts`.

**Infrastructure:**
- `@vitejs/plugin-react` 5.1.1 - React transform and Fast Refresh plugin in `vite.config.ts`.
- `typescript-eslint` 8.48.0 - Type-aware lint config assembly in `eslint.config.js`.
- `@types/react`, `@types/react-dom`, `@types/node` - Type declarations used by TypeScript app, Vite config, and tests in `package.json`.
- `globals` 16.5.0 - Browser global definitions used by `eslint.config.js`.

## Configuration

**Environment:**
- Runtime environment reads only `VITE_API_URL` and `VITE_MSW_ENABLED` in `src/lib/env.ts`.
- API base URL defaults to `http://localhost:3000/api` when `VITE_API_URL` is not set in `src/lib/env.ts`.
- Browser MSW starts by default in development unless `VITE_MSW_ENABLED=false` in `src/lib/env.ts` and `src/main.tsx`.
- `.env.development` is present for local environment configuration; contents are not read or quoted.

**Build:**
- Vite config: `vite.config.ts` defines React plugin, `@` alias to `src`, Vitest jsdom environment, globals, and `src/test/setup.ts`.
- TypeScript project references: `tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`.
- Application TS config: `tsconfig.app.json` enables strict mode, `moduleResolution: Bundler`, `jsx: react-jsx`, `baseUrl: .`, and `@/*` path alias to `src/*`.
- Tailwind design tokens: `tailwind.config.ts` defines FoodCall colors, `card`/`radius` border radii, display/body/mono fonts, shadows, gradient, and custom `md`/`lg` breakpoints.
- ESLint config: `eslint.config.js` ignores `dist`, applies JS and TypeScript recommended rules, React Hooks rules, React Refresh rule, and forbids `@typescript-eslint/no-explicit-any`.

## Platform Requirements

**Development:**
- Run `npm install` from `package.json` / `package-lock.json`.
- Run `npm run dev` for Vite at `127.0.0.1:5173`.
- Run `npm test` for Vitest, `npm run lint` for ESLint, and `npm run build` for type-check plus Vite build.
- Backend-compatible API should expose `/api` endpoints described in `docs/backend/api-documentation.md`; local frontend defaults to `http://localhost:3000/api`.

**Production:**
- Static SPA build output is produced by `vite build`; no hosting platform config is present in the repository.
- Production API base URL must be injected with `VITE_API_URL` because `src/lib/env.ts` otherwise falls back to the local backend URL.

---

*Stack analysis: Wed May 20 2026*
