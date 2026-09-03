# Find Pickleball Courts

A US pickleball court directory. Deep state/county/city/venue hierarchy, a
verified count as the headline promise, and visible provenance on every fact.

**Read [`decisions.md`](./decisions.md) before writing any code.** It holds
the locked URL pattern, the fourteen rules, the four import gates and the six
page gates. Locked sections are not editable by implementation work.

---

## Current status: Phase 0 (foundation)

There is no content, no data and no published page. What exists is the
scaffolding that makes the rules enforceable:

| Thing | Where | State |
| --- | --- | --- |
| Rendering layer | Next.js 16 App Router, static generation | Working |
| Locked decisions | `decisions.md` | Sections 1-7 locked |
| Keyword ownership | `keyword-map.json` + validator | Enforced at build |
| Data model | `data/schemas/*.schema.json` | 5 schemas, empty |
| Controlled vocabularies | `data/vocabularies/*.json` | 4 fields defined |
| JS-off gate | `scripts/check-js-off.mjs` | Enforced |

**Publishable inventory is currently zero.** The 18,038 imported rows have no
`source_url` and no `date_checked`, so Rule 12 makes all of them
`status=pending`, and Rule 8 keeps pending rows out of the 3-venue threshold.
No city, county or filter page can legally exist until verification work
happens.

---

## Requirements

- Node.js 20.9 or newer (developed on 22.20.0)
- npm

## Install

```bash
npm install
```

## Run the build

```bash
npm run build
```

`prebuild` runs the keyword validator first, so **a keyword collision stops
the build before Next.js compiles anything** (Rule 9). Output is prerendered
HTML under `.next/server/app/`.

```bash
npm run dev      # development server, http://localhost:3000
npm start        # serve the production build
npm run typecheck  # tsc --noEmit, no build
```

## Run the keyword validator

```bash
npm run validate
```

Checks `keyword-map.json` and exits non-zero on any error:

1. The file parses and has the expected shape.
2. `page_type` and `url_pattern` are unique.
3. Every `url_pattern` is on the locked list in `decisions.md` section 1. **A
   new or edited URL shape fails here by design** — including something as
   subtle as a dropped `/us/` segment.
4. Every `{slot}` used in a keyword is declared in `slots`.
5. `secondary` holds at most 3 patterns.
6. No two keyword templates collapse to the same shape once slots are
   blanked. Primary-vs-primary and primary-vs-secondary are errors;
   secondary-vs-secondary is a warning.

To confirm the validator actually bites, temporarily point two page types at
the same primary pattern and run it — you should get a non-zero exit and a
named collision.

**Known limit:** instance-level collisions — two *real* expanded URLs
claiming the same *real* keyword, such as a venue literally named after its
city — cannot be checked without data. The hook is written and activates the
moment `data/keyword-instances.json` exists. Until then the validator prints
`instance checks: INACTIVE` rather than passing silently.

## Run the JavaScript-off check

```bash
npm run build && npm run check:js-off
```

This is Page Gate 2. A browser with JavaScript disabled renders exactly the
bytes the server sent and runs none of the scripts, so the check reads the
prerendered HTML, discards every `<script>` and `<style>`, and asserts the
page is still complete:

1. An `<h1>` exists.
2. Visible text clears a floor (a "did anything render" tripwire, **not** the
   Rule 5 word band — that is a separate checker, see O8).
3. At least one `<a href>` exists outside of script tags, so navigation does
   not depend on JS.
4. At least one `application/ld+json` block exists, parses, and contains a
   `BreadcrumbList` (the part of Page Gate 3 that applies to every page).

Framework pages (`_not-found`, `_global-error`) are reported as `SKIP`.

**Why this check exists rather than trusting the framework:** during Phase 0 a
deliberately client-rendered page was added as a negative control. Next.js
still labelled it `○ (Static)` in the build output, and it still rendered
blank without JavaScript. **The framework's "Static" label does not mean Gate
2 passes.** The control failed the check on all four assertions and was then
removed.

For belt and braces you can check a real HTTP response instead:

```bash
npm run build && npm start &
curl -s http://127.0.0.1:3000/ | grep -c "application/ld+json"
```

Look for `x-nextjs-prerender: 1` in the response headers — that confirms the
HTML was built ahead of time rather than rendered per request.

## Run the import gates

**Not built yet.** The import gate validator is the first deliverable of the
import phase. Today the gates are documented in `decisions.md` section 6 and
partially encoded in `data/schemas/venue.schema.json`:

| Gate | Encoded in schema | Needs the validator |
| --- | --- | --- |
| I1 Identity | slug shape, required fields | address resolution |
| I2 Provenance | field presence, `verified_by` enum | URL reachability, cadence window (**O3**) |
| I3 Consistency | lat/lng ranges, postal format | `total_courts = indoor + outdoor` (Rule 13), lat/lng inside state, county confidence |
| I4 Vocabulary | 4 enums | `access_type` has no vocabulary yet (**O1**) |

JSON Schema cannot express arithmetic or reachability, which is why I3 and
half of I2 need real code.

---

## Layout

```
app/                        Next.js App Router. Server Components only —
                            a 'use client' component in a content path
                            breaks Rule 1.
data/
  schemas/                  JSON Schema for each entity
    venue.schema.json       43 fields: 33 imported + 10 required by the gates
    city.schema.json
    county.schema.json
    state.schema.json
    gear-item.schema.json   PROVISIONAL, not locked
  vocabularies/             Controlled sets, with a definition per value
    fee-type.json
    play-format.json
    surface.json
    venue-type.json
scripts/
  validate-keyword-map.mjs  Rule 9
  check-js-off.mjs          Page Gate 2
decisions.md                The constitution. Read it first.
keyword-map.json            One primary keyword per URL
```

## Two things the schemas do that are easy to undo by accident

**No entity stores a count.** Not city, not county, not state. Rule 2 says
every count comes from `getCounts(scope)`. A stored tally is a second source
of truth, and it is exactly how CourtSource ended up with two live pages
disagreeing at 45 vs 46 venues and 185 vs 187 courts. If you find yourself
adding a `venue_count` field, that is the bug.

**Null is not false and null is not zero.** `light`, `restroom`, `pro_shop`,
`climate_control`, `covered` and `nets_provided` are tri-state. `null` means
nobody checked and renders as "Not verified yet"; `false` means somebody
checked and it is not there. Note that a verified `0` is still legitimate —
`indoor_courts: 0` on an outdoor-only venue is a checked fact, and differs
from `indoor_courts: null`. Rule 6 forbids rendering a *null* as zero, not
recording a real zero.
