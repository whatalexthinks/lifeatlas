# Implementation status — Part One

Legend:

- ✅ **Implemented** — works locally with real logic (validation, state machines, storage, files).
- 🟡 **Demo-only** — the full experience works, but the step that touches the outside world is simulated and labelled on screen.
- 🔌 **Part Two** — needs a real provider; the contract exists and the production stub returns `not_configured`.

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
| Social share image (`opengraph-image`) | ✅ | Typographic brand card, prerendered at build; never uses a family photo |

## Studio (`/app`)

| Area | Status | Notes |
| --- | --- | --- |
| Home dashboard | ✅ | |
| Capsule wizard `/app/capsules/new` (resumable draft) | ✅ | |
| Capsule overview, memories, timeline, map, gallery, voices, chapters | ✅ | |
| Questions: 85-question library, queue, custom questions | ✅ | |
| People, privacy, edit, export per capsule | ✅ | |
| Gather a memory: record (MediaRecorder), type, add photos | ✅ | Files validated by type, size and magic bytes; previews local |
| Answers in progress: words, recording and photos autosave; *Pick up where I left off* | ✅ | Per capsule and person/invitation; listed on the studio home |
| Memory editor: unsaved-changes guard, undo deletion, *Recently deleted* | ✅ | |
| Automatic transcription | 🔌 | Manual transcripts work; nothing is ever invented |
| Invitations & review queue: approve, return with a note, don't include | ✅ / 🟡 | Links work in this browser; **no email/SMS is sent**. Opening an invitation adds the person to the family |
| Family roles across capsules | ✅ / 🟡 | Roles come from memberships, so changes apply everywhere at once; access is demonstrated, not enforced (no accounts) |
| *Preview as* any family member | ✅ / 🟡 | Banner and one-click way back; a demonstration, not a security boundary |
| Letters Through Time: compose, photos, voice note, video message, stories given with the letter, occasions (date, years, a particular year, milestones incl. anniversary), seal / unseal, preview opening, delete | ✅ / 🟡 | Seal stores a real SHA-256 fingerprint; each letter shows its delivery ladder; **never scheduled for delivery** |
| Memory visibility: Family, Selected people, Owner & editors, Only me | ✅ / 🟡 | Enforced in every view, export and restore on this device; server enforcement arrives with accounts |
| Unfinished letter writing autosaves (even before it's valid) and can be restored or discarded (undoable) | ✅ | |
| Successor designation | 🟡 | Saved locally; no one is contacted or verified |
| Heirlooms — book builder, spread preview, PDF proof | ✅ | Proof prints at trim size via the browser; zero text overflow verified at all three trims |
| Heirlooms — keepsake box builder and printable two-sheet proof with pre-flight checks | ✅ / 🟡 | Burial-rated capsule shown as unavailable concept |
| Orders: lifecycle, proof approval, cancel, refund request, demo invoice | ✅ / 🟡 | Nothing printed, shipped or charged |
| Plan & billing, Living Archive renewal preview | 🟡 | Card details are never collected |
| Preservation: storage status, persistent-storage request, local integrity check, export | ✅ | Integrity check really re-hashes device files |
| Restore from an export (.zip / .json) | ✅ | Every file re-hashed against the manifest first; restores as a **new** capsule; damaged files named and skipped |
| Storage problems (blocked, private window, out of space) | ✅ | Plain-language alert with *Try saving again*, in the studio and on invitations |
| Cloud backup, restore drill | 🔌 | Shown as **Not connected**, never green |
| Settings: profile, theme, text size, motion, notifications, erase data | ✅ | Notification choices saved; no email sent |
| Help: searchable answers, support note | ✅ / 🟡 | Note saved for the operations demo; not sent |
| Holiday session: choose people and questions, pass the device, booklet | ✅ | Guest answers go to review |
| Holiday session: every step saved; pause and resume (`?session=`), sessions listed with Resume / Booklet / Remove | ✅ | A half-finished answer comes back too |

## Family-facing journeys

| Area | Status | Notes |
| --- | --- | --- |
| Viewer `/view/[capsuleId]` — cover, timeline, map, stories, photos, voices, letters | ✅ | Paper/night tone remembered per device |
| Viewer finder: search (words, places, people), chapter / decade / kind filters, *Saved* bookmarks | ✅ | Header search on every archive page; `?q=` and `?saved=1` link to results |
| Contributor `/contribute/[token]` and recording | ✅ | No account needed |
| Contributor *Your stories*: status of each story; returned stories show the note and can be changed and sent again | ✅ | |
| Gift opening `/gift/[token]` and first memory | ✅ | Shows what the gift includes; taking it up starts one prepaid, non-renewing year (demo) |
| Future letter opening `/future/open/[token]` | ✅ / 🟡 | Example and previews only |
| Bag `/checkout/bag` | ✅ | Several lines (a plan plus keepsakes), quantities, billing interval, Family keepsake discount |
| Checkout `/checkout/preview` → `/checkout/complete` | 🟡 | Creates an uncharged order; no card fields exist |

## Operations demo

| Area | Status | Notes |
| --- | --- | --- |
| `/demo/control-center`: personas, simulated events, data download, reset | ✅ | Demonstration tool only |
| `/demo/operations`: overview + funnel, orders, support, catalog editor, integrations, flags, audit log | ✅ | Built from this device's data; not real staff access |
| `/demo/style-guide` | ✅ | Live tokens with measured contrast, components, honesty patterns, objects; light/evening preview |

## Platform

| Area | Status | Notes |
| --- | --- | --- |
| 19 typed service contracts (incl. drafts & sessions), mock adapters, production stubs | ✅ | `src/services` |
| Domain models, Zod schemas, state machines, permission policies, pricing in cents | ✅ | `src/domain` |
| IndexedDB persistence with debounced saves, flush on hide/unload | ✅ | Data stays on the device; new collections load into older saved data without wiping it |
| Accounts, database, server APIs | 🔌 | See [INTEGRATIONS_PART_TWO.md](INTEGRATIONS_PART_TWO.md) |
| Tests: 109 unit/service/component, 33 browser (full journey, keyboard, tablet, WCAG 2.2 AA audits) | ✅ | See [QA_CHECKLIST.md](QA_CHECKLIST.md) |
