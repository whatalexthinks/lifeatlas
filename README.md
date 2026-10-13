# LifeAtlas

A private family archive: capture a loved one's voice, stories, photographs and places; explore them as a living life story; turn them into printed heirlooms; and prepare letters for the future.

This repository is **Part One** — a complete, working local demonstration. Everything runs in your browser with a fictional sample family (the Ellises). Nothing is sent, charged, printed, emailed or backed up, and every screen says so.

## Run it

Requires Node 20.9 or later. No accounts, keys or services are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Good places to start:

| Where | What you'll see |
| --- | --- |
| `/` | The public site (designed in the PR #2 refresh) |
| `/demo` | Margaret Ellis's fictional archive in the family viewer |
| `/app` | The organizer's studio |
| `/demo/control-center` | Switch between family members' views, simulate events, reset |
| `/app/heirlooms/book-builder` | Design a printed book, turn its pages, print a PDF proof |
| `/app/together` | A pass-the-phone holiday session with a printable booklet |
| `/future/open/example-opening` | What opening a future letter feels like |

Your own recordings and edits are saved in this browser (IndexedDB). **Settings → Erase demo data** or **Control center → Reset demo** restores the sample family.

## Check it

```sh
npm run typecheck   # TypeScript, strict
npm run lint        # ESLint incl. React compiler rules — currently 0 errors, 0 warnings
npm test            # 86 unit, service and component tests (Vitest)
npm run build       # Production build
npm run test:e2e    # 14 browser tests (Playwright), desktop + phone, against the production build
npm run check       # typecheck + lint + test + build
```

For browser tests, install Chromium once with `npx playwright install chromium`, or point `PLAYWRIGHT_CHROMIUM_PATH` at an existing Chromium.

## How it's built

- **Next.js 16** (App Router, Turbopack), **React 19.2**, **TypeScript** (strict), **Tailwind CSS 4**.
- **One switch between demo and real services.** Screens call `services()` from `src/services/factory.ts` and never import a provider SDK. Every contract in `src/services/contracts` has a mock implementation (`src/services/mock`) and a production stub that returns a typed `not_configured` result. Part Two replaces stubs one service at a time.
- **Domain first.** Models, Zod schemas, state machines, permission rules and pricing (integer cents) live in `src/domain` and are covered by unit tests.
- **Local persistence.** A Zustand store (`src/store/demo-store.ts`) persists to IndexedDB with debounced saves that flush when the tab is hidden or closed. Media blobs live in their own store.
- **Honest by construction.** Payment, delivery and preservation states that need a real provider can't be reached from the demo; the state machines and tests enforce it.

```
src/
  app/            routes — (marketing), app (studio), view, contribute, gift, future, checkout, proof, (ops)/demo
  components/     UI by area — studio, capture, explore, heirlooms, viewer, marketing, ui
  domain/         models, schemas, workflows (state machines), policies, commerce, media validation
  services/       contracts, mock adapters, production stubs, factory
  store/          local database + persistence
  data/           sample family fixtures, question library, catalog, marketing copy
e2e/              Playwright specs
docs/             design, status, data model, integrations, QA, security & privacy
```

## Documentation

- [Implementation status](docs/IMPLEMENTATION_STATUS.md) — every route and feature: implemented, demo-only, or Part Two
- [Design system](docs/DESIGN_SYSTEM.md) and the [design refresh notes](docs/design/README.md)
- [Data model](docs/DATA_MODEL.md)
- [Integrations for Part Two](docs/INTEGRATIONS_PART_TWO.md) — what each real service needs, in order, with security notes
- [QA checklist](docs/QA_CHECKLIST.md) — what was verified and how, plus known limitations
- [Security & privacy decisions](docs/SECURITY_PRIVACY_DECISIONS.md)

## About the sample content

The Ellis family is fictional. Sample narration is synthesized speech (Kokoro-82M, Apache-2.0) and is labelled as such; sample artwork is illustrative. Please don't use the demo for irreplaceable material — it isn't a backup.
