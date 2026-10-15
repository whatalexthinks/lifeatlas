# Security & privacy decisions

LifeAtlas holds some of the most personal material a family has. These decisions shape Part One, and the Part Two notes say what must change before real people's stories are stored on a server.

## Part One: nothing leaves the device

| Decision | Why | Where |
| --- | --- | --- |
| No network services at all — every provider is a local mock | A demo can't leak what it never sends | `src/services/factory.ts` |
| Data in IndexedDB on this device only; clearly labelled "not backed up" | Honest about the single copy | `src/store/demo-store.ts`, Preservation page |
| No payment fields exist; checkout creates uncharged orders | No card data can be entered, even by mistake | `src/app/checkout/preview` (e2e asserts zero `cc-*` inputs) |
| No emails or SMS; invitations are links you copy | No surprise messages to relatives | `communications` mock |
| Real-delivery and real-payment states unreachable | Prevents "it looks live" mistakes | `state-machines.ts` + tests |
| A preservation state shows green only with evidence | No false reassurance | `preservationStateIsHonest()` |
| Fictional sample family; synthetic narration labelled | Never imply real people or voices | fixtures, `sampleNotice` |
| Erase demo data clears IndexedDB and LifeAtlas `localStorage` keys | People can leave cleanly | Settings |

## Content and access

- **Privacy per memory:** `private`, `organizers`, `family`. Private memories are visible only to owners, organizers and their author (`canViewMemory`).
- **Consent per memory and media:** `print`, `export`, `share`. Books include only approved, print-consented stories; exports respect export consent and exclude private stories unless the person exporting opts in.
- **Contributions are reviewed:** anything from a relative or guest arrives as `submitted` and waits for an organizer.
- **Roles are demonstrated, not enforced** in Part One (`enforcement: "simulated"`); the Family page says so. The owner can't be demoted, and only the subject can be a capsule's storyteller.
- **Previews** ("Preview as …" on the Family page) switch the demo identity and show a banner with a one-click way back. They demonstrate what each role would see; they are not a security boundary.
- **Restoring an export** never overwrites existing data (it creates a new capsule), refuses files whose bytes don't match their recorded SHA-256, refuses SVG files (they can carry scripts) and switches print permission off for restored stories, because the manifest doesn't record whether the storyteller agreed to print.
- **Successors** get no access. In Part Two a successor acts only after verification by a person and a waiting period in which the owner can object.
- **Places** are city-level by default; precise points are stored internally and displayed rounded.

## Web hardening already in place

- `X-Robots-Tag: noindex, nofollow` on every private route (`/app`, `/view`, `/contribute`, `/gift`, `/future`, `/checkout`, `/demo`, `/proof`); `robots.txt` disallows them and the sitemap lists public pages only. Verified in e2e.
- `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` (camera and geolocation off, microphone only for this origin). No `X-Powered-By`.
- **File safety:** uploads are checked by declared type, size limit **and magic bytes**, so a renamed file can't pose as a photo (`validateFileDeep`, tested).
- **Output escaping:** React escapes rendered text; generated files (HTML archive export, demo invoice) escape every interpolated value.
- The only inline script sets a `js` class for progressive enhancement; no user content is ever injected as HTML.

## Must change before Part Two holds real data

1. **Server-side authorization on every request.** The client predicates in `permissions.ts` become the server's policy; nothing is trusted from the browser.
2. **Stronger link tokens.** Demo invitation/gift tokens combine a readable slug with 32 random bits — fine on one device, too weak on the internet. Use ≥128-bit random tokens, store only their hashes, expire and revoke them.
3. **Private media storage** with short-lived signed URLs, encryption with managed keys, server-side MIME sniffing, malware scanning and EXIF/location stripping.
4. **A Content Security Policy** with nonces, once third-party scripts (payments, analytics) are known. Not set yet because Part One has no third parties to allow.
5. **Payments via Stripe Checkout** with verified webhooks and idempotent order creation.
6. **Consent-gated analytics only;** today's events never leave the device.
7. **Data retention and deletion** with a published policy, a deletion window, and a download offered first. The policy pages are explicitly labelled drafts.
8. **Backups and restore drills** in an independent provider/region before any preservation promise is made.
9. **Legal review** before future delivery or any long-term preservation claim is sold.
