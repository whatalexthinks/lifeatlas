# Release-readiness checklist

Two lists: what must stay true for **every demo build**, and what must be true before **real customers** can trust it with irreplaceable material.

## Every build

- [ ] `npm run typecheck` — no errors
- [ ] `npm run lint` — no errors or warnings
- [ ] `npm test` — all unit and service tests pass
- [ ] `npm run build` — production build succeeds
- [ ] `npm run test:e2e` against that build, on a fresh `E2E_PORT` — all pass, including:
  - [ ] the 16-step customer journey, ending with the browser closed and reopened
  - [ ] error and recovery paths
  - [ ] WCAG 2.2 AA audits (desktop and phone), keyboard-only paths
  - [ ] phone, tablet and desktop layouts without sideways scrolling
- [ ] No screen claims a charge, a sent message, a shipment, a backup or a scheduled delivery
- [ ] No unreviewed promotion is active (`src/data/promotions.ts`: the giveaway stays `draft`)
- [ ] `src/config/integrations.ts` flags all `false` unless the service is really connected
- [ ] Sample content is fictional and labelled; synthesized narration is labelled

## Before real customers

Everything in the [integration checklist](INTEGRATION_CHECKLIST.md), plus:

### Trust and data
- [ ] Server-side authorisation for every request, tested against `permissions.ts`
- [ ] Independent backups with a restore drill completed and documented
- [ ] Account recovery and a successor process that cannot be triggered automatically
- [ ] Data export available to every customer at all times, whatever their plan status
- [ ] Deletion with a documented grace period and backup expiry schedule

### Legal and policy
- [ ] Privacy policy and terms reviewed by counsel (current pages are preview drafts)
- [ ] Cookie and analytics consent
- [ ] Promotion rules published; giveaway eligibility reviewed before activation
- [ ] Refund and cancellation policy for subscriptions and made-to-order goods
- [ ] Future-delivery terms that never promise arrival decades ahead

### Commerce
- [ ] Prices confirmed (current values are launch hypotheses)
- [ ] Tax and shipping calculation live before physical products are sold
- [ ] Print samples approved; fulfilment partner contracted
- [ ] Receipts emailed from a verified domain

### Operations
- [ ] Support inbox staffed (`brand.contact.active` set to `true` only then)
- [ ] Monitoring, error reporting and uptime alerts
- [ ] Incident response and breach-notification plan
- [ ] Load test of uploads and exports at expected archive sizes

### Accessibility and quality
- [ ] Manual screen-reader pass (VoiceOver, NVDA) of onboarding, recording, timeline and checkout
- [ ] Testing with older adults on phones and tablets
- [ ] Performance budget met on a mid-range phone (homepage and timeline)
