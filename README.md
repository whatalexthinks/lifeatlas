# OurLifeCapsule

A private, browser-based place to preserve the stories, voices, photographs and relationships that make a life — for couples, families, and anyone writing their own. Capsules can be explored as a timeline, shared with the people you choose, turned into a printed book or a physical keepsake, and accompanied by letters for the future.

This repository is a **complete, working demonstration**. Everything runs in your browser with fictional sample families. Nothing is sent, charged, printed, emailed or backed up — and every screen says so. Production services (accounts, storage, payments, email, printing, scheduled delivery) are designed behind typed boundaries and listed in the [integration checklist](docs/INTEGRATION_CHECKLIST.md).

> The domain is intended to be **ourlifecapsule.com**; DNS and hosting are not assumed to exist.

## Development setup

Requires **Node 20.9+**. No accounts, keys or services are needed.

```sh
npm ci
npm run dev          # http://localhost:3000
```

No `.env` file is required. [`.env.example`](.env.example) lists the few optional settings used today and the names production will need later (never fill those in for the demo).

Good places to start:

| Where | What you'll see |
| --- | --- |
| `/` | The public site: homepage, `/how-it-works`, `/couples`, `/families`, `/personal`, `/legacy`, `/gifts`, `/physical-capsules`, `/pricing`, `/examples`, `/faq` |
| `/app/capsules/new` | Onboarding — “Whose story would you like to preserve?” |
| `/app` | Your dashboard and capsules |
| `/app/gather` | Answer a question by voice, text, photos or a short video |
| `/app/capsules/cap_us/timeline` | A couple's timeline, with approximate dates, milestones and quick edit |
| `/app/future-messages` | Letters for the future, with an honest delivery ladder |
| `/app/heirlooms/book-builder` · `/capsule-builder` | Design a printed book or a keepsake box, proof it, print a PDF |
| `/checkout/bag` | The bag and a clearly labelled demo checkout — nothing is charged |
| `/app/preservation` | Download everything, and restore from a download |
| `/demo/control-center` | Switch family members' views, simulate events, reset the demo |

Your own recordings and edits are stored in this browser (IndexedDB). **Settings → Erase demo data** or **Control center → Reset demo** restores the sample families; **Settings → Remove sample data** keeps only your own.

## Testing

```sh
npm run typecheck   # TypeScript, strict
npm run lint        # ESLint, including React Compiler rules
npm test            # Vitest: domain rules, services, persistence, export/import, pricing, permissions
npm run build       # Production build
npm run test:e2e    # Playwright against the production build (start it with `npm run build` first)
npm run check       # typecheck + lint + test + build
```

The browser suite covers the full 16-step customer journey (homepage → onboarding → first memory → voice → photos → timeline → invitation → plans → keepsakes → book → export → **close and reopen the browser**), error and recovery paths, sharing and permissions, commerce, keyboard-only use, phone/tablet/desktop layouts, and WCAG 2.2 AA audits with axe.

For browser tests, install Chromium once with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_PATH` to an existing Chromium. `E2E_PORT` picks the port (default 3100); use a fresh port if an old server might still be running.

## How it's built

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Zustand persisted to IndexedDB, Zod. The short version:

- **Screens never talk to providers.** They call `services()`; every contract has a working mock today and a production stub that returns a typed `not_configured` result.
- **Rules live in `src/domain`** — permissions, pricing (integer cents), promotions, fulfilment, the future-delivery ladder, timelines — and are unit-tested.
- **Brand, plans and connected services are configuration**: `src/config/brand.ts`, `src/domain/commerce/plans.ts`, `src/config/integrations.ts`.

See **[Architecture](docs/ARCHITECTURE.md)** for the full picture.

## Documentation

| Document | What it covers |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Layers, data flow, persistence, honesty rules, key decisions |
| [Integration checklist](docs/INTEGRATION_CHECKLIST.md) | Connecting real services, one at a time, with what each must prove first |
| [Integrations in depth](docs/INTEGRATIONS_PART_TWO.md) | Each contract, its provider and its security notes |
| [Known limitations](docs/KNOWN_LIMITATIONS.md) | What is simulated, partial or not built yet |
| [Release-readiness checklist](docs/RELEASE_CHECKLIST.md) | What must be true before real customers |
| [Implementation status](docs/IMPLEMENTATION_STATUS.md) | Route-by-route status |
| [Design system](docs/DESIGN_SYSTEM.md) | Palette, type, motion, components (live at `/demo/style-guide`) |
| [Data model](docs/DATA_MODEL.md) · [Security & privacy](docs/SECURITY_PRIVACY_DECISIONS.md) · [QA checklist](docs/QA_CHECKLIST.md) | Reference |

## About the sample content

The Ellis family and the other sample capsules are fictional. Sample narration is synthesized speech (Kokoro-82M, Apache-2.0) and is labelled as such; sample artwork is illustrative. Please don't use the demo for irreplaceable material — it is not a backup.
