# Architecture

OurLifeCapsule is a Next.js App Router application that runs entirely in the browser today. It is built so that real services can replace local ones **one at a time** without rewriting screens.

## Layers

```
src/app          Routes. Thin: read data with hooks, call services(), render components.
src/components   UI by area — site (marketing), capture, explore, studio, heirlooms, future, contribute, ui.
src/domain       The rules. Pure TypeScript, unit-tested, no React and no I/O.
src/services     Contracts (interfaces), mock adapters (work today), production stubs (not_configured).
src/store        The local database: a Zustand store persisted to IndexedDB, plus migrations.
src/data         Sample capsules, the question library, the product catalog, marketing copy.
src/config       Brand and connected-service configuration.
e2e              Playwright specs against the production build.
```

### Rules live in `src/domain`

| Module | Decides |
| --- | --- |
| `policies/permissions.ts` | Roles and capabilities (read, add, edit, invite, export, delete, billing); who may see each memory (`privacyAdmits`, `canViewMemory`); what may be printed or exported. The in-app and public permission tables are rendered from it. |
| `commerce/plans.ts` | Plans, entitlements (capsule allowance, storage, keepsake discount), launch prices in cents. |
| `commerce/pricing.ts` | Every quote: lines, member discount, promotions, credit, itemised book and box options. Shipping and tax stay `null` until a provider exists. |
| `commerce/promotions.ts`, `referrals.ts` | One evaluator for codes, founder offers, referral rewards, free periods and giveaways. A giveaway can't activate without a recorded legal review. |
| `commerce/fulfillment.ts` | Ready-made kit vs made-to-order, and what must exist before a personalised item can be ordered. |
| `future-ladder.ts`, `future-release.ts` | Where a letter for the future really is (draft → saved → stored → scheduled → attempted → delivered/failed), and how its opening is described. |
| `invitations.ts` | The five things every invitation explains: who, what, the ask, the cost, the use. |
| `timeline.ts`, `capsule-kinds.ts`, `onboarding.ts`, `dashboard.ts` | Timeline ordering with approximate dates and milestones; couple/family/personal/parent/child behaviour; onboarding and dashboard logic. |
| `media/` | Byte-level validation of photos, audio and video; EXIF dates are read and *offered*, never applied. |
| `workflows/state-machines.ts` | Allowed transitions for memories, invitations, orders and letters. Provider-only states can't be reached from the demo. |

### Services: one switch between demo and real

Screens call `services()` from `src/services/factory.ts` and never import a provider SDK. Each contract in `src/services/contracts/index.ts` returns a `ServiceResult` — `ok`, `error` (with a plain-language message) or `not_configured`. In demo mode every contract has a mock in `src/services/mock` that really works against the local database; in production mode `src/services/adapters/production.ts` returns `not_configured` until the real adapter is written.

`src/config/integrations.ts` records which real services are connected (all `false` today). The UI reads it to decide what it may claim — a letter can't read "Scheduled" unless `futureDelivery` is connected.

### Persistence

- The store (`src/store/demo-store.ts`) holds the whole demo database in memory and saves it to IndexedDB (`lifeatlas-demo`) with a short debounce. Saves also flush when the tab is hidden or closed.
- Actions whose loss would hurt — saving a memory edit, the bag, placing an order, accepting a gift — **write through** with `flushSave()` before they report success.
- Media blobs live in a separate object store; records hold ids.
- `src/store/migrate.ts` upgrades older saved data: it reads stored catalog and sample versions *before* filling defaults, merges new sample capsules, and never overwrites the customer's own content.
- If IndexedDB is unavailable (private windows, blocked storage), the app says so and keeps working in memory.

### Export and restore

The export builder (`src/services/mock/export.ts`) produces a ZIP (records, media, an offline HTML page), an offline page alone, or a JSON manifest (`lifeatlas.archive` schema). Exports include only what the person exporting may see. Restore (`src/services/mock/restore.ts`) validates the manifest, sniffs every file's bytes, and recreates capsules without overwriting anything; restored stories start with print permission off.

## Honesty rules (enforced in code, not just copy)

1. **No money is ever charged.** Checkout has no card fields; orders are `mock_uncharged`; receipts say "Charged: $0.00".
2. **Nothing is "scheduled", "sent", "shipped" or "backed up"** unless the matching integration exists; simulated lifecycle steps say "· demo" or "· simulated".
3. **Personalised products wait for content and a proof.** A box with a book, letters, prints, engraving or an archive drive is made to order and can't go in the bag until what goes inside exists.
4. **No unreviewed promotion runs.** The every-10th giveaway is a draft that can't be activated without a legal review.
5. **Dates and transcripts are never invented.** Approximate dates stay approximate; camera dates are suggestions; transcripts are typed or absent.
6. **Contributors never pay.** Invitations say so, and plan entitlements make contributors and viewers unlimited.

## Key decisions

| Decision | Why |
| --- | --- |
| Technical identifiers keep their original names (`lifeatlas-demo`, `lifeatlas.archive`, `lifeatlas.*` keys, `NEXT_PUBLIC_LIFEATLAS_MODE`, the stored role id `organizer`) | Renaming would orphan people's saved data and earlier exports. User-facing text comes from `src/config/brand.ts` and role labels ("Editor"). |
| Public previews read fixed sample fixtures (`src/components/site/samples.ts`), never the visitor's store | Marketing pages must look the same for everyone and never leak a visitor's own content. |
| "Only me" is visible to the author and the owner only; editors don't see it | Private has to mean private. The owner answers for exports and deletion, so they keep visibility. |
| Plates (illustrations) are served from a cached `/plates/[id]` route | Inline SVG was ~21 KB per use. |
| Permissions are predicates, not middleware | They drive the UI today and are the specification the server must enforce later (see `docs/SECURITY_PRIVACY_DECISIONS.md`). |
