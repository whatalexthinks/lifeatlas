# LifeAtlas / OurLifeCapsule

A privacy-first family legacy platform for gathering stories, photographs, voices, and future messages. This port preserves the imported Part One local demonstration, not a connected production service.

## Run and test

- Start the managed workflow `artifacts/lifeatlas: web` to run the app at `/`.
- `pnpm --filter @workspace/lifeatlas test` runs the imported unit and component tests.
- `pnpm --filter @workspace/lifeatlas test:e2e` runs the imported Playwright suite against the running workflow through the shared proxy.
- Browser tests default to `http://localhost:80`; set `E2E_BASE_URL` to test another reachable instance.
- `pnpm --filter @workspace/lifeatlas assets` regenerates the original SVG illustrations and social share image. Both development startup and production build run this automatically.

## Workspace

- `artifacts/lifeatlas/`: migrated React + Vite app, original pages, components, domain logic, and local service implementations.
- `artifacts/lifeatlas/docs/`: original product, privacy, data model, integration, and QA documentation.
- `artifacts/lifeatlas/e2e/`: original browser test journeys.
- `.migration-backup/`: original Next.js source retained for comparison; not deployed.
- `artifacts/api-server/`, `lib/`, and `artifacts/mockup-sandbox/`: pre-existing workspace scaffold, unused by this local demo.

## Migration constraints

- Preserve the original visual design, routes, media, and local-first behavior. Do not redesign as part of maintenance.
- IndexedDB and browser storage hold demo data and media on the current device. There is no cross-device sync or cloud backup.
- Accounts, payments, email delivery, scheduled delivery, print fulfillment, and cloud storage remain explicitly disconnected, as in the original app. Do not imply they are live.
- The frontend needs no secrets or database to run. Optional public configuration uses `VITE_APP_MODE`, `VITE_LIFEATLAS_MODE`, `VITE_SITE_URL`, and `VITE_DEMO_LATENCY`.
- Never put private family material in social preview images. The original typographic social card is generated from bundled fonts.
- Preserve privacy headers, private-route noindex behavior, and robots exclusions.

## Stack

pnpm workspace, React 19, Vite, TypeScript, Tailwind CSS 4, React Router, Zustand, IndexedDB, Vitest, and Playwright.
