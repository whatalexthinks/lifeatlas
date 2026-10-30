# OurLifeCapsule launch readiness — October 30, 2026

## Commercial direction (proposed, not for collecting payments yet)
- Individual/Couples digital capsule: **$59 one time**, one capsule, **2 GB proposed cloud-media quota**, five years of hosted access beginning after successful paid activation.
- Family: **$149 one time**, up to five capsules, **10 GB proposed pooled quota**, five years of hosted access.
- Invited contributors do not pay. No automatic card rebilling or subscription.
- Optional physical keepsake kit **from $229**, printed book **from $99**. Prices are provisional; manufacturing quotes, freight, returns, packaging, and fulfillment must be validated.
- An honest fixed term avoids promising permanent hosting funded by a one-time fee. Export must stay available; offer future extension only as an explicit new purchase. Specify hosting-expiry, content-retention, and export/grace-period policies before taking money.

## Customer journey to deliver
1. Landing page shows specific benefits, price, real sample capsule, and clearly labeled box imagery.
2. Visitor selects personal, couples, parent, child, or family story.
3. User sees a free local story exercise and chooses what to preserve.
4. Sign in; draft is preserved, users review exactly what the fixed-price capsule includes.
5. Server-side one-time Stripe Checkout uses trusted product IDs and prices; no client-controlled amounts.
6. Webhook verifies successful payment, atomically creates order and entitlement, attaches it to authenticated user; idempotent and retriable. Never grant by return URL alone.
7. Create/activate capsule, first question, first audio or photo memory.
8. Celebrate non-competitive progress milestones at 1, 3, 7, 15, 30 memories; show next useful action.
9. Invite family through secure token, consent and per-capsule permission checking. They contribute free.
10. Offer physical product after initial meaningful content; physical orders need proof, shipping quote, tax, real order states, and fulfillment provider, with no pretend shipments.
11. Provide export, support, privacy, recovery, and five-year expiry information in account settings.

## Production blockers discovered in main
- `/checkout/preview` is still a simulated, uncharged order flow. No payment webhook or server-authoritative entitlements.
- Old billing screens, gifting, promotions, tests, FAQs and multiple marketing pages still speak of subscriptions or annual memberships. Must migrate thoroughly before release. Old sample subscriptions and catalog data require a versioned compatibility migration.
- `App.tsx` has Clerk account gates and `/api/account/snapshot` sync logic, but the repository docs still describe the older local demo. Inspect the API endpoint, upload storage, authorization, multi-device concurrency and restore behavior; do not rely on documentation alone.
- The editor has draft persistence and client-side roles. Collaborator authorization must be enforced at the API on every read/write. Cross-account invite acceptance and token expiry need testing.
- Cloud object storage must be private and media metadata must be consistent with the saved capsule; do not store large media blobs in JSON account snapshots.
- Physical kits are conceptual. Obtain prototype photos, approved material spec, packaging dimensions, manufacturer cost, fulfillment SLA, returns terms and shipping/tax integration before accepting orders.
- Privacy policy, account deletion, exported media, recoverability, service term and support contact must be verified.

## Current branch scope
This branch begins the commercial migration and adds small, content-based milestone progress to the capsule overview. It is **not** a claim that the product is production-ready. An integration build, end-to-end test suite, security review and live Stripe test mode checks are required before merge and launch.

## Unit economics guardrail
For a $59 digital purchase, reserving $10 for 5 years of storage, bandwidth, and incident/support costs plus approximately $2.01 card fees leaves about $46.99 before marketing, development, tax and overhead. This is only a scenario, not a verified hosting quote. Physical kit margin must use real supplier cost plus packaging, freight, payment fees, returns, and damaged shipments.

## Suggested product imagery shot list
1. Linen archive kit: warm ivory linen-wrapped rigid box, debossed wordmark, 52 prompt cards, labeled envelopes, acid-free sleeves; front 3/4 hero, top-down open box, side materials macro.
2. Dark forest-green heirloom kit: matte green linen lid, restrained antique gold foil, cream inserts, no imaginary electronics; same three angles.
3. Walnut upgrade: solid-wood or veneered sample if manufacturer confirms, lid engraving, fitted compartments; avoid stating wood type before quotation.
4. Printed memory book: cover, spine, interior spread showing sample stories and photos; clearly illustrative and not fabricated real testimonials.

Do not label generated product concepts as photographs of inventory. Publish only physically deliverable configurations.
