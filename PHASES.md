# PHASES.md

Phase status for the Deep Pickleball directory.

This file records **where the work is**. [`decisions.md`](./decisions.md)
records **what the rules are**. When they disagree, `decisions.md` wins.

Each completed phase is marked with an annotated git tag, so any phase
boundary can be checked out or diffed:

```bash
git tag -n                  # list phases with their annotations
git show phase-0            # what shipped, and why
git diff phase-0..HEAD      # everything since
```

---

## Phase 0 — Foundation ✅ COMPLETE

**Tagged `phase-0`. Shipped 2026-09-02.**

Locked the things that are expensive to change later. No pages, no content,
no imported data — by constraint.

| Delivered | Where |
| --- | --- |
| Next.js 16 App Router, static generation | `app/`, `next.config.ts` |
| Locked decisions, sections 1–7 verbatim | `decisions.md` |
| One primary keyword per URL + build-time validator | `keyword-map.json`, `scripts/validate-keyword-map.mjs` |
| v4 data model, 5 entities | `data/schemas/` |
| 4 controlled vocabularies, definition per value | `data/vocabularies/` |
| Page Gate 2 enforcement | `scripts/check-js-off.mjs` |
| Build / validator / gates / JS-off docs | `README.md` |

**Why the stack changed.** The repo began as a Create New App webpack SPA
whose built `index.html` was an empty `<div id="app">`, with a `vercel.json`
rewriting every URL to that shell. It failed Rule 1 on every page,
permanently. That was replaced, not patched.

**Amended 2026-09-03 — Phase 0 is only now actually complete.** The brief
said "include the eight decisions I am pasting below" and no decisions
followed, so `decisions.md` §8 shipped as a reserved, BLOCKING section with
nothing invented to fill it. The eight arrived on 2026-09-03 and are now
pasted verbatim as D1–D8 with an enforcement map. The D-numbering that §8
had been holding open is allocated, and the modules that implement a
decision now cite it by number.

**Gate status at tag:** Page Gate 2 PASS (automated). Page Gate 3 PARTIAL —
BreadcrumbList enforced, the rest have nothing to attach to. Gates 1, 4, 5, 6
are N/A with no data. Import Gates I1–I4: none enforced; partially encoded in
the schemas.

---

## Phase 1 — Import and triage ✅ COMPLETE

**Shipped 2026-09-02.** Strategy §H (P1-R), which replaced v3 Phase 1 once
the dataset arrived. No new data was collected; the 18,037 parsed rows were
mapped, measured and triaged.

| Delivered | Where |
| --- | --- |
| Import mapper, 37 source columns, 37 dispositions, 0 silently discarded | `scripts/import/mapper.mjs`, `reports/import-mapping.md` |
| Controlled vocabularies applied at import | `scripts/import/vocab.mjs`, `data/vocabularies/` |
| Data quality report over every row | `scripts/import/quality-report.mjs`, `reports/quality-report.md` |
| County backfill, per-row method and confidence | `scripts/import/derive-county.mjs`, `reports/county-status.md` |
| City triage and the verification work queue | `scripts/import/triage.mjs`, `reports/city-triage.md` |

**The two numbers this phase produced.**

- **Publishable cities today: 0.** Not one row carries a qualifying
  `source_url` or any `date_checked`, so Rule 12 holds all 18,037 at
  `status=pending` and Rule 8 admits none to the 3-verified threshold.
- **Cities gated ONLY by provenance: 1,475** of 6,585. Those rows already
  pass I1, I3 and I4 in full. Attaching real sources to 8,458 of them would
  unlock 12,786 city, filter and venue pages, plus 961 county pages.

That gap between 0 and 1,475 is the whole project. It did not close
**O11** — where verification data actually comes from is still the owner's
decision — but it sized it exactly, and it settled that the real Phase 1 was
never page building.

**County** was derived from `postal_code` → ZCTA → county against two
public-domain Census files, with proximity as the multi-county tiebreak.
77.1% accepted at confidence ≥ 0.85, 16.7% flagged for manual review. The
tiebreak choice mattered: it changed the answer on 24.8% of multi-county
rows, and land-area weighting had been putting Anchorage addresses in Bethel.

---

## Phase 1B — Verification pipeline ✅ COMPLETE

**Shipped 2026-09-02.** The sprint that turns pending rows into verified
ones. Built, self-tested, and waiting on human source attachment.

| Delivered | Where |
| --- | --- |
| Per-metro verification packets, 100 metros, 2,620 venues | `verification/*-plan.md`, `verification/*-worksheet.csv` |
| Prioritised source ladder (municipal first, competitors never) | `scripts/verify/source-ladder.mjs` |
| Provenance test — what does and does not satisfy Import Gate I2 | `scripts/verify/provenance.mjs` |
| Conflict handling when a source disagrees with the row | `scripts/verify/conflict.mjs` |
| Completeness dashboard, re-runnable as work lands | `reports/completeness.md` |
| Pipeline self-test | `scripts/verify/selftest.mjs` |

**Metros ready to publish: 0 of 100**, every one blocked on I2 alone. The
dashboard exists to be re-run; that number is the one to watch.

**The hard rule is in code, not prose.** `metroStatus()` returns
`blocked` until 3+ venues pass all four import gates, and there is no
partial-publish state for it to return instead.

---

## Phase 2 — The data layer ✅ COMPLETE

**Shipped 2026-09-02.** Decision **D2** made structural: one query, and no
route around it.

| Delivered | Where |
| --- | --- |
| `getCounts(scope)` returning Count objects with denominators | `lib/data/counts.mjs` |
| The venue store that hands out no countable collection | `lib/data/store.mjs` |
| Slug registry, numeric-suffix ban, real disambiguation | `lib/data/slugs.mjs` |
| `promoteToVerified()` — the only pending → published path | `lib/data/promote.mjs` |
| Whole-dataset validator, wired into `prebuild` | `scripts/validate-data.mjs` |
| Build-time bypass scan over `app/` | `scripts/validate-no-bypass.mjs` |
| 61 tests | `scripts/test/` |

**Four layers stop a page inventing a number**, and the fourth is stated
rather than hidden:

1. A count is not a number — `getCounts` returns Count objects carrying a
   private Symbol. A bare `15` throws.
2. The store returns a `VenueList` with no `.length`, no `.filter`, no
   iterator. There is nothing to count.
3. `validate-no-bypass.mjs` fails the build on `.length`, `.filter().length`
   or a bare numeric literal inside a title, description or heading.
4. **The honest limit.** This is JavaScript. Someone determined can import
   the raw loader and hard-code a string. What layers 1–3 guarantee is that
   every *accidental* bypass is a throw or a build failure, and every
   deliberate one requires visibly reaching around the data layer.

**Denominators ship with every count.** A Count carries `value`,
`denominator` (verified venues in scope) and `known` (those that state the
field), so a page says "12 of 15 venues report lighting" rather than
implying the other three are unlit. `venues_unverified` is rendered, not
hidden — Section G, and the trust move no competitor makes.

**Current validator state:** 18,037 rows, **0 verified**, 0 errors,
1,557 warnings. Warnings are findings about the source data, not build
failures; the largest are 640 schema deviations, 627 numeric-suffix slugs
(Rule 10) and 266 court-arithmetic mismatches (Rule 13).

---

## Phase 3 — City template ✅ COMPLETE

**Tagged `phase-3`. Shipped 2026-09-03.** One city page so good you would
link to it yourself — and it is the page that actually ships, not a template
sitting beside it.

**`/pickleball/us/wa/seattle/` — 24 verified venues, 92 courts, 1,575 words,
all six gates PASS, all 11 items of the 8c anatomy present.**

| Delivered | Where |
| --- | --- |
| First verified venues in the repo, 24 of them | `data/verified/seattle-wa.json`, `scripts/verify/apply-seattle-parks.mjs` |
| The verified-facts overlay that persists them | `lib/data/verified.mjs` |
| Identity pass — 8,298 slugs canonicalised | `scripts/identity/`, `lib/data/identity.mjs` |
| The site itself: home, state, city, venue, filters | `app/`, `lib/site/` |
| Design system, closing O12 | `app/globals.css` |
| Sourced editorial, four slots + best-for + FAQs | `data/editorial/seattle-wa.json` |
| Rule 7 applied to prose | `lib/data/editorial-store.mjs` |
| The six gates run against the built HTML | `scripts/gate-shipped.mjs` |

**The source.** Two ArcGIS feature services published by Seattle Parks and
Recreation — the Pickleball Courts layer and Park Boundary (details).
Tier 2, `verified_by=municipal_source`, snapshots committed under
`data/sources/` so every fact is auditable without re-fetching. Tier 1 was
tried first and did not yield: seattle.gov renders its court list with
JavaScript, so the city fails the same JS-off test Gate 2 enforces here.

**What the data cost the CSV.** 62 imported values were overwritten and 107
unsourced fields cleared. Green Lake was recorded as 4 courts with 2 indoor;
the city says 8, all outdoor. Of 231 non-null imported field values across
the matched venues, **66 survived — 29%**.

**Where a source is silent, the page says so.** Surface is not verified on
any venue, no fee is claimed anywhere, and the wet-weather answer is that
Seattle has no covered or indoor verified court at all.

**Two seams this phase closed, both found by checking rather than assuming:**

- A verified venue used to carry its unsourced imported fields under a
  municipal-source badge — it rendered "Cost: free" and "Surface: concrete"
  on venues whose only source was a court-count dataset. Verifying a venue
  now clears every unsourced fact field to null.
- The gates were testing `lib/page/city-page.mjs` while the site served
  `app/`. A green report about a page no visitor could reach.

---

## Blockers still open

Phases 0 through 2 are complete. What stops Phase 3 from publishing is not
missing code.

| Blocker | Where tracked | Effect |
| --- | --- | --- |
| **O11** — where verification data comes from | `decisions.md` §9 | **Answered for Seattle**, still open everywhere else. Municipal open data worked; 24 venues verified. 1,475 cities still wait on provenance. |
| **O10** — canonical hostname | `decisions.md` §9 | Schema `@id`, canonicals, breadcrumb `item` and the sitemap still emit `example.invalid`. |
| **O1** — controlled vocabulary for `access_type` | `decisions.md` §9 | `/public/` is a locked filter slug (D4) with no lawful data driver. The other four filters have one. |
| **O2** — provenance of `rating` / `user_rating` | `decisions.md` §9 | All three rating fields are QUARANTINED. No `AggregateRating` may be emitted until their origin is known. |

Resolved since Phase 0: **§8** (the eight decisions, supplied and locked
2026-09-03), **O8** (word-band checker and its counting definition) and
**O12** (CSS and design system, `app/globals.css`).

## The sequencing rules that bound every phase

Reproduced from `decisions.md`. These are not scheduling advice.

1. **Verify and publish 50–100 metros to a complete standard, prove the
   template ranks, and only then release more of the dataset in waves.** All
   three competitors scaled before proving, which is why 20,000+ pages
   produce so little for two of them.
2. **Page count is an output, never a target.** Publishing unsourced rows,
   lowering the 3-venue threshold, or putting an imported row count where a
   verified count belongs is refused, not negotiated.

## Tagging convention

One annotated tag per completed phase: `phase-0`, `phase-1`, … The tag lands
on the commit where that phase's work and its documentation are both present,
so checking out a tag gives a coherent snapshot rather than code without its
record.
