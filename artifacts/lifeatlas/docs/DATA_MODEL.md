# Data model

Types live in `src/domain/models` (one file per area, re-exported from `index.ts`). Input validation uses Zod schemas in `src/domain/schemas`. The shapes are designed to map onto relational tables in Part Two; IDs are opaque strings and timestamps are ISO 8601.

## The local database

In Part One the whole model is one `DemoDatabase` object (`src/domain/models/index.ts`), seeded from fixtures in `src/data/fixtures` and stored in IndexedDB:

| IndexedDB store | Holds |
| --- | --- |
| `lifeatlas-demo` › `state` | The `DemoDatabase` document (`schemaVersion: 3`). A version mismatch reseeds rather than misreading old data. |
| `lifeatlas-demo` › `blobs` | Recorded audio and uploaded photos, keyed by media id; draft recordings and photos keyed `draft-audio:<key>` / `draft-photo:<key>:<n>` |

The Zustand store (`src/store/demo-store.ts`) exposes `mutate(recipe, audit?)`. Every mutation can append an `AuditEvent` (capped at 300). Saves are debounced (~220 ms) and flushed when the tab is hidden or closed. Actions that are followed by a new tab or a reload — switching identity, saving an heirloom design, keeping a holiday-session answer — write immediately.

**Adding collections without wiping data.** When a newer build adds a collection (as `captureDrafts`, `gatherings` and `letterDrafts` were), saved data from an older build loads with the missing collections filled in empty (`withNewFields`). `schemaVersion` changes only for incompatible reshapes, because a mismatch reseeds.

**When saving fails**, the store records a plain-language `saveError` (out of space, storage blocked, storage not responding — never the browser's raw message) and the studio and invitation pages show a storage alert with *Try saving again*. If IndexedDB is unavailable altogether, `persistence` is `memory` and the alert says nothing will be kept.

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

### Unfinished work — `drafts.ts`
- **CaptureDraft** — an answer in progress, one per capsule and person (or invitation): words, title, date, place, and pointers to a draft recording and photos in the blob store. Offered back with *Pick up where I left off*; removed when the answer is kept or skipped. Capped at 30.
- **GatheringSession** — a holiday session: occasion, guests, question ids, current question `index` and speaker `turn`, kept answers (memory ids) and `in_progress` / `finished`. Saved after every step; `/app/together?session=<id>` reopens it. Capped at 20.
- **LetterDraft** — letter-composer writing that isn't a saved letter yet (it needn't pass validation): the raw form values, attachments and the letter being edited, if any. Capped at 20.

### Gifts, letters, preservation — `gifting.ts`, `future.ts`, `preservation.ts`
- **Gift** — occasion, recipient, dedication, envelope design, token, status.
- **FutureMessage** — recipient (+ backup), release rule (date, interval or milestone), restrictions, attachments, `snapshotHash` when sealed. Real delivery states (`sealed`, `scheduled`, `delivered`…) are unreachable from the demo.
- **SuccessorDesignation** — name, relationship, scope; never granted access in Part One.
- **PreservationStatus**, **IntegrityCheck**, **ExportJob**, **ArchiveManifest** (`lifeatlas.archive` v1 with per-file checksums). Each memory's `date` carries the full fuzzy date (`season`, `decade`, `lifeStage` and `note` were added within v1 as optional fields), so a restore brings dates back exactly; older exports restore to the year.

**Restoring.** `export.inspectArchive(file)` reads a `.zip` or `.json` export, validates the manifest and re-hashes every file against its recorded SHA-256 without changing anything. `export.restoreArchive(token)` then creates a **new** capsule — never merging or overwriting — reusing people and places already on the device, linking the app's own copies of sample media, and skipping files that fail their checksum. Restored stories have `attribution.via: "restored"` and print consent switched off until it's given again.

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

`src/domain/policies/permissions.ts`: `roleCapabilities`, `can()`, `canViewMemory()`, `canEditMemory()`, `isPrintEligible()`, `isExportEligible()`, `membershipRole()`. A person's role on a capsule comes from their active **memberships** (highest role wins; a successor designation alone grants nothing), so a change on the Family page applies to the viewer at once. Opening an invitation adds the person to People if they're new and gives them the invited role. Private memories are visible to owners, organizers and their author; only approved, print-consented memories can go in a book. Tested in `permissions.test.ts`.

## Money

All amounts are integer cents. `src/domain/commerce/pricing.ts` validates every amount, never invents shipping or tax (`null` until a provider exists), and prices books by material, trim, page signatures and copies.

## Moving to a server (Part Two)

- One table per entity above; `DemoDatabase` arrays become tables with foreign keys (`capsuleId`, `personId`, `orderId`…).
- Media blobs move to private object storage; `MediaAsset.storage` already distinguishes location.
- Audit events become append-only and server-written.
- Fixtures stay as seed data for a public demo tenant only.
