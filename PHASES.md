# PHASES.md

Phase status for the Find Pickleball Courts directory.

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

## Phase 4 — Hubs and internal linking ✅ COMPLETE

**Tagged `phase-4`.** County pages, the linking rules, the sitemap, and a
crawl report that reads the built HTML rather than asking the code that
generates the links.

| Delivered | Where |
| --- | --- |
| County template + King County, WA | `app/.../CountyPage.tsx`, `data/editorial/king-county-wa.json` |
| The link graph — every href minted from one place | `lib/site/links.mjs` |
| XML sitemap, lastmod from `date_checked` | `app/sitemap.ts`, `lib/site/sitemap.mjs` |
| Crawl report over the built files | `scripts/crawl-report.mjs` |

**The state page does not publish, and that is the decision.** The brief sets
a threshold for city, county and filter pages but names none for a state. A
state with one published city has no document to be that its city page is not
already, and Rule 9 forbids two URLs competing for one intent. So
`STATE_MIN_CITIES = 3`, `/pickleball/us/wa/` 404s, and nothing links to it.
Recorded as **O13**.

**The crawl report failed three ways on its first run**, and none of it was
visible from inside the code that generates the links: the King County page
was an orphan, `/pickleball/us/wa/` was building but not published, and there
were **30 dead links from a single hard-coded `<a href>` in the site nav** —
one line, broken on every page at once, the moment the state page stopped
publishing. That is the argument for reading the rendered files.

---

## Phase 5 — Venue and filter templates ✅ COMPLETE

**Tagged `phase-5`.** The 21-field fact panel, the trust ladder, the claim
call-to-action, and the five-filter rule enforced narrowly.

| Delivered | Where |
| --- | --- |
| Venue template, full fact panel | `app/.../[slug]/page.tsx`, `lib/site/views.mjs` |
| Filter template, per-filter sourced intros | `app/.../[slug]/FilterPage.tsx` |
| Membership rules, deliberately strict | `filterView()` in `lib/site/views.mjs` |
| 14 noindex facets, 28 robots directives | `lib/site/facets.mjs`, `app/robots.ts` |
| Six-gate report by page type | `scripts/gate-all.mjs` |

**No AggregateRating is emitted anywhere.** `rating` and `user_rating` both
arrived with the import with undocumented origin and are quarantined under
O2. A node is emitted only from first-party ratings above a count of 3, which
today is nothing — the correct outcome, and it still beats three competitors
who ship none.

**Three filters do not exist, for two different reasons.** `/indoor/` has zero
matching venues: Seattle has no verified indoor court at all. `/free/` and
`/public/` have no lawful data driver, because `fee_type` and `access_type`
are unverified everywhere (**O1**). Neither borrows another filter's number to
manufacture a page.

**Gate 1 was wrong for venue pages** and had been since it was written. It
applied the 3-verified-venue city rule to venues, which would have failed
every venue page ever built for the crime of being one venue. §7 says a venue
needs a verified address and a verified court count; it now checks that, and
checks both carry provenance rather than merely existing.

---

## Phase 6 — Technical SEO and schema ✅ COMPLETE

**Tagged `phase-6`.** The layer none of the competitors are trying at, plus CI
that refuses to ship a broken one.

| Delivered | Where |
| --- | --- |
| Schema validation + AggregateRating negative test | `scripts/validate-schema.mjs` |
| Permanent CI: JS-off, gates, schema, crawl, 404 | `.github/workflows/ci.yml` |
| Import + page gates with a summary table | `scripts/gates-ci.mjs` |
| 404 monitor with an append-only URL ledger | `scripts/monitor-404.mjs` |
| Provenance audit, per fact, internal only | `app/internal/provenance/`, `lib/site/provenance.mjs` |
| Canonicals; hreflang scaffolded and inactive | `app/layout.tsx` |

**The validator is local, not Google Rich Results** — that needs a public URL
and this build is noindex on `example.invalid`. Claiming otherwise would be
the exact failure this project exists to avoid.

**The CI rule immediately caught a contradiction:** the sitemap was
advertising 20 venue pages that failed Gate 4 — a directory promising a
crawler pages it had already judged unfit. Fixed at the root with
`venuePagePublishes()`, one predicate the route, the sitemap and every link
renderer all ask.

**The 404 monitor keeps an append-only ledger**, which is the part that
matters: a page that quietly disappears also disappears from the sitemap, so a
monitor reading only today's sitemap can never catch the failure it exists
for. A 301 counts as a pass — §3 permits exactly that one response.

---

## Phase 7 — Proof checkpoint 🟡 OPEN, AND NOW ADVANCING

This is the one gate in the whole document that cannot be passed by building.
It needs the site on a real hostname and then time in the index.

**What changed since that was written:** the site is deployed and building
from `main`, `SITE_ORIGIN` is set in the Vercel project, and the placeholder
no longer reaches the output. Eight cities are published. So the phase is no
longer blocked on code or on a domain — it is waiting on the index, and the
only thing that moves it is more verified inventory and more time.

**What advances it:** city verification runs, one at a time, to the standard
the sequencing rules set out below. Nothing else in this repository does.

Per the sequencing rules below, phases 8 through 12 do not start until it
passes.

---

## The published set

Thirty-five cities, twenty states, twenty-six counties, five state pages. Every page below
passes all six gates against the built HTML; the totals are the ones
`getCounts()` returns, not a hand count.

| # | City | Venues | Courts | Source | Shipped |
| ---: | --- | ---: | ---: | --- | --- |
| 1 | Seattle, WA | 24 | 92 | Seattle Parks ArcGIS, two feature services | 2026-09-03 |
| 2 | Raleigh, NC | 11 | 44 | Raleigh Parks, ArcGIS + pickleball page | 2026-09-03 |
| 3 | Cary, NC | 3 | 12 | Town of Cary parks pages | 2026-09-03 |
| 4 | Apex, NC | 5 | 21 | Town of Apex parks pages | 2026-09-03 |
| 5 | Charlotte, NC | 5 | 29 | Mecklenburg County park pages | 2026-09-03 |
| 6 | Portland, OR | 11 | 59 | Portland Parks pickleball page | 2026-09-03 |
| 7 | Vancouver, WA | 3 | 14 | City of Vancouver pickleball page | 2026-09-03 |
| 8 | Bellevue, WA | 13 | 42 | City of Bellevue pickleball page + park pages | 2026-09-04 |
| 9 | Madison, WI | 23 | 67 | City of Madison park pages, count and surface per venue | 2026-09-04 |
| 10 | Austin, TX | 21 | 60 | Austin PARD pickleball page, count + hours + lighting per venue | 2026-09-04 |
| 11 | Scottsdale, AZ | 4 | 29 | Scottsdale pickleball page + park pages; count, lighting, price, etiquette | 2026-09-04 |
| 12 | Saint Paul, MN | 6 | 13 | Saint Paul facility pages, assembled from the City's own pickleball map layer | 2026-09-04 |
| 13 | Lincoln, NE | 3 | 22 | Lincoln Tennis and Pickleball page + Parks A to Z; dedicated counts and park hours | 2026-09-04 |
| 14 | Mesa, AZ | 3 | 26 | Mesa Tennis & Pickleball Center page + park pages; hourly court price | 2026-09-04 |
| 15 | Kirkland, WA | 3 | 10 | Kirkland pickleball table, "Number & Type of Courts" | 2026-09-04 |
| 16 | Cape Coral, FL | 5 | 20 | Cape Coral Park Sports/Games page + park pages; count, lighting and price | 2026-09-04 |
| 17 | Irvine, CA | 3 | 18 | Irvine pickleball page + park amenity lists; every count stated twice, all lit, hours, reservation price | 2026-09-07 |
| 18 | Huntington Beach, CA | 4 | 13 | Park Amenities page, one line per park under "CITY PARKS WITH A PICKLEBALL COURT (NO LIGHTING)" | 2026-09-07 |
| 19 | Tampa, FL | 16 | 52 | City pickleball page, one card per venue, outdoor cards and an "Indoor Pickleball" section | 2026-09-07 |
| 20 | San Antonio, TX | 8 | 43 | Pickleball directory page + park pages: "There are 18 lighted, outdoor pickleball courts." | 2026-09-07 |
| 21 | Tallahassee, FL | 7 | 34 | City pickleball page: counts, schedules, open-play rules and a fee table on one page | 2026-09-07 |
| 22 | Albuquerque, NM | 13 | 86 | City pickleball page table: name, address, "Pickleball Complex" or "Tennis Courts with Pickleball Lines", count | 2026-09-07 |
| 23 | Las Vegas, NV | 5 | 19 | Park pages "Pickleball courts (N)" + the City's 11 March 2026 blog | 2026-09-07 |
| 24 | Boulder, CO | 5 | 29 | Racket-sports table + drop-in schedules; "first come and free to all park visitors" | 2026-09-07 |
| 25 | Naperville, IL | 3 | 25 | Naperville Park District location pages; first park-district operator | 2026-09-07 |
| 26 | St. George, UT | 3 | 46 | City pickleball page list "Little Valley / 2149 Horseman Park Drive / Courts:  33" | 2026-09-07 |
| 27 | Louisville, KY | 16 | 67 | Louisville Parks "Pickleball Court List:" ("Vettiner Park - 14") + park pages for addresses and hours | 2026-09-07 |
| 28 | Mount Pleasant, SC | 4 | 19 | Town pickleball page: Indoor and Outdoor sections with count, address, fee and session times per venue | 2026-09-07 |
| 29 | Long Beach, CA | 8 | 48 | City pickleball page, one line per park with address and "dedicated" or "dual-striped" count | 2026-09-07 |
| 30 | Wichita, KS | 10 | 53 | City pickleball page, three tabs (parks, recreation centres, Riverside Tennis Center), read in a browser | 2026-09-07 |
| 31 | Spokane, WA | 6 | 36 | City fields-and-sports page, "Tennis Courts Striped for Pickleball" and "Dedicated Pickleball Courts" lists, read in a browser | 2026-09-07 |
| 32 | Henderson, NV | 7 | 33 | City pickleball page, five count tables by heading, plus park and recreation-centre directory pages for addresses, read in a browser | 2026-09-07 |
| 33 | Lehi, UT | 6 | 16 | City parks page, one amenity sentence per park with the count and an address line | 2026-09-07 |
| 34 | Orem, UT | 3 | 22 | City park pages, count stated twice on each ("12 Pickleball Courts", "Four Lighted Pickleball Courts", "6 Pickleball Courts") | 2026-09-07 |
| 35 | Rockville, MD | 12 | 46 | City pickleball page, one table with a Number of Courts and a Lighted column, plus a place page per park for the address | 2026-09-07 |

**379 published pages:** 35 city, 275 venue, 38 filter, 26 county, 5 state.

**Six of those venues publish on a second address resolver,** added 2026-09-04:
Bellevue's Highland Park, Madison's Door Creek and Rennebohm, and Scottsdale's
Ashler Hills Park — 26 courts that the US Census address file cannot place. See
the I1 resolver-set note in `decisions.md` §6.

**Two state pages exist because two states have three published cities.**
North Carolina since Apex; Washington since Bellevue. `STATE_MIN_CITIES = 3`
and a state with no written note does not publish at all — it is removed from
the link graph so nothing can link to it (**O13**).

**Bellevue is the richest municipal source read so far.** One City page states
a court count for all fourteen venues it lists, indoor and outdoor, and states
its own default for the ones it does not mark: "Bellevue's pickleball courts
are shared use with tennis courts, unless otherwise noted." That sentence is
why twelve Bellevue venues carry a sourced note on what kind of court you are
walking onto. It also produced the first venue in the directory with a
non-zero count on both sides — Hidden Valley Park, three indoor and two
outdoor at one address, which the City lists as two entries and which is
published as one place.

**Madison is the first city that states its surfaces.** Across the seventy-four
venues published before it, five carried a verified playing surface; Madison
states one for all twenty of its outdoor venues in the same line as the count
— "Tennis & Pickleball / Courts: 2, asphalt" — eighteen asphalt and two sport
court tile. It is also the first city where an operator explains what a
dual-striped court costs you: "Dual-striped courts use a tennis net which is
about 2" taller than a standard pickleball net."

**What "Courts: 8" means was settled by the City's own exception.** Reindahl
Park reads "Courts: 8, asphalt; 4 striped for pickleball", so where only some
courts carry pickleball lines Madison says so, and an unqualified count is a
count of courts you can play on. Reindahl is not published — its address does
not resolve — but its snapshot is committed and the run asserts that line
still exists, because every other count in the city rests on it.

**Three venues were refused for eighteen courts; two came back.** Door Creek,
Reindahl and Rennebohm are all on the City's pickleball list with counts and
surfaces, and the Census geocoder resolves none of their addresses. On
2026-09-04 Import Gate I1 gained a second resolver and Door Creek and
Rennebohm resolved at house-number level, publishing fourteen courts including
Door Creek's eight — the largest outdoor count in Madison. Reindahl still does
not resolve, and its eight courts are still refused. A rule that had admitted
all three would have been written to reach a wanted answer.

**Warner Park is two venues where Bellevue's Hidden Valley was one,** and the
difference is the operator rather than convenience: the Warner Park Community
Recreation Center has its own pages, ID card, membership and booking system,
and the outdoor courts have none of those. Its five indoor courts are also the
first bookable pickleball courts anywhere in this directory — nine cities in,
every other verified court is first come, first served.

**Austin is the city that answers the lighting question.** Eleven of its
twenty-one venues carry the words "Lighted during park hours" on the City's
own page. Before Austin, forty-three of the ninety-five venues in this
directory had a lighting answer either way and more than half of those came
from one Seattle GIS layer with a column for it — so Austin is the first
operator to state it venue by venue in prose at any scale, and its /lights/
page is the first in the directory built from sentences rather than a
database field.

**It is also one of the operators that says a net is NOT provided.**
Brentwood, Rosewood and Springwoods carry "bring your own portable net" or
"Nets not included." Every other city across nine cities has left that field
unknown, which is a different answer from no.

**Austin publishes hours for every venue, and the exceptions are the
product.** Fifteen run 7 a.m. to 10 p.m. daily. Pan American loses its courts
to roller derby on Tuesday and Thursday evenings and weekend mornings from
9 a.m. — a named competing use with exact times, which no other operator in
this directory has published. Austin High follows the school calendar under
an AISD sharing agreement. Hancock closes for four hours in the middle of a
term-time weekday.

**Saint Paul is the first city that publishes no list.** Every operator
before it had a page naming its pickleball venues. Saint Paul's pickleball
page links an interactive map and a PDF and names nothing, so the venue set
had to be assembled: candidate site names from the City's own pickleball GIS
layer, then a court count and a street address from each candidate's facility
page. Nothing publishes on the layer alone — it is one point per court with
no count and no address, and counting map points to produce a court total is
the derivation this project falsified for Sacramento.

**The City's two records of its own courts disagree, in both directions.**
Eight sites the layer marks for pickleball — Baker, Carty, Eastview, Hazel
Park, Mattocks, Prosperity Heights, Rice and Martin Luther King — state no
count on their facility pages. Two that do state one, Clayland Park and
Edgcumbe Recreation Center, appear nowhere in the layer. The pages decide
what publishes, because the pages are what state a number, and the
disagreement is written onto the city and county pages rather than resolved
silently.

**The most interesting venue in the city could not be published.** Assembly
Union Park's three courts are, in the City's words, the first dedicated
pickleball courts in the Saint Paul park system — and the Census geocoder
returns no match for 875 Mount Curve Boulevard. Everything that did publish
is an overlay on a tennis court.

**Outdoor is proven, not assumed.** At the two recreation centres the
pickleball line sits under the page's "Outdoor Amenities:" heading rather
than "Indoor Amenities:", and the run checks that placement on every build
rather than remembering it.

**Scottsdale is the first operator that says how to share a court.** Every
other city in this directory answers "how many courts" and stops. Each
Scottsdale park page publishes the rule — standard game to 11, win by two, a
30-minute limit, "at which time players should rotate off the court with any
waiting players" — and then states something no operator had published
anywhere in eleven cities: **a peak time.** "Mornings are typically the
busiest time for pickleball play at Cholla." The peak_hours slot on every
city page before this one was written out of rules and inference because
there was nothing else to write it from.

**Every published Scottsdale court is lit; three of four are free.** All four
venues carry "lighted" in the City's court count and again in their own park
page's feature list. Three also carry "They are free to use" on their park
pages, which makes Scottsdale only the second city with any verified `free`
at all after Portland; Ashler Hills' page names its courts and never mentions
cost, so it publishes with the price unstated. That gives the directory its
second `/free/` filter page, carrying three of the city's four venues, and a
`/lights/` page carrying all four.

**A venue is published closed.** Thompson Peak Park's three courts were shut
for resurfacing from 17 August to 11 September 2026, and this run was made on
4 September. The closure sentence is asserted, so when the City takes it down
the build fails — a directory carrying a stale closure is worse than one
carrying none.

**Two of five were refused; one came back.** Ashler Hills Park has eight
courts and an address the Census address file has no record of; it publishes
from 2026-09-04 on the second resolver, which places 32220 N. 74th Way at its
house number. Scottsdale Community College has six lighted courts hosting a
free City-run public programme, and the geocoder places its address in **no
incorporated place at all** — it is not inside Scottsdale. A city operating a
programme somewhere does not move that somewhere into the city, which is the
same test that kept a THPRD set out of Beaverton. That leaves four venues.

**Two City park pages print a malformed postcode** — "Scottsdale, AZ 32220"
at Ashler Hills and "Scottsdale, AZ 20199" at Thompson Peak, the street
number where the postcode belongs. Recorded because it is the City's own
record, not because it changed what we published.

**Two structural things this city forced:**

- **Assertions had to become per venue rather than per page.** "Lighted
  during park hours" appears eleven times on one page and the standard
  open-play line fifteen. Checking that a string exists somewhere in the
  snapshot would have proved nothing about which park it belonged to — a
  lighting claim could have survived being moved between parks. The run
  splits the list into one block per venue, cut at the venue names, and
  asserts every fact inside its own block.
- **`venueTitle()` could not fit a real venue's name.** "Austin Tennis and
  Pickleball Center at Walnut Creek Sports Park" is 63 characters; with the
  fixed " - Pickleball Courts" suffix the title was 83 with both location
  tokens already dropped, and the build failed on the largest venue in the
  city. The suffix is now droppable too and, because the assembler takes the
  rightmost droppable first, it goes last: state, then city, then suffix.
  A title that is just the venue's name is weaker and honest; refusing to
  publish a venue because its operator gave it a long name is neither. This
  is the second time that module has been widened by a real name — Portland's
  East Portland Community Center was the first.

**Two counties, one city.** Nineteen Austin venues are in Travis County and
two are in Williamson, so Travis gets a county page and Williamson does not.
The county comes from the geocoder per venue rather than from an assumption
that a city sits in one — the first time in this directory that has mattered.

**What Austin publishes and this run did not take.** The same page carries a
second section, "Pickleball Programming at Rec Centers", listing indoor
courts at eight recreation centres with session times and addresses without
postcodes. It is real, sourced and unverified, and it is named on the city
page as an open gap rather than left as a silence.

**Two more things Madison broke:**

- **The identity quarantine caught a second sourced venue,** exactly as it had
  in Bellevue: two imported rows claimed `tenney-park`, 301 metres apart on
  one 38-acre park. `data/identity/resolutions.json`, built the same day for
  Hillaire Park, took the second entry without modification — which is the
  first evidence that the mechanism generalises.
- **`venuePagePublishes()` said yes about a venue that did not exist.** It
  asked only whether editorial notes were complete, so a venue held by the
  identity pass still read as publishable; the city page's best-for block
  trusted it and rendered a link to a URL with no page behind it. No build
  step failed. The crawl report caught it by reading the built HTML, which is
  why that report reads files instead of asking the code. The predicate now
  checks the venue is in the city's published set as well.

**Three things Bellevue broke, and what each cost:**

- **The identity quarantine refused a sourced venue.** Two imported rows
  claimed the slug `hillaire-park`, so the identity pass held both — and
  Hillaire Park could not publish despite the City stating three courts at an
  address that geocodes. The audit's own header said such collisions "go to a
  review queue", and the queue had nowhere to send an answer back to.
  `data/identity/resolutions.json` is now that place: a resolution names which
  row keeps the slug, with a basis and a source, and the audit throws if it
  names a row that is not in the collision, leaves a member unaccounted for,
  or settles a collision that no longer exists.
- **The completeness dashboard was reading the pre-verification dataset.** It
  printed "Metros ready to publish: 0 of 100" on a day the site published 39
  venues in Washington alone, because it read `data.csv` and never applied the
  verified overlay. It now applies it — and the first attempt at that fix was
  worse than the bug: the overlay appends minted venues, so the array grew
  past the county derivation it is indexed against, the length guard fell
  through, and every venue in the country failed Import Gate I3. It still
  printed a number. Fixed properly, it reads **5 of 100 ready**, and says
  which published cities are outside the queue and why.
- **A published claim was false.** Vancouver shipped with "the first stated
  NEGATIVE on lighting in this directory" on a live venue page. Seattle had
  shipped a day earlier from an ArcGIS layer whose `LIGHTED` field reads "No"
  for nineteen of its twenty-four venues — stated, sourced and dated. The
  claim came from reading the cities whose sources are prose and forgetting
  the one whose source is a table. Corrected on the venue page, the city page
  and in the run that generates them, with the correction left on the record
  rather than quietly removed.


**Lincoln, NE is city #13, and the most dedicated courts on the site.** The
City sorts its own parks into "Dedicated Pickleball Courts" and "Dual Striped"
and counts them in prose — "Includes ten courts dedicated to pickleball play."
Sixteen of the twenty-two published courts are dedicated rather than striped
onto tennis, a higher proportion than any other city here, and Peterson
(Erwin) Park's ten are the largest dedicated set in the directory. All three
parks publish hours, 5:00 a.m. to 11:00 p.m. daily.

**Its operator keeps two records that disagree, and Saint Paul's rule settled
it.** The Tennis and Pickleball page counts four venues; the parks' own pages
in Parks A to Z mention pickleball at only two. The record that states a
number publishes, and the disagreement goes on the page: Ballard and Densmore
say on their own venue pages that the count rests on one City page alone. The
run asserts that ABSENCE, so the day a park page starts naming pickleball the
build fails rather than serving a caveat that has expired.

**Densmore's six is the City's arithmetic, not ours** — "two dedicated
pickleball courts; 2 dual striped (can be used as 4 pickleball courts)". Two
plus four, both figures written by the City. Tyrrell Park's "one dedicated
tennis court; one dual striped" counts TENNIS courts and yields no pickleball
number, so Tyrrell does not publish.

**Eden Park refused, and it is the expensive one.** Six dedicated courts, and
the only Lincoln park whose own page lists Pickleball among its features.
Neither resolver finds "46 Antelope Creek Rd", and the City's own description
places the park "near 46th and Antelope Creek Road" — an intersection. Same
shape as Vancouver's Fisher Basin. Its park page publishes coordinates and
they are deliberately not used as a substitute: swapping a latitude in for an
address the day the rule costs six courts would be a rule rewritten to reach a
wanted answer.

**The nearest miss on lighting yet.** Densmore's page reads "Lights: MUSCO
(2000). Tournament quality" — under a heading describing the four ballfields
the City rents out. No Lincoln venue publishes a lighting answer.

**First city behind a bot wall.** www.lincoln.ne.gov sits behind Akamai, which
answers a bare curl with a 488-byte deny page. `scripts/verify/fetch/lincoln.sh`
sends the header set a browser sends and gets the real document. The snapshots
are committed and every assertion reads those rather than the network.

---

## Blockers still open

Phases 0 through 6 are complete and thirty cities are published. What stands
between here and the 50–100 metro target is not missing code.

| Blocker | Where tracked | Effect |
| --- | --- | --- |
| **O11** — where verification data comes from | `decisions.md` §9 | **Answered twenty-nine times, city by city, and still open as a general question.** Every published city came from its own operator publishing court counts: two ArcGIS layers and twenty-seven sets of operator web pages (twenty-six municipal, one park district). No general method has been found and none is likely — the next city is another search. Mesa did narrow the search in one respect, which is recorded below: a 403 in this file was a fact about one day, not a property of the operator. |
| **O1** — controlled vocabulary for `access_type` | `decisions.md` §9 | `/public/` is a locked filter slug (D4) with no lawful data driver. The other four filters have one. |
| **O2** — provenance of `rating` / `user_rating` | `decisions.md` §9 | All three rating fields are QUARANTINED. No `AggregateRating` may be emitted until their origin is known. |

Resolved since Phase 0: **§8** (the eight decisions, supplied and locked
2026-09-03), **O8** (word-band checker and its counting definition), **O12**
(CSS and design system, `app/globals.css`) and **O10** (canonical hostname,
closed 2026-09-04 and recorded in `DEPLOYMENT.md`).

## The sequencing rules that bound every phase

Reproduced from `decisions.md`. These are not scheduling advice.

1. **Verify and publish 50–100 metros to a complete standard, prove the
   template ranks, and only then release more of the dataset in waves.** All
   three competitors scaled before proving, which is why 20,000+ pages
   produce so little for two of them.
2. **Page count is an output, never a target.** Publishing unsourced rows,
   lowering the 3-venue threshold, or putting an imported row count where a
   verified count belongs is refused, not negotiated.

## Where the 50-100 metro target stands

**35 of 50.** The sequencing rule above is the whole plan, and this is the
progress bar for it. Nothing else in this document is a schedule.

The next city is chosen the same way the last twenty-nine were: find a parks
department that publishes a court count on a page a browser with JavaScript
off can read, then verify it. Volume in the imported dataset is a tiebreak,
never a qualification. Thirty-four cities were refused
across the runs for cities #9 through #12, and the reasons are worth keeping
so nobody re-treads them:

| City | Refused because |
| --- | --- |
| Spokane, Redmond, Wichita, Greensboro, Eugene, Olympia, Tucson | The parks site refuses our fetchers with an HTTP 403, **re-confirmed 2026-09-04**. This project does not publish from a page it cannot snapshot and re-check. Most are CivicPlus sites. Spokane is the expensive one — see below. |
| Bellingham, Tacoma, Lexington KY, Jacksonville NC | The operator publishes pickleball locations and no court counts. A venue needs a verified count to exist here. |
| Boise | Counts for only two venues — Eagle Rock and Hobble Creek — against a three-venue threshold. Boise also has the best story of any city refused so far: twelve dedicated courts at Willow Lane and Manitou were converted back to six tennis-only courts in September 2025 after a noise lawsuit settlement. |
| Honolulu | The best court data found anywhere — 192 courts at 93 parks with counts, shared-use type and lighting in one table — and no address source. Its parks GIS layer carries names and acreage but no street addresses, so Import Gate I1 cannot be satisfied without another pass. |
| San Diego | Publishes exactly the right document — one PDF with addresses, counts and hours — as a scanned image. `pdftotext` extracts nothing from it, so no verify run could assert a quote against it. A source this project cannot re-read is a source it cannot use. |
| Round Rock, Lakeway-area TX | Names its pickleball locations and states no court counts. |
| Gilbert, Plano, Overland Park | HTTP 403, same as the eleven above. |
| Sacramento, Chandler, Ann Arbor, Knoxville | Sites respond, but the parks pages did not resolve where expected; not pursued further once Scottsdale was found. |
| Durham NC | **Retested and reachable — refused on the data instead.** Piney Wood Park states twelve dedicated courts and Bethesda enumerates six, but Garrett Road and Sherwood carry only an amenity flag, Morreene Road carries none at all despite being named on the pickleball page, and Forest Hills states "Court Number 4 - This is the first outdoor DPR site to offer Pickleball lines", which names a tennis court rather than counting pickleball ones. Two publishable venues against a three-venue threshold, which is Boise's failure mode. |
| Phoenix | Publishes a "Tennis Courts and Pickleball" layer: 163 rows across 36 properties, one row per court, with no address field and no count field. Counting the rows is the derivation this project falsified for Sacramento. Would need Saint Paul's treatment — layer for candidate names, park pages for counts and addresses — and the park pages have not been read. |
| Overland Park KS, Minneapolis | Retested alongside Mesa and Durham and still HTTP 403 to a plain request. |
| Salt Lake City, Colorado Springs | Publish court counts and no street addresses on the pages that carry them. Colorado Springs also contradicts itself: its tennis-and-pickleball list gives John Venezia Community Park eight courts and the park's own page says four. |
| Frisco TX, Lexington KY, Jacksonville NC, Milwaukee County | Have a park layer with addresses and a pickleball FLAG rather than a count — "Pickleball"/"Yes"/"No". A flag is not a number. |
| Gresham OR, Lake Oswego OR | Two venues and one venue respectively, against a three-venue threshold. |
| Wake Forest NC | Three court sets and only two publishable venues: Joyner Park Community Center sits outside the town's corporate limits per the Census, the same test that excluded Scottsdale Community College. |
| Hillsboro OR, Minneapolis | HTTP 403. |
| Fort Collins CO | **Reachable, and refused on its records.** Its Park Features page is a Telerik/ASP.NET application that paints the amenities in by script, so a snapshot of it contains no pickleball at all, and guessed park-page URLs 404. The City's own pickleball page publishes city-wide AGGREGATES — "(8) dedicated outdoor pickleball courts", "(44) striped for pickleball on outdoor multi-use courts" — and no per-venue count. A total is not a venue. |
| Phoenix | Publishes a "Tennis Courts and Pickleball" layer: 163 rows across 36 properties, one row per court, no address field and no count field. Counting the rows is the derivation falsified for Sacramento. Would need Saint Paul's treatment and the park pages have not been read. |
| Naples, Sarasota, St. Petersburg, Clearwater, Gainesville FL; Tempe, Peoria, Glendale, Goodyear AZ; Loveland CO; Henderson, Reno NV; Provo UT; Omaha NE; Des Moines IA; Kansas City MO; Fargo ND; Cedar Park TX; Everett, Renton, Issaquah WA; Salem, Tigard OR | HTTP 403 or a bot challenge to both a bare curl and the full browser header set, **2026-09-07**. Denver answers with an F5 block page. A 403 is a fact about one day; these are the day's. |
| Fort Myers FL | One venue with a count (the Racquet Club, six courts); the CivicPlus facility directory serves five facilities to a fetcher and pages the rest by script. |
| Orlando FL | Counts and addresses on different pages and only two solid venues; the third is a table row ("4 - pickleball" at "East Park") with no directory page behind it. |
| Surprise AZ, Sandy UT | JavaScript-painted: a snapshot of the pickleball page holds the navigation and nothing else. |
| Aurora CO, Bloomington MN, San Diego | The per-venue data exists only in a PDF. Bloomington's (June 2020) lists a count and an address for about twenty-three parks and would be the strongest source in its batch if a PDF were a re-checkable source here; it is not, yet. |
| Columbus OH, Tulsa OK, Fort Collins CO | City-wide aggregates only ("118 pickleball courts at 35 locations", "32 new pickleball courts"). A total is not a venue. |
| Indianapolis, Carmel IN, Sioux Falls SD, Fort Worth TX | A flag, not a number: park pages say "pickleball courts" with an address and never a count. Fort Worth lists about forty-five parks this way. |
| Fishers IN, Sugar Land TX, Bend OR, Sammamish, Bothell WA, Gresham OR | Fewer than three venues with a stated count. Sugar Land has two good ones (City Park, "4 lighted tennis/pickleball courts, 4 dedicated pickleball courts"; Park at the Levee, two). Bend has one 24-court complex and two parks that say "a pickleball court". |
| Rochester MN, Oklahoma City, Grand Rapids MI, Georgetown TX, Edmond OK | No readable per-venue page: a POST-filtered directory, a leagues-only page, no page at all, a dead DNS name, a 522. |
| **Los Olivos Community Park, Irvine** | Refused inside a published city: the City's pickleball page says two courts, its park page says "3 Lighted Pickleball Courts". The record-that-states-a-number rule cannot choose between two numbers. |
| **Chandler AZ** | Reachable, and refused on its addresses. The City states counts at five parks — "featuring six courts" at Arrowhead Meadows, "This single pickleball court" at Arbuckle, La Paloma and Brooks Crossing, and Tumbleweed's "18 outdoor courts with LED lighting" — and only two of them resolve. Tumbleweed's "2041 S. Pioneer Parkway" fails both resolvers for the third time; Arbuckle carries two City house numbers (1100 and 110 S. Norman Way) and neither resolves; and Arrowhead Meadows is Foster Park over again: the City writes "1475 W. Erie St." in 85224, the Census answers East Erie in 85225, and OpenStreetMap has no record of the address as written. Two publishable venues against a three-venue threshold. The run (`verify:chandler`) records all of it and throws below the threshold. |
| Chapel Hill, Wilmington, Winston-Salem NC; Greenville SC; Arlington VA; Nashville, Franklin TN; Alpharetta GA; San Jose, Sunnyvale, Santa Clara, Fremont, Anaheim CA; Broken Arrow OK; Olathe, Lenexa KS | HTTP 403 or a bot challenge, 2026-09-07. |
| Asheville NC, Charleston SC | Reachable; parks named, no per-venue count ("Courts lined for tennis and pickleball (lighted)"). |
| Huntsville AL, Ankeny IA, Sugar Land TX | Two countable venues each against a three-venue threshold (Huntsville: John Hunt Park "24 outdoor covered and lit competitive-play pickleball courts" and West Huntsville "four lighted outdoor pickleball courts"; Ankeny: Rally Complex "12 stand-alone, lighted pickleball courts" and Albaugh "three pickleball courts in the gym"). |
| Virginia Beach VA, Georgetown TX, Pflugerville TX | Unreachable, a wrong TLS certificate, and a JavaScript-only facilities app respectively. |
| Bloomington MN | One hundred park pages read; one states a count (Dred Scott, "6 pickleball courts"). The June 2020 PDF map would qualify if a PDF were a re-checkable source here. |
| Overland Park KS, Tucson AZ | **Read in a browser at last, and refused on the data.** Both sites still 403 every scripted fetch; both loaded in Chrome. Overland Park's pickleball page names four parks with addresses and states no count — only Maple Hills' prose says the City "added two pickleball courts" — and each park page carries a "Pickleball Court" amenity flag. Tucson's park pages carry "Pickleball Courts" in a features list and nothing else; the only per-park numbers found (Udall 12, Gollob 4, Palo Verde 6) sit in a proposed fee-schedule PDF. A flag is not a number, twice over. |
| St. Petersburg FL, Plano TX, Greensboro NC | Block scripts, open in a browser. St. Petersburg's courts directory lists eleven sites with a pickleball flag and an address; the counts would have to come from eleven park pages read one at a time in a browser, and they were not read once Henderson qualified. Plano and Greensboro were not read in the browser this session. Leads, not refusals. |
| Meridian ID | Reachable, and one venue short after the addresses. Homecourt states "We currently have 14 pickleball courts" indoors at 936 Taylor Ave., Discovery Park "has 6 Pickleball Courts" at 2121 E. Lake Hazel Road, and both resolve; Reta Huskey Park's "Three Non-Reservable Pickleball Courts" at "2887 Tubac Drive" resolve in neither resolver. Settlers Park's "Courts 1-6 and 8-10 are lined for pickleball" is a court-number enumeration that needs arithmetic to become nine, which this project has not ruled on. Two clean venues against a three-venue threshold; held, with its snapshots in `data/sources/meridian/`. |
| Chesapeake VA, Pembroke Pines FL | **Qualified and held**, both scouted on 2026-09-07 and neither yet run. Chesapeake's tennis-and-pickleball page states four park venues as "N courts with Pickleball lines - Lighted/No lights" with a lighting sentence for the whole system and house numbers on each facility page. Pembroke Pines states "4 Pickleball Courts Available", "8 Pickle Ball Courts Available" and "4 Pickle Ball Courts Available" with addresses and hours on one page — exactly three venues, so one geocoder miss would sink it. The next batch's first two leads. |
| Columbia SC, Palm Beach Gardens FL | Two venues with a stated count and a house number each (Columbia: Finlay Park "four Pickleball Courts" priced by the hour, Southeast Park "4 pickleball courts"; Palm Beach Gardens: the Tennis & Pickleball Center "10 Pickleball Courts", Lilac Park "24 Pickleball Courts"). Palm Beach Gardens fails on addresses rather than counts: "4404 Burns Road" on every park page is the City's own footer, Lilac's street address exists only inside a map iframe, and Russo's only on a youth-camp page. |
| Ogden UT, Chattanooga TN, Memphis TN, Birmingham AL, Richmond VA, Roanoke VA | Reachable and no per-venue count: Ogden's fifty-five park pages say "Pickleball Court"; Chattanooga states one (Batters Place, "four pickleball courts") and lists its community centres without a number; Memphis says "courts for pickleball"; Birmingham, Richmond and Roanoke publish no pickleball court page at all. |
| Nampa ID, Port St. Lucie, Boca Raton, Delray Beach, Coral Springs, Ocala FL, Baton Rouge LA | HTTP 403 to a bare curl and to the full browser header set, 2026-09-07. Lakeland FL and Savannah GA did not answer TCP at all. |
| Draper UT, Lakeland FL, Savannah GA and the rest of the East list (Pittsburgh, Rochester, Syracuse, Providence, Worcester, Manchester, Burlington, Cincinnati, Cleveland, Dayton, Fort Wayne, Lansing) and West list (West Jordan onward) | Not tried; both scouts stopped at three qualifiers. |
| **Sky Prairie Park, Spokane; six Henderson venues; five Lehi parks; Twinbrook and Glenora, Rockville** | Refused inside published cities, all on addresses: Sky Prairie's "8501 N. Nettleton Ct.", Henderson's Blooming Cactus, Dundee Jones, Montagna, Whitney Mesa, Weston Hills and the Downtown Recreation Center, Lehi's Shadow Ridge, Salix, South Creek and Spring Creek (Northridge also fell to the Chandler label rule, "a pickleball court"), and Rockville's Twinbrook Park resolve in neither resolver; Rockville's Glenora Park is "Dundee Road and Wootton Parkway", an intersection. Henderson's Whitney Ranch Recreation Center is listed under "PICKLEWALL", a wall, not a court. Every one is asserted unresolved in its run, so a resolver that learns the address fails the build and reopens the venue. |

**The six leads recorded on 2026-09-07 all published the same day as cities
#21 to #26** — Tallahassee, Albuquerque, Las Vegas, Boulder, Naperville and
St. George — with the refusals each one predicted: Four Oaks (Tallahassee)
still does not resolve; Albuquerque's two older lists turned out to be an
HTML comment that never renders, so the Los Olivos rule did not apply and
its four disputed venues published from the one visible table (three
others were refused on address); Las Vegas lost Police Memorial and Bill
Briare on address; Naperville lost Wolf's Crossing, DuPage River and
Frontier on address and publishes at exactly three; St. George's grid
address resolved. Cities #27 to #30 came from a fresh scout the same day
(Louisville, Mount Pleasant, Long Beach) and, at the owner's request,
Wichita — read in a browser on the Cary route after a second day of 403s.
Chandler was verified in the same batch and fell to two venues on its
addresses; see the refusals table.

Honolulu was re-checked on 2026-09-04 against the City & County's own GIS
rather than against memory, and it is **still blocked for the same reason**.
Its five park layers — Regional, District, Community, Neighborhood and Beach
Parks — carry `PARK_NAME`, `PARK_TYPE`, `LEGAL_ACRE` and a tax map key, and
no street address field of any kind. The second resolver added on
2026-09-04 does not help, because there is no address string to resolve.
Honolulu needs an address SOURCE, not a better geocoder, and none has been
found.

## A 403 is a fact about one day

Sixteen cities were refused because a parks site answered our fetcher with
HTTP 403 - by a wide margin the largest single refusal group, and the one
that looked most like a permanent property of those operators. It was not,
and the whole bucket has now been retested.

| result | cities |
| --- | --- |
| **reachable now** | Mesa, Durham, Kirkland, Fort Collins |
| still refusing scripts, since read in a browser | Spokane (published as #31), Wichita (#30), Overland Park and Tucson (refused on the data) |
| still refusing, not yet read | Greensboro, Redmond, Eugene, Olympia, Minneapolis |

Four of sixteen, and two of the four published: **Mesa as city #14 and
Kirkland as city #15**. Durham was reachable and then refused on its data
instead - two publishable venues against a three-venue threshold. Fort
Collins was then read and refused as well, so the bucket is fully worked
out: see the refusals table.

The tidy explanation was the wrong one. Lincoln shipped
`scripts/verify/fetch/lincoln.sh` to defeat an Akamai 403 with a browser
header set, and it would have been satisfying to credit that tool. A **bare
curl** with no special headers reaches Mesa, Durham and Kirkland today;
neither published city needed a fetch script. Whatever refused us in the
earlier runs simply stopped.

**Spokane is the residue and it is the expensive one.** It publishes a court
count and a street address for twelve parks - A.M. Cannon, Comstock, Corbin,
Franklin, Friendship, Grant, Mission, Peaceful Valley, Sky Prairie,
Underhill, Westgate and Coeur d'Alene - which is among the best municipal
pickleball data found anywhere in this project. It refuses a bare curl, and
it refuses a full browser header set. It is the most valuable page in
Washington that we cannot read, and it stays refused.

The lead is now spent: the cheap half of that bucket has been taken. What
remains is nine sites that genuinely will not answer, and the lesson worth
keeping is the general one - a refusal recorded against a site is a dated
observation, not a verdict.

## Tagging convention

One annotated tag per completed phase: `phase-0`, `phase-1`, … The tag lands
on the commit where that phase's work and its documentation are both present,
so checking out a tag gives a coherent snapshot rather than code without its
record.

Cities and state pages carry their own tags in the same spirit —
`city-2-raleigh` through `city-35-rockville`, `state-1-nc`, `state-2-wa`, `state-3-fl`, `state-4-ca`, `state-5-ut` — so a
publication can be diffed on its own. Cities 6 and 7 shipped without tags;
that is a gap in the record, not a different convention.
