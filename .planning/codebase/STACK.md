# Technology Stack

**Analysis Date:** 2026-05-19

## Languages

**Primary:**
- TypeScript 5.9.3 - Application source, React components, services, stores, API contracts, Tailwind config, and Vite/Vitest config live under `src/`, `tailwind.config.ts`, `vite.config.ts`, `tsconfig.app.json`, and `tsconfig.node.json`.
- TSX / React JSX - UI screens and layouts use `.tsx` files under `src/app/`, `src/features/`, and `src/components/`.

**Secondary:**
- JavaScript ES modules - Tooling config uses ESM JavaScript in `eslint.config.js` and `postcss.config.js`.
- CSS with Tailwind directives - Global styles and remote font import live in `src/assets/styles/globals.css`.
- Markdown - Backend API reference and frontend integration docs live in `docs/backend/api-documentation.md` and `docs/backend/frontend-integration-guide.md`.

## Runtime

**Environment:**
- Browser single-page application mounted from `index.html` into `#root` by `src/main.tsx`.
- Node.js is required for Vite, Vitest, TypeScript, ESLint, Tailwind, and npm scripts, but no exact Node runtime version is pinned in `package.json`, `.nvmrc`, or `.node-version`.
- Build target is ES2022 for browser code in `tsconfig.app.json`; tool/config files target ES2023 in `tsconfig.node.json`.

**Package Manager:**
- npm - `package-lock.json` is present with lockfile version 3.
- Lockfile: present at `package-lock.json`.
- Use npm scripts from `package.json`: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run test:watch`, and `npm run preview`.

## Frameworks

**Core:**
- React 18.3.1 - UI framework used by `src/main.tsx`, `src/app/App.tsx`, `src/features/**`, and `src/components/**`.
- React DOM 18.3.1 - Browser renderer used in `src/main.tsx`.
- Vite 7.2.4 - Dev server and production bundler configured in `vite.config.ts`; dev runs on `127.0.0.1:5173` from `package.json`.
- React Router DOM 6.30.2 - Client routing and route guards are implemented from `src/app/router.tsx` and consumed in `src/app/App.tsx`.
- Tailwind CSS 3.4.18 - Utility styling uses tokens from `tailwind.config.ts` and directives from `src/assets/styles/globals.css`.
- Zustand 5.0.8 - Authentication state and token persistence live in `src/stores/auth-store.ts`.
- TanStack React Query 5.90.10 - Data-fetching cache provider is created in `src/app/App.tsx`; feature-level hooks are not yet detected.
- Axios 1.13.2 - HTTP client, auth headers, refresh retry, and error normalization live in `src/services/api-client.ts`.

**Testing:**
- Vitest 4.0.14 - Test runner configured through the `test` block in `vite.config.ts`.
- jsdom 27.2.0 - Browser-like test environment configured in `vite.config.ts`.
- Testing Library React 16.3.0, jest-dom 6.9.1, and user-event 14.6.1 - Component testing helpers referenced by `package.json` and test setup in `src/test/setup.ts`.
- MSW 2.12.3 - Mock API layer configured in `src/mocks/browser.ts`, `src/mocks/server.ts`, and `src/mocks/handlers.ts`.

**Build/Dev:**
- @vitejs/plugin-react 5.1.1 - React transform plugin enabled in `vite.config.ts`.
- TypeScript project references - Root `tsconfig.json` references `tsconfig.app.json` and `tsconfig.node.json`.
- ESLint 9.39.1 with typescript-eslint 8.48.0 - Flat config in `eslint.config.js` enforces recommended JS/TS rules and `@typescript-eslint/no-explicit-any`.
- eslint-plugin-react-hooks 7.0.1 - React Hooks rules are enabled in `eslint.config.js`.
- eslint-plugin-react-refresh 0.4.24 - Fast Refresh export safety warning is enabled in `eslint.config.js`.
- Prettier 3.6.2 - Formatting settings are in `.prettierrc.json`.
- PostCSS 8.5.6 with Autoprefixer 10.4.22 - Tailwind processing config lives in `postcss.config.js`.

## Key Dependencies

**Critical:**
- `react` / `react-dom` - Required for all runtime UI under `src/app/`, `src/features/`, and `src/components/`.
- `react-router-dom` - Required for browser routes, protected routes, navigation links, and URL params in `src/app/router.tsx`, `src/components/layouts/TopBar.tsx`, and `src/features/groups/GroupDetailPage.tsx`.
- `axios` - Required for backend REST calls, bearer token injection, token refresh, and normalized API errors in `src/services/api-client.ts`.
- `zustand` - Required for central auth state and `localStorage` token access in `src/stores/auth-store.ts`.
- `@tanstack/react-query` - Required for the app-level query cache provider in `src/app/App.tsx`.

**Infrastructure:**
- `msw` - Provides browser and test request interception through `public/mockServiceWorker.js`, `src/mocks/browser.ts`, `src/mocks/server.ts`, and `src/mocks/handlers.ts`.
- `tailwindcss` - Supplies design tokens and utility classes from `tailwind.config.ts` and `src/assets/styles/globals.css`.
- `vite` - Supplies dev server, build, preview, alias resolution, and Vitest integration in `vite.config.ts`.
- `typescript` - Supplies strict type checking through `tsconfig.app.json` and `tsconfig.node.json`.
- `@testing-library/*` and `vitest` - Supply the component and unit test environment for files such as `src/app/App.test.tsx`, `src/services/api-client.test.ts`, and `src/types/api.test.ts`.

## Configuration

**Environment:**
- Frontend runtime configuration is centralized in `src/lib/env.ts`.
- `VITE_API_URL` controls the Axios base URL; when unset, `src/lib/env.ts` defaults to `http://localhost:3000/api`.
- `VITE_MSW_ENABLED` controls browser MSW startup; `src/lib/env.ts` enables MSW by default in Vite development unless the variable is exactly `false`.
- `.env.development` is present and must be treated as environment configuration only; do not read or quote its contents.

**Build:**
- `vite.config.ts` configures React, `@` alias resolution to `src/`, and Vitest setup.
- `tsconfig.app.json` enables strict TypeScript, `react-jsx`, DOM libraries, bundler module resolution, and `@/*` path aliases for application code.
- `tsconfig.node.json` enables strict TypeScript and Node types for config files.
- `tailwind.config.ts` defines content scanning for `index.html` and `src/**/*.{ts,tsx}`, FoodCall color tokens, fonts, shadows, radius tokens, and custom breakpoints.
- `postcss.config.js` wires Tailwind and Autoprefixer.
- `eslint.config.js` uses flat config and ignores `dist`.
- `.prettierrc.json` sets single quotes, semicolons, trailing commas, and print width 100.

## Platform Requirements

**Development:**
- Install dependencies with npm using `package.json` and `package-lock.json`.
- Run the frontend dev server with `npm run dev`; `package.json` binds Vite to `127.0.0.1:5173`.
- Run tests with `npm run test`; Vitest uses jsdom and `src/test/setup.ts` through `vite.config.ts`.
- Use `VITE_API_URL` to target a live backend, or use the default local API base from `src/lib/env.ts`.
- Keep `public/mockServiceWorker.js` available when `VITE_MSW_ENABLED` starts the browser worker from `src/main.tsx`.

**Production:**
- Build with `npm run build`; this runs `tsc -b` followed by `vite build` as defined in `package.json`.
- Preview production artifacts locally with `npm run preview`; `package.json` binds preview to `127.0.0.1:4173`.
- Deployment target is a static browser SPA artifact generated by Vite; no frontend hosting provider is configured in repo files.
- Production API targets are documented as `https://api.foodcall.app` in `docs/backend/frontend-integration-guide.md` and `docs/backend/api-documentation.md`.

---

*Stack analysis: 2026-05-19*
