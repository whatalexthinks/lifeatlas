# QA checklist

Results below were produced on this branch with the commands shown. Re-run them with `npm run check` and `npm run test:e2e`.

## Automated gates

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npm run typecheck` | ✅ No errors |
| ESLint incl. React compiler rules | `npm run lint` | ✅ 0 errors, 0 warnings (the 14 inherited errors were fixed at the root, not suppressed) |
| Unit, service and component tests | `npm test` | ✅ 86 passed in 9 files |
| Production build | `npm run build` | ✅ Compiles, type-checks, 54 static pages generated |
| Browser tests (production server) | `npm run test:e2e` | ✅ 20 passed — desktop and Pixel 7 |
| Accessibility (axe-core, WCAG 2.2 AA) | part of `npm run test:e2e` | ✅ 0 violations — 33 routes on desktop, evening theme, and phone |

### What the tests cover

- **Domain:** pricing in whole cents (invalid amounts rejected, shipping/tax never invented), fuzzy dates and leap-day year arithmetic, state machines (illegal moves throw; provider-only states unreachable), permissions (privacy, authorship, print/export consent), file signature sniffing (renamed text, audio posing as a photo).
- **Book layout:** whole 4-page signatures, chapter openers on right-hand pages, contents page numbers correct, every chosen story exactly once in order, no stranded last lines.
- **Services:** checkout creates uncharged orders, demo invoices and proofs, and completing twice doesn't duplicate; heirloom validation; owner can't be demoted; prices whole-cent only; Legacy Capsule can't be put on sale; sealing stores a SHA-256 fingerprint and delivery stays `not_configured`; preservation reports `unconfigured`; exports keep private stories out by default.
- **Components:** help search filtering; successor save/remove and email validation.
- **End to end:** every studio/viewer/ops route renders without page errors; private routes send `noindex`; an invitation travels to review and into the family viewer; a book goes from design to an uncharged order and printable proof (no card inputs exist); holiday session booklet; letter sealing; operations price edits reach checkout and simulations reach review; preservation honesty and a real archive download; every public and studio page fits a 390px phone.

## Manual and visual checks

Performed in headless Chromium with screenshots at 1440px and 390px.

- [x] Landing, pricing and information pages (PR #2 design) — fit and render on phone and desktop.
- [x] Studio pages adopt the refreshed type system; italic title accents use Newsreader.
- [x] Recording with a fake microphone: record → keep → memory reveal.
- [x] Letter opening sequence: sealed → flap opens and letter rises → letter.
- [x] Book proof PDF: 56–72 pages depending on trim; **zero text overflow** measured on every page at 8×10, 10×10 and 11×8.5; PDF size ~7 MB after rasterizing illustration plates for print (was 170 MB).
- [x] A sweep of all 45 app routes at 390px: no sideways scrolling (five pages fixed during QA).
- [x] Settings apply live: Evening theme (studio home, billing, heirlooms checked), larger text (root 18px), reduced motion (`data-motion`).
- [x] Erase demo data removes added content, restores the sample family and resets preferences.

## Issues found and fixed during QA

| Found by | Issue | Fix |
| --- | --- | --- |
| Unit test | Chapter openers landed on left-hand pages | Corrected page parity |
| Proof measurement | Story text overflowed into the storyteller credit | Per-trim word budgets; credit flows after text |
| Proof measurement | Landscape photo pages overflowed | Narrower mount on landscape trims |
| Print test | 170 MB proof PDFs | Plates rasterized to JPEG in print mode |
| E2E | Last edit could be lost on an immediate hard reload | Pending saves flush on hide/unload |
| Phone sweep | Five pages scrolled sideways at 390px | Grid items may shrink to their track |
| Browser check | Operations tab links ignored `#support` once a tab was clicked | URL hash is the single source of truth |
| Browser check | Catalog notice claimed edits reach the public pricing page | Copy corrected (pricing shows the published catalog) |
| Lint | 14 React-rule violations (state synced in effects, impure render, refs in render) | Derived state, `useSyncExternalStore`, `useEffectEvent` |
| axe audit | Text contrast below 4.5:1 on 31 pages (`ink-4`, night tones, small marketing captions) | Tokens adjusted by the smallest passing step; hierarchy kept |
| axe audit (evening) | Hard-coded cream text on evergreen and white on danger failed when the theme flipped (1.8:1) | `on-evergreen` / `on-danger` tokens |
| Manual review of axe "incomplete" | Featured-question card unreadable in evening (axe couldn't compute its background) | Card uses a fixed deep green in both themes |
| axe audit | Overlapping map markers; a map pill covering a marker | Clustering by on-screen marker size; pill moved |
| axe audit | Sideways-scrolling tables and the export list not keyboard reachable; hidden gift panel focusable | Focusable labelled regions; `inert` |
| Share metadata | Every page pointed `og:image` at `/og`, which didn't exist | `opengraph-image.tsx` |

## Known limitations

- Everything is local to one browser; there are no accounts, so roles and private links are demonstrated, not secured.
- Nothing is sent, charged, printed, shipped, transcribed or backed up — by design.
- The public pricing page shows the published catalog; operations price edits apply to checkout and builders on the device only.
- Demo link tokens are short; see [SECURITY_PRIVACY_DECISIONS.md](SECURITY_PRIVACY_DECISIONS.md).
- Automated rules catch only part of accessibility. Screen-reader journeys (VoiceOver, NVDA) and full keyboard walkthroughs were spot checks, not a formal audit; axe "incomplete" results need a person to review.
