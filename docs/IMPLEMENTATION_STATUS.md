# Implementation status — Part One

Legend:

- ✅ **Implemented** — works locally with real logic (validation, state machines, storage, files).
- 🟡 **Demo-only** — the full experience works, but the step that touches the outside world is simulated and labelled on screen.
- 🔌 **Part Two** — needs a real provider; the contract exists and the production stub returns `not_configured`.
- ⬜ **Not built** — not in this repository yet.

Every route the Part One brief lists returns 200 in the running app (verified by request), and the e2e suite renders each studio, viewer and operations route without page errors.

## Public site

Built in the design refresh (PR #2) — see [design/README.md](design/README.md).

| Area | Status | Notes |
| --- | --- | --- |
| Landing page with playable narration, map explorer, FAQ | ✅ | |
| 22 information pages (`/how-it-works` … `/accessibility`) | ✅ | Policy pages are labelled preview information, not final policies |
| `/pricing` with plan cards | ✅ | Test prices; shows the published catalog |
| `/gifts/build` gift builder | ✅ / 🟡 | Real form + preview; delivery is a link you share yourself |
| `/demo` | ✅ | Redirects to the sample archive |
| `sitemap.xml`, `robots.txt` | ✅ | Public pages only; private routes disallowed and `noindex` |
| Not-found, error and global-error pages | ✅ | Uses this Next version's `retry()` API |
| Social share (Open Graph) image route | ⬜ | Pages have titles/descriptions; no generated image yet |

## Studio (`/app`)

| Area | Status | Notes |
| --- | --- | --- |
| Home dashboard | ✅ | |
| Capsule wizard `/app/capsules/new` (resumable draft) | ✅ | |
| Capsule overview, memories, timeline, map, gallery, voices, chapters | ✅ | |
| Questions: 85-question library, queue, custom questions | ✅ | |
| People, privacy, edit, export per capsule | ✅ | |
| Gather a memory: record (MediaRecorder), type, add photos | ✅ | Files validated by type, size and magic bytes; previews local |
| Automatic transcription | 🔌 | Manual transcripts work; nothing is ever invented |
| Invitations & review queue | ✅ / 🟡 | Links work in this browser; **no email/SMS is sent** |
| Family roles across capsules | ✅ / 🟡 | Guarded role changes; access is demonstrated, not enforced (no accounts) |
| Letters Through Time: compose, attach, voice note, seal | ✅ / 🟡 | Seal stores a real SHA-256 fingerprint; **never scheduled for delivery** |
| Successor designation | 🟡 | Saved locally; no one is contacted or verified |
| Heirlooms — book builder, spread preview, PDF proof | ✅ | Proof prints at trim size via the browser; zero text overflow verified at all three trims |
| Heirlooms — keepsake box builder | ✅ / 🟡 | Burial-rated capsule shown as unavailable concept |
| Orders: lifecycle, proof approval, cancel, refund request, demo invoice | ✅ / 🟡 | Nothing printed, shipped or charged |
| Plan & billing, Living Archive renewal preview | 🟡 | Card details are never collected |
| Preservation: storage status, persistent-storage request, local integrity check, export | ✅ | Integrity check really re-hashes device files |
| Cloud backup, restore drill | 🔌 | Shown as **Not connected**, never green |
| Settings: profile, theme, text size, motion, notifications, erase data | ✅ | Notification choices saved; no email sent |
| Help: searchable answers, support note | ✅ / 🟡 | Note saved for the operations demo; not sent |
| Holiday session: pass-the-device questions, booklet | ✅ | Guest answers go to review |

## Family-facing journeys

| Area | Status | Notes |
| --- | --- | --- |
| Viewer `/view/[capsuleId]` — cover, timeline, map, stories, photos, voices, letters | ✅ | Paper/night tone remembered per device |
| Contributor `/contribute/[token]` and recording | ✅ | No account needed |
| Gift opening `/gift/[token]` and first memory | ✅ | |
| Future letter opening `/future/open/[token]` | ✅ / 🟡 | Example and previews only |
| Checkout `/checkout/preview` → `/checkout/complete` | 🟡 | Creates an uncharged order; no card fields exist |

## Operations demo

| Area | Status | Notes |
| --- | --- | --- |
| `/demo/control-center`: personas, simulated events, data download, reset | ✅ | Demonstration tool only |
| `/demo/operations`: overview + funnel, orders, support, catalog editor, integrations, flags, audit log | ✅ | Built from this device's data; not real staff access |
| `/demo/style-guide` | ⬜ | Tokens and components are documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) instead |

## Platform

| Area | Status | Notes |
| --- | --- | --- |
| 18 typed service contracts, mock adapters, production stubs | ✅ | `src/services` |
| Domain models, Zod schemas, state machines, permission policies, pricing in cents | ✅ | `src/domain` |
| IndexedDB persistence with debounced saves, flush on hide/unload | ✅ | Data stays on the device |
| Accounts, database, server APIs | 🔌 | See [INTEGRATIONS_PART_TWO.md](INTEGRATIONS_PART_TWO.md) |
| Tests: 86 unit/service/component, 14 browser | ✅ | See [QA_CHECKLIST.md](QA_CHECKLIST.md) |
