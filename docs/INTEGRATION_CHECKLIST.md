# Integration checklist

Each real service replaces a mock **one at a time**. Nothing below is needed — or should be provided — for the demo. For each contract's provider choices and security notes, see [Integrations in depth](INTEGRATIONS_PART_TWO.md).

For every service:

- [ ] Implement the contract in `src/services/contracts/index.ts` **server-side** (route handlers or server actions). The browser calls our API, never a provider SDK holding a secret.
- [ ] Replace its stub in `src/services/adapters/production.ts`.
- [ ] Make the mock's tests in `src/services/mock/*.test.ts` pass against the real adapter (they describe the required behaviour).
- [ ] Set its flag in `src/config/integrations.ts` to `true` **only once it works end to end** — the UI uses these flags to decide what it may claim.
- [ ] Add its variables to the deployment (names in `.env.example`; server secrets never use `NEXT_PUBLIC_`).

## 1. Accounts and database — `integrations.accounts`

- [ ] Auth provider with passkeys/MFA; HTTP-only, secure, same-site sessions; rate-limited sign-in.
- [ ] Database for capsules, memories, people, memberships, invitations, orders.
- [ ] Every read and write authorised on the server using the predicates in `src/domain/policies/permissions.ts` (including "selected people" and "Only me").
- [ ] Append-only, server-written audit events.
- [ ] Import path from a browser export (`lifeatlas.archive` manifest) so demo users keep their work.

## 2. Media storage and backups — `integrations.cloudStorage`

- [ ] Private bucket, no public URLs, short-lived signed URLs per viewer, managed encryption keys.
- [ ] Server-side byte sniffing (port `src/domain/media`), size and duration limits, malware scanning, location stripping unless the family opts in.
- [ ] Independent backups in a different provider and region, scheduled integrity audits, a tested restore drill.
- [ ] Only then: letters may show "Uploaded and securely stored", and preservation may show a verified state.

## 3. Invitations — `integrations.email`

- [ ] Transactional email (and optionally SMS) from a verified domain (SPF, DKIM, DMARC).
- [ ] High-entropy, expiring, revocable tokens stored hashed.
- [ ] Message bodies built from `explainInvitation()` — who, what, the ask, the cost (free), the use — with no story content in the email.
- [ ] Only then: invitation status may read "Sent".

## 4. Payments — `integrations.payments`

- [ ] Stripe Checkout (or equivalent) so card data never touches our servers.
- [ ] Prices and discounts computed server-side from the catalog and `quoteCart()`, never trusted from the browser.
- [ ] Verified webhooks; idempotent order creation; subscriptions with renewal, cancellation at period end, and receipts.
- [ ] Gifted plans as one prepaid term that never auto-renews.
- [ ] Promotions: server-side redemption limits per customer and overall; referral reward caps (`maxRewardsPerYear`) enforced.
- [ ] Legal review recorded before any giveaway is activated.

## 5. Transcription and places

- [ ] Speech-to-text only with explicit per-recording consent, from a provider that doesn't train on customer data.
- [ ] Geocoding at city or landmark precision by default.

## 6. Printing and shipping — `integrations.printFulfillment`

- [ ] Print vendor and carrier; shipping and tax quoted server-side (the UI shows them only once real).
- [ ] Made-to-order items sent to print only from an approved proof; `boxBlockers()` enforced server-side.
- [ ] Ready-made kits ship after payment; tracking numbers shown when real.
- [ ] Addresses kept only as long as fulfilment needs them.

## 7. Future delivery — `integrations.futureDelivery` (last)

- [ ] Legal and continuity review completed.
- [ ] Immutable sealed snapshots stored in two places; durable scheduled jobs with retries and delivery logs.
- [ ] Verified recipients, re-confirmed on a schedule; a verified successor process with a waiting period.
- [ ] Cancellation and editing rules, access recovery and data portability documented.
- [ ] Only then: letters may read "Scheduled", and the delivery ladder's later steps become reachable. Never promise a letter will arrive decades from now.
