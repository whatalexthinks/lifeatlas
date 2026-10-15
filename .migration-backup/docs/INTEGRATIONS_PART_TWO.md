# Integrations for Part Two

Part One deliberately connects to nothing. This document lists what each real service needs, the order to connect them, and the security implications of each step. **No credentials are needed or requested for Part One.**

## How swapping works

Screens call `services()` (`src/services/factory.ts`). With `NEXT_PUBLIC_LIFEATLAS_MODE=production`, every service comes from `src/services/adapters/production.ts`, which returns a typed `not_configured` result instead of throwing. Connect one service at a time:

1. Implement the contract in `src/services/contracts/index.ts` against the provider, **server-side** (route handlers or server actions). The browser should call your API, never a provider SDK with secrets.
2. Replace that service's stub in `createProductionServices()`.
3. Keep the mock for local development and tests; the Vitest service tests in `src/services/mock/services.test.ts` describe the behaviour the real adapter must match.
4. Turn on the matching feature flag (`src/data/fixtures/index.ts`, all locked off today) only when its dependency is real.

## The contracts

| Contract | Covers | Part Two provider | Mode today |
| --- | --- | --- | --- |
| `auth`, `account` | Sign-in, sessions, MFA, profile, deletion | Auth provider + server sessions | Personas on one device |
| `capsules` | Capsules, memories, places, questions, roles | Postgres (or similar) via server API | IndexedDB |
| `media` | Photos and recordings | Private object storage, signed URLs, KMS | IndexedDB blobs |
| `transcription` | Speech to text | Transcription API, opt-in per recording | Manual transcripts only |
| `communications` | Invitation email/SMS, contributions | Transactional email + SMS | Copy-link previews |
| `billing`, `orders`, `gifts` | Checkout, renewals, refunds, gifts | Stripe (Checkout + webhooks) | Uncharged demo orders |
| `fulfillment`, `heirlooms` | Proofs, print, ship, tax | Print vendor, carrier, tax service | Local proofs, simulated lifecycle |
| `geocoding` | Place search, tiles | Geocoder + tile provider | Built-in city list, offline map |
| `export` | Portable archives | Server-side job + storage | Built in the browser (works today) |
| `preservation` | Backups, integrity audits, restore drills, successors | Secondary storage in another region/provider | Local integrity check only |
| `futureDelivery` | Scheduled letters | Scheduler + legal/continuity plan | Drafts and demo seals |
| `analytics` | Product metrics | Consent-based, privacy-first analytics | Local event log |
| `support` | Help requests | Support inbox | Saved locally for the ops demo |
| `operations` | Staff tools | Admin API behind staff SSO | Demo pages |

## Recommended order

1. **Accounts and database** (`auth`, `account`, `capsules`). Everything else depends on identity and server-side authorization.
   - *Security:* enforce roles on the server for every read and write (the `permissions.ts` predicates are the spec). Use HTTP-only, secure, same-site cookies; offer passkeys and MFA. Rate-limit sign-in. Audit events become server-written and append-only.
2. **Media storage** (`media`) with **independent backups** (`preservation`).
   - *Security:* private bucket, no public URLs, short-lived signed URLs per viewer, server-side encryption with managed keys, server-side MIME sniffing (port `validateFileDeep`), size limits, malware scanning, and EXIF/location stripping unless the family opts in. Backups in a different provider and region, with scheduled integrity audits and restore drills — only then may the UI show a verified state.
3. **Invitations** (`communications`).
   - *Security:* single-use or expiring, high-entropy tokens, stored hashed; revocation; verified sending domain (SPF/DKIM/DMARC); never put story content in email bodies.
4. **Payments** (`billing`, `orders`, `gifts`).
   - *Security:* Stripe Checkout so card data never touches LifeAtlas; verify webhook signatures; idempotent order creation (the mock already refuses double completion); server-side prices from the catalog, never from the client; refunds by a human.
5. **Transcription and place search** (`transcription`, `geocoding`).
   - *Security:* explicit per-recording consent before audio leaves the platform; providers that don't train on customer data; city-level place precision by default.
6. **Printing and shipping** (`fulfillment`, `heirlooms`).
   - *Security:* send only the approved proof's assets; shipping addresses retained only as long as fulfillment needs them; carrier and tax quotes server-side.
7. **Future delivery** (`futureDelivery`) — last, and only after legal review.
   - *Requirements:* immutable sealed snapshots stored in two places, verified recipients re-confirmed on a schedule, a verified successor process with a waiting period, and a continuity plan for the company itself. No prepaid delivery should be sold before these exist.

## Credentials Part Two will need

Listed so nothing is a surprise later — **do not provide them for Part One**. Names match `.env.example`.

- Database URL; auth provider issuer/client id/secret; session secret.
- Object storage bucket, region, KMS key and credentials; a second provider for backups.
- Stripe secret key, webhook secret, publishable key.
- Email and SMS provider keys; verified sending domain.
- Transcription API key.
- Geocoder key and map tile URL.
- Print vendor, shipping carrier and tax service keys.
- Analytics write key (consent-gated).

Server-only secrets must never use the `NEXT_PUBLIC_` prefix.
