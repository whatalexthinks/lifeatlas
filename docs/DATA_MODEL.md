# Data model

Types live in `src/domain/models` (one file per area, re-exported from `index.ts`). Input validation uses Zod schemas in `src/domain/schemas`. The shapes are designed to map onto relational tables in Part Two; IDs are opaque strings and timestamps are ISO 8601.

## The local database

In Part One the whole model is one `DemoDatabase` object (`src/domain/models/index.ts`), seeded from fixtures in `src/data/fixtures` and stored in IndexedDB:

| IndexedDB store | Holds |
| --- | --- |
| `lifeatlas-demo` › `state` | The `DemoDatabase` document (`schemaVersion: 3`). A version mismatch reseeds rather than misreading old data. |
| `lifeatlas-demo` › `blobs` | Recorded audio and uploaded photos, keyed by media id |

The Zustand store (`src/store/demo-store.ts`) exposes `mutate(recipe, audit?)`. Every mutation can append an `AuditEvent` (capped at 300). Saves are debounced (~220 ms) and flushed when the tab is hidden or closed.

## Entities

### People and access — `people.ts`
- **User**, **Profile**, **AccountPreferences** (theme, text size, motion, notification intents).
- **Persona** — demo-only identities for the persona switcher.
- **Person** — someone in the family (birth year, city-level birthplace only, short bio). **Relationship** links two people.
- **FamilyGroup** — a collection of capsules.
- **CapsuleMembership** — `role` per person per capsule: `owner`, `organizer`, `storyteller`, `contributor`, `viewer`, `successor`. `enforcement: "simulated"` marks that access isn't enforced without accounts.

### Capsules and memories — `capsule.ts`
- **Capsule** — one life: subject, theme, cover, default privacy, chapter order, status (`draft` → `active` → `archived` / `deletion_pending`).
- **Memory** — title, narrative, `FuzzyDate`, place, chapter, people, photos, optional audio, attribution, privacy (`private` / `organizers` / `family`), **consent** (`print`, `export`, `share`) and status (`draft`, `submitted`, `under_review`, `approved`, `returned`, `declined`). Soft-deleted with `deletedAt`; revisions kept.
- **FuzzyDate** — precision `day` | `month` | `season` | `year` | `circa` | `decade` | `life_stage` | `unknown`, so "around 1965" is first-class.
- **MediaAsset** — image or audio, MIME, size, dimensions/duration, caption, alt text, consent, SHA-256 checksum for device files, waveform peaks, and `sampleNotice` for synthetic/illustrative samples.
- **Place** — name, point, **precision** (stored internally; displayed rounded) and visibility.
- **Question**, **QuestionCollection**, **QuestionAssignment** (a capsule's queue), **Transcript** (manual today).

### Collaboration — `collaboration.ts`
- **Invitation** — token, recipient, channel, message, status history. Statuses `sent`/`accepted`/`expired`/`revoked` are provider-only; the demo uses `simulated_sent`, `accepted_demo`, etc.
- **Contribution**, **ShareGrant**.

### Gifts, letters, preservation — `gifting.ts`, `future.ts`, `preservation.ts`
- **Gift** — occasion, recipient, dedication, envelope design, token, status.
- **FutureMessage** — recipient (+ backup), release rule (date, interval or milestone), restrictions, attachments, `snapshotHash` when sealed. Real delivery states (`sealed`, `scheduled`, `delivered`…) are unreachable from the demo.
- **SuccessorDesignation** — name, relationship, scope; never granted access in Part One.
- **PreservationStatus**, **IntegrityCheck**, **ExportJob**, **ArchiveManifest** (`lifeatlas.archive` v1 with per-file checksums).

### Commerce and heirlooms — `commerce.ts`, `heirloom.ts`
- **Product** with **Price** in integer cents and `isTestPrice: true`; availability `available_demo` / `coming_soon` / `not_available`.
- **Cart**, **CheckoutSession**, **Order** (status machine below), **Invoice** (`demo_uncharged`), **Refund**, **Subscription**.
- **HeirloomConfiguration** with **BookConfiguration** or **BoxConfiguration**; **PrintProject** with versioned **PrintProof**s.

### Operations — `ops.ts`
- **Notification**, **AuditEvent**, **AnalyticsEvent** (local only), **SupportRequest**, **FeatureFlag** (all locked off).

## State machines

`src/domain/workflows/state-machines.ts` defines every allowed transition; services refuse anything else. Highlights:

- **Memory:** `draft → submitted → under_review → approved | returned | declined`. An organizer may publish their own draft directly. Declined stories can't jump to approved.
- **Order:** `preview → paid_mock → proof_required → ready_for_fulfillment → printing_mock → shipped_mock`; canceled and refunded are terminal.
- **Payment:** the demo can only reach `mock_uncharged`; `confirmed` and `refunded` are provider-only.
- **Preservation health:** a `verified`/`degraded`/`failed` state requires evidence (`checkedAt` + provider); without it only `unconfigured`/`checking` are honest.

## Permissions

`src/domain/policies/permissions.ts`: `roleCapabilities`, `can()`, `canViewMemory()`, `canEditMemory()`, `isPrintEligible()`, `isExportEligible()`. Private memories are visible to owners, organizers and their author; only approved, print-consented memories can go in a book. Tested in `permissions.test.ts`.

## Money

All amounts are integer cents. `src/domain/commerce/pricing.ts` validates every amount, never invents shipping or tax (`null` until a provider exists), and prices books by material, trim, page signatures and copies.

## Moving to a server (Part Two)

- One table per entity above; `DemoDatabase` arrays become tables with foreign keys (`capsuleId`, `personId`, `orderId`…).
- Media blobs move to private object storage; `MediaAsset.storage` already distinguishes location.
- Audit events become append-only and server-written.
- Fixtures stay as seed data for a public demo tenant only.
