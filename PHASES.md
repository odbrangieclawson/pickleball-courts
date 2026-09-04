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

Eight cities, three states, five counties, two state pages. Every page below
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

**171 published pages:** 12 city, 129 venue, 19 filter, 9 county, 2 state.

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

**It is also the first operator anywhere to say a net is NOT provided.**
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

---

## Blockers still open

Phases 0 through 6 are complete and twelve cities are published. What stands
between here and the 50–100 metro target is not missing code.

| Blocker | Where tracked | Effect |
| --- | --- | --- |
| **O11** — where verification data comes from | `decisions.md` §9 | **Answered twelve times, city by city, and still open as a general question.** Every published city came from its own operator publishing court counts: two ArcGIS layers and ten sets of municipal web pages. No general method has been found and none is likely — the next city is another search, and the last four took thirty-four refusals between them. |
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

**12 of 50.** The sequencing rule above is the whole plan, and this is the
progress bar for it. Nothing else in this document is a schedule.

The next city is chosen the same way the last twelve were: find a parks
department that publishes a court count on a page a browser with JavaScript
off can read, then verify it. Volume in the imported dataset is a tiebreak,
never a qualification. Thirty-four cities were refused
across the runs for cities #9 through #12, and the reasons are worth keeping
so nobody re-treads them:

| City | Refused because |
| --- | --- |
| Spokane, Redmond, Wichita, Durham, Greensboro, Eugene, Olympia, Kirkland, Mesa, Tucson, Fort Collins | The parks site refuses both of our fetchers with an HTTP 403. This project does not publish from a page it cannot snapshot and re-check. Most are CivicPlus sites. |
| Bellingham, Tacoma, Lexington KY, Jacksonville NC | The operator publishes pickleball locations and no court counts. A venue needs a verified count to exist here. |
| Boise | Counts for only two venues — Eagle Rock and Hobble Creek — against a three-venue threshold. Boise also has the best story of any city refused so far: twelve dedicated courts at Willow Lane and Manitou were converted back to six tennis-only courts in September 2025 after a noise lawsuit settlement. |
| Honolulu | The best court data found anywhere — 192 courts at 93 parks with counts, shared-use type and lighting in one table — and no address source. Its parks GIS layer carries names and acreage but no street addresses, so Import Gate I1 cannot be satisfied without another pass. |
| San Diego | Publishes exactly the right document — one PDF with addresses, counts and hours — as a scanned image. `pdftotext` extracts nothing from it, so no verify run could assert a quote against it. A source this project cannot re-read is a source it cannot use. |
| Round Rock, Lakeway-area TX | Names its pickleball locations and states no court counts. |
| Gilbert, Plano, Overland Park | HTTP 403, same as the eleven above. |
| Sacramento, Chandler, Ann Arbor, Knoxville | Sites respond, but the parks pages did not resolve where expected; not pursued further once Scottsdale was found. |
| Salt Lake City, Colorado Springs | Publish court counts and no street addresses on the pages that carry them. Colorado Springs also contradicts itself: its tennis-and-pickleball list gives John Venezia Community Park eight courts and the park's own page says four. |
| Frisco TX, Lexington KY, Jacksonville NC, Milwaukee County | Have a park layer with addresses and a pickleball FLAG rather than a count — "Pickleball"/"Yes"/"No". A flag is not a number. |
| Gresham OR, Lake Oswego OR | Two venues and one venue respectively, against a three-venue threshold. |
| Wake Forest NC | Three court sets and only two publishable venues: Joyner Park Community Center sits outside the town's corporate limits per the Census, the same test that excluded Scottsdale Community College. |
| Hillsboro OR, Minneapolis | HTTP 403. |

Honolulu remains the one worth returning to: its court data is the best found anywhere and only its addresses are missing.

## Tagging convention

One annotated tag per completed phase: `phase-0`, `phase-1`, … The tag lands
on the commit where that phase's work and its documentation are both present,
so checking out a tag gives a coherent snapshot rather than code without its
record.

Cities and state pages carry their own tags in the same spirit —
`city-2-raleigh` through `city-12-saint-paul`, `state-1-nc`, `state-2-wa` — so a
publication can be diffed on its own. Cities 6 and 7 shipped without tags;
that is a gap in the record, not a different convention.
