# Design system

LifeAtlas should feel like a future heirloom: warm, deliberate and tactile, never loud. The interface stays restrained so the stories can be expressive. The public-site refresh (PR #2, see [design/README.md](design/README.md)) set the current direction; the studio follows it.

All tokens live in `src/app/globals.css` as CSS variables and are exposed to Tailwind 4 through `@theme inline`.

## Typography

| Role | Face | Where |
| --- | --- | --- |
| Interface and headlines | **Geist Sans** (self-hosted via `geist`) | Navigation, controls, body copy, page titles (`h1` in the studio is Geist, weight 450) |
| Story voice | **Newsreader** (variable, OFL, `src/app/fonts/`) | Italic accents inside headlines (`<em>`), story text, book pages, letters, captions |
| Data | **Geist Mono** | Catalog numbers, dates in metadata, order numbers |

The signature move is a Geist headline with a Newsreader italic accent: *Made to **hold.***. In the studio this is automatic — `[data-studio] h1 em` switches to Newsreader. On public pages `.la-page h1 em` does the same.

Fluid type tokens: `text-display`, `text-title`, `text-heading`, `text-subheading`, `text-lead`, `text-body`, `text-senior` (larger, for storytellers), `text-micro`. Settings → *Larger text* sets `data-text-size="large"` on `<html>`.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#f8f8f3` | Page background |
| `surface` | `#fefdf9` | Cards and panels (`.card-paper`) |
| `ivory`, `linen`, `mat` | warm neutrals | Quiet fills, photo mounts |
| `ink` → `ink-4` | `#202d27` → `#8c8981` | Text hierarchy; never use a series or status colour for text |
| `evergreen` | `#294f3e` | Primary actions, selection, progress |
| `brass`, `brass-ink` | `#ae9874`, `#765c36` | Demo markers, foil, eyebrows |
| `terracotta`, `slate`, `smoke`, `moss` | | Chapter identities only |
| `success` / `warning` / `danger` / `info` (+ `-soft`) | | Status only, always with an icon and a word |
| `night`, `night-ink-*` | `#131815`… | Evening theme, the viewer's night tone, letter opening |

Evening theme: `data-theme="evening"` (or *Match device*) remaps the same tokens; components never hard-code light colours for UI chrome.

## Shape, depth, motion

- **Radius:** buttons 9–10px (squarer since the refresh), cards 16–20px, photo mounts 2–4px.
- **Shadow:** `shadow-sm`/`md`/`lg` for UI; `shadow-object` only for physical objects (book, box, envelope).
- **Motion:** slow and soft (`--ease-out`): develop, rise-in, page turn (`turn-next`/`turn-prev`), envelope flap. Everything respects `prefers-reduced-motion` and Settings → *Reduced motion* (`data-motion="reduced"`).

## Components (`src/components/ui`)

| Component | Notes |
| --- | --- |
| `Button`, `ButtonLink`, `IconButton` | Variants `primary`, `secondary`, `quiet`, `ghost`, `text`, `destructive`, `light`, `outlineLight`, `brass`; sizes `sm`–`xl`; `loading`, `leading`, `trailing` |
| `Field`, `Input`, `Textarea`, `Select` | `Field` wires label, hint and error ids for screen readers |
| `Checkbox`, `Switch` | Descriptions via `aria-describedby`, not inside the accessible name |
| `ChoiceCards`, `Segmented` | Radix radio groups |
| `Dialog`, `Sheet`, `ConfirmDialog` | Focus-trapped; destructive confirmations use `tone="danger"` |
| `DemoNotice`, `Badge`, `toast`, `EmptyState`, `Skeleton`, `ProgressBar` | `Badge tone="demo"` marks anything simulated |

Studio primitives (`src/components/studio/primitives.tsx`): `PageHeader`, `Panel`, `Stat`, status badges for memories, invitations, orders and letters.

Objects (`src/components/marketing/objects.tsx`): `BookObject`, `KeepsakeBox` (a real six-face CSS cube with a hinged lid), `SealedLetter`. Heirloom pages: `BookPageView` and `SpreadViewer` (`src/components/heirlooms/book-pages.tsx`), sized in container units so a page reads identically on screen and in print.

## Honesty patterns

These are part of the design, not disclaimers bolted on:

- Every simulated outcome says what didn't happen: "Preview only — no payment was charged", "Invitation preview — no email sent", "Future message draft — not scheduled for delivery", "Stored on this device — not backed up".
- Services that aren't connected show **Not connected** in neutral grey — never a green tick.
- Test prices are labelled where they appear. Shipping and tax read "Calculated at fulfillment" instead of an invented number.
- Sample people, narration and artwork are labelled fictional/synthesized.

## Layout rules

- Content widths: studio pages 980–1320px; reading columns ~42rem.
- Phones: 16px+ gutters, 44px minimum touch targets, no sideways scrolling. Grid items may shrink to their track (`.grid > * { min-width: 0 }` in the base layer); a sweep of all 45 app routes at 390px confirms no overflow.
- Print: `.no-print` hides chrome; the book proof sets `@page` to the trim size.

## Data visualisation

The operations funnel is a single series: one hue (evergreen), 4px rounded bar ends, values in text ink, a hover/focus tooltip per bar, and no legend (the title names the series).
