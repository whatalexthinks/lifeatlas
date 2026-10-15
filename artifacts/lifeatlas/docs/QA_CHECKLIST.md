# QA checklist

Results below were produced on this branch with the commands shown. Re-run them with `npm run check` and `npm run test:e2e`.

## Automated gates

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npm run typecheck` | ✅ No errors |
| ESLint incl. React compiler rules | `npm run lint` | ✅ 0 errors, 0 warnings (the 14 inherited errors were fixed at the root, not suppressed) |
| Unit, service and component tests | `npm test` | ✅ 109 passed in 11 files |
| Production build | `npm run build` | ✅ Compiles, type-checks, 54 static pages generated |
| Browser tests (production server) | `npm run test:e2e` | ✅ 33 passed — desktop, tablet sizes and Pixel 7 |
| Accessibility (axe-core, WCAG 2.2 AA) | part of `npm run test:e2e` | ✅ 0 violations — 36 routes plus preview, search-result, paused-session and proof states, on desktop, evening theme and phone |
| No dead navigation | link crawler from 12 entry points | ✅ 208 pages visited, no dead links, no page errors |

### What the tests cover

- **Domain:** pricing in whole cents (invalid amounts rejected, shipping/tax never invented), fuzzy dates and leap-day year arithmetic, state machines (illegal moves throw; provider-only states unreachable), permissions (privacy, authorship, print/export consent), file signature sniffing (renamed text, audio posing as a photo).
- **Book layout:** whole 4-page signatures, chapter openers on right-hand pages, contents page numbers correct, every chosen story exactly once in order, no stranded last lines.
- **Services:** checkout creates uncharged orders, demo invoices and proofs, and completing twice doesn't duplicate; heirloom validation; owner can't be demoted; prices whole-cent only; Legacy Capsule can't be put on sale; sealing stores a SHA-256 fingerprint and delivery stays `not_configured`; preservation reports `unconfigured`; exports keep private stories out by default.
- **Drafts and sessions:** answer drafts keep one per person and bring words back exactly, record where recordings are kept and forget them when removed, are capped; gathering sessions need people and questions, save position and answers, finish and remove; letter writing is kept even when invalid; saved data from before these collections existed loads without being wiped.
- **Roles and invitations:** highest active role wins and a successor designation alone grants nothing; roles follow memberships; opening an invitation adds someone new to the family once; previews use current roles and switch back; a returned story can be edited and sent back to review with its history kept.
- **Restore:** export → inspect → restore round trip into a new capsule (stories, places, people, photo, print consent off); one flipped byte is caught by its checksum; records-only JSON; seasons, decades and life stages come back exactly; clear refusals for the HTML copy, other JSON, truncated zips and zips without a manifest.
- **Storage errors:** quota, blocked storage and unresponsive storage each get plain words — never a raw browser error.
- **Components:** help search filtering; successor save/remove and email validation.
- **Full journey (`journey.spec`):** create a capsule in the wizard and answer its first question → invite a relative who opens the link and sends a story → approve it (they now appear on the Family page) → find it by search with highlighting and save it → export a file whose manifest contains both stories → restore that file as a new capsule. Plus: an answer, a letter and a holiday session each survive leaving and coming back; return-with-note → edit → resend; Preview as Jonah and back; the box proof; and the can't-save alert.
- **Keyboard (`keyboard.spec`):** skip link; visible focus on every stop through studio navigation, in order; dialogs trap focus, close with Escape and return focus to their button; search and bookmark the archive; run a holiday session.
- **Tablet (`tablet.spec`):** 29 pages at 768×1024 and 1024×768 without sideways scrolling.
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
- [x] Empty states for a brand-new capsule across all 11 studio tabs and 7 archive pages: each explains what will appear and offers the next step; no `NaN`/`undefined`, no overflow.
- [x] Recording restored after closing the tab (fake microphone): the draft recording plays back and *Record again* works.
- [x] Restore of a real 20-story, 29-file export: all stories and files back, sample illustrations linked to the app's copies.
- [x] Storage failure simulated mid-session (quota) and with IndexedDB removed: alerts appear; *Try saving again* recovers once space is free and the change survives a reload.

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
| Browser check | Draft offer never appeared: empty drafts saved on mount overwrote the real one, and the lookup ran before data loaded | Change-only saves; wait for hydration |
| Browser check | Switching identity then reloading reverted it (debounced save) | Identity switches, heirloom saves and session steps write immediately |
| Browser check | Persona roles were a separate copy, so Family-page role changes didn't reach the viewer | Roles come from memberships |
| Browser check | Removing someone's only role made them vanish from Family, with no way to give access back | People who've had a role stay listed |
| Browser check | The sample archive let family members with no role in | Sample is open to demo visitors only |
| Browser check | Bookmarks "jump" link pointed at an anchor that existed only in continuous mode | Replaced by the *Saved* view |
| Restore test | Exports dropped seasons/decades/life stages, so 6 stories couldn't restore; sample SVG plates were refused | Full dates in the manifest (with fallback for old exports); samples link to the app's copy |
| Restore test | Restore linked sample media the person had chosen to leave out of the export | Respect the export's choices |
| Keyboard test | Closing any dialog or sheet dropped focus on `<body>` | Focus returns to the opener |
| axe audit | Hidden file inputs (recording upload, restore) had no accessible name | Labelled |
| E2E | A proof opened right after saving a design could miss the save | Heirloom saves write immediately |
| Empty-state sweep | A new capsule's Memories tab blamed filters that weren't set; the empty archive cover invited people to "wander" zero stories | Accurate empty states with a first-memory action |

## Known limitations

- Everything is local to one browser; there are no accounts, so roles and private links are demonstrated, not secured.
- Nothing is sent, charged, printed, shipped, transcribed or backed up — by design.
- The public pricing page shows the published catalog; operations price edits apply to checkout and builders on the device only.
- Demo link tokens are short; see [SECURITY_PRIVACY_DECISIONS.md](SECURITY_PRIVACY_DECISIONS.md).
- Automated rules catch only part of accessibility. Keyboard paths are now tested automatically; screen-reader journeys (VoiceOver, NVDA) were spot checks, not a formal audit, and axe "incomplete" results need a person to review.
- Restores are held in memory between *check* and *restore*, and files over 300 MB are refused — enough for a demo archive, not for a lifetime of video.
