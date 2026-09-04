# decisions.md

**Status: Phases 0-2 complete. Locked sections are IMMUTABLE.**

This file is the constitution of the project. Sections marked **IMMUTABLE**
are reproduced verbatim from the project brief and are not editable by
implementation work, by refactors, or by convenience. Changing one is a
deliberate act that requires the project owner, and it goes in the change log
at the bottom with a date and a reason.

Sections marked **OPEN** are decisions that have not been made yet. They are
listed here so that nothing silently defaults.

Phase status lives in [PHASES.md](./PHASES.md), not here.

Machine enforcement, where it exists, is named next to the rule. A rule with
no named enforcer is currently honoured by review only.

---

## 1. The URL pattern — IMMUTABLE

**NEVER PROPOSE A CHANGE.**

```
/pickleball/us/{state}/
/pickleball/us/{state}/{county}-county/
/pickleball/us/{state}/{city}/
/pickleball/us/{state}/{city}/{indoor|outdoor|free|public|lights}/
/pickleball/us/{state}/{city}/{venue}/
/pickleball-gear/{category}/
```

The `/us/` segment exists so other countries can be added later without a
migration.

> **Enforced by:** `scripts/validate-keyword-map.mjs`, which holds this list
> as `LOCKED_URL_PATTERNS` and fails the build if `keyword-map.json` declares
> any pattern not on it. A dropped `/us/` segment fails there.

## 2. The five filter slugs — IMMUTABLE

```
indoor
outdoor
free
public
lights
```

Exactly five indexable filter pages per city. Every other facet is a noindex
query parameter (Rule 4).

> **Enforced by:** the locked pattern list above. Adding a sixth filter URL
> fails the validator.

## 3. URLs never change after launch — IMMUTABLE

**Once a URL is published it is permanent. URLs are never changed, never
renamed and never removed. The only permitted response to a URL that must
move is to ADD a 301 redirect to the new location, leaving the redirect in
place indefinitely.**

This is not a style preference. Pickleheads currently serves hard 404s on
pages worth 1,475 and 463 visits per month. That is the single most
expensive, most avoidable error visible in the competitive set, and this rule
exists to make it structurally impossible here.

## 4. Word bands — IMMUTABLE

```
city    1,200 - 2,000
venue     700 - 1,200
county    900 - 1,500
filter    600 - 1,000
state   3,000 - 5,000
```

> **Enforced by:** `lib/page/words.mjs`, which holds `WORD_BANDS` and the
> definition of what counts as a word. Page Gate 4 in `lib/page/gates.mjs`
> fails any page outside its band. This closed **O8**.

## 5. The fourteen rules — IMMUTABLE

1. Every page renders its full content, links and schema in raw HTML with
   JavaScript disabled. No exceptions.
2. Every count comes from one shared module, getCounts(scope). No page
   computes its own number. Titles, meta, headings, body and schema all read
   from it.
3. Template the sentence, not the paragraph. Slot-filled sentences are fine.
   Boilerplate paragraphs with a city name swapped in are not. Every page
   needs at least three specific, non-templatable sentences.
4. Exactly five indexable filter pages per city: indoor, outdoor, free,
   public, lights. Every other facet is a noindex query parameter.
5. Word bands, enforced: city 1,200-2,000 | venue 700-1,200 | county
   900-1,500 | filter 600-1,000 | state 3,000-5,000.
6. Nulls render as "Not verified yet" with a help-us-verify link. Never 0,
   never "N/A", never a guess. Booleans are tri-state; never coerce null to
   false.
7. Every published fact has a source_url and a date_checked, both visible.
8. A city, county or filter page requires 3 or more VERIFIED venues to exist
   at all. Imported rows do not count toward the threshold.
9. One primary keyword per URL, enforced by keyword-map.json at build time.
   The build fails on a collision.
10. Slugs never use numeric duplicate suffixes. Resolve collisions with real
    disambiguation, never with -2.
11. CLAIMED IS NOT VERIFIED. An owner claim is an identity event; a
    verification is a provenance event. They never share a field, and a claim
    never satisfies a data gate.
12. Every imported row is status=pending until it has a verified address, a
    verified court count, a source_url and a date_checked.
13. total_courts must equal indoor_courts + outdoor_courts whenever all three
    are present. The build fails on mismatch.
14. covered is not indoor, and climate_control is not indoor. Only
    indoor_courts drives the /indoor/ filter.

### Enforcement status of the fourteen rules

| Rule | Enforced by | Status |
| --- | --- | --- |
| 1 | `scripts/check-js-off.mjs` | **Active** |
| 2 | `lib/data/counts.mjs` + `lib/data/store.mjs` + `scripts/validate-no-bypass.mjs` | **Active** — Count objects, no countable collection, build-time scan |
| 3 | Review | Manual |
| 4 | `LOCKED_URL_PATTERNS` | **Active** |
| 5 | `lib/page/words.mjs`, Page Gate 4 | **Active** (O8 closed) |
| 6 | Tri-state types in `venue.schema.json`; `scripts/lib/load-csv.mjs`; `countUnknown()` | **Active** through the data layer; renderer honours it in `lib/page/city-page.mjs` |
| 7 | Import Gate I2 in `lib/data/promote.mjs`; Page Gate 6 in `lib/page/gates.mjs` | **Active** |
| 8 | Page Gate 1 in `lib/page/gates.mjs` (`MIN_VERIFIED_VENUES`) | **Active** |
| 9 | `scripts/validate-keyword-map.mjs` | **Active** (template level); instance level inactive until data exists |
| 10 | `slug` pattern in all schemas; `scripts/identity/audit.mjs` + `lib/data/identity.mjs`; Import Gate I1 refuses a quarantined identity | **Active** — 549 numeric suffixes canonicalised, 172 in-city collisions held for review |
| 11 | Separate fields in `venue.schema.json` | **Active** in schema |
| 12 | `status` default `pending` | **Active** in schema |
| 13 | Import Gate I3 in `lib/data/promote.mjs`; `scripts/validate-data.mjs` C6 | **Active** |
| 14 | `scripts/import/mapper.mjs` keeps `covered` and `climate_control` off the indoor axis; filters derive from `indoor_courts` only | **Active** |

## 6. The four import gates — IMMUTABLE

Every row passes all four before it can be published.

**I1. Identity:** unique non-numeric-suffixed slug, name, city, state, and a
street_address that resolves.

**I2. Provenance:** source_url present and reachable, date_checked present
and inside cadence, verified_by set to one of municipal_source,
owner_submission, staff_check, user_report.

**I3. Internal consistency:** total_courts = indoor + outdoor where all
present; lat/lng inside the stated state; postal_code matches city; derived
county confidence above threshold.

**I4. Vocabulary:** fee_type, play_format, surface and venue_type all hold
values from the controlled sets. No free text in a filtered field.

> **Enforced by:** `lib/data/promote.mjs`, which is the only path from
> `status=pending` to `status=published` and refuses on any of I1-I4 with a
> per-gate reason. `scripts/validate-data.mjs` runs the same checks across
> the whole dataset in prebuild. `data/schemas/venue.schema.json` still
> encodes what a schema can: I1 slug shape, I2 field presence and enum
> membership, I4 for the four controlled fields.
>
> **The one thing still not machine-checkable:** I1 requires a
> street_address that RESOLVES and I2 requires a source_url that is
> REACHABLE. Neither is verified without a geocoder and a fetcher. Both are
> currently presence checks, and that limit is stated rather than hidden.

## 7. The six page gates — IMMUTABLE

Every page passes all six before it ships.

1. **Data threshold:** 3+ verified venues (city/county/filter); verified
   address and court count (venue).
2. **JavaScript-off render:** full content, links and schema in raw HTML.
3. **Schema completeness:** BreadcrumbList everywhere;
   SportsActivityLocation/LocalBusiness on venues; ItemList on city and
   filter pages; AggregateRating only where real; Dataset on state pages.
4. **Word band** plus three non-templatable specific sentences.
5. **Count consistency:** title, meta, H1, body and schema all match
   getCounts(), and every count is a verified count.
6. **Source and freshness:** source_url and date_checked on every fact.

> **Enforced by:** all six run in `lib/page/gates.mjs` via
> `checkPageGates()`, which no page bypasses; `scripts/build-city.mjs`
> refuses to emit a page that fails any of them. Gate 2 additionally has a
> standalone run in `scripts/check-js-off.mjs` against built HTML.
>
> **Gate 1 is what stops everything today.** With zero verified venues no
> city, county or filter page can lawfully exist, so the other five have
> nothing to run against in production. They are exercised on preview
> renders, which are marked unpublishable by construction.

## 8. The eight decisions — IMMUTABLE

**NEVER PROPOSE A CHANGE.** Reproduced verbatim from the strategy file
(v3 §8a for D1–D6; v4 §1 changelog items 4 and 5 for D7–D8, which v4 added
after the dataset arrived). These are the decisions made once and never
revisited. The fourteen rules in §5 are the operational restatement of
these eight; where the two are read together, the decision is the intent
and the rule is the instruction.

### D1 — URL PATTERN, LOCKED BEFORE LAUNCH

> ```
> /pickleball/us/{state}/{city}/{venue}/
> /pickleball/us/{state}/{city}/
> /pickleball/us/{state}/{city}/{indoor|outdoor|free|public|lights}/
> /pickleball/us/{state}/{county}-county/
> /pickleball/us/{state}/
> /pickleball-gear/{category}/
> ```
> The "us" segment exists so phase 11 can add /ca/, /au/, /uk/ without a
> migration. Once live, every change is a 301 that you maintain forever.
> Write this into decisions.md and treat it as immutable.

### D2 — EVERY COUNT COMES FROM ONE QUERY

> A single module, getCounts(scope), returns venue count, court count,
> indoor count, free count and lit count. Titles, meta, headings, body and
> schema all call it. No page ever computes its own number.
> Why: CourtSource ships 45-vs-46 and 185-vs-187 contradictions on the same
> city. It is the fastest way to look untrustworthy.

### D3 — TEMPLATE THE SENTENCE, NOT THE PARAGRAPH

> Allowed: a sentence with slots - "{Venue} has {N} {surface} courts,
> {lit or unlit}, and is {free or paid}."
> Not allowed: a whole paragraph of boilerplate with a city name swapped in.
> Each page needs at least three sentences of genuinely specific,
> non-templatable detail: a parking note, a peak-hours note, a surface
> condition note, a local quirk.
> This is the exact line between Pickleheads' readable copy and
> CourtSource's AI notes.

### D4 — FIVE INDEXABLE FILTERS, EVERYTHING ELSE NOINDEX

> Indexable, real URLs: /indoor/, /outdoor/, /free/, /public/, /lights/
> Everything else (surface, court count, sort order, distance radius) is a
> query parameter with noindex. Five is the whole list. Do not add a sixth
> without deleting one.

### D5 — WORD BANDS, ENFORCED BY THE BUILD

> ```
> City page      1,200 - 2,000 words
> Venue page       700 - 1,200 words
> County page      900 - 1,500 words
> Filter page      600 - 1,000 words
> State page     3,000 - 5,000 words
> ```
> Under the floor means the page does not publish. Pickleheads' court pages
> sit at 656 words; your floor of 700 is deliberately just above it.

### D6 — HONEST GAPS, NEVER FAKE ZEROS

> A null renders as "Not verified yet" with a "help us verify this" link -
> never as 0, never as "N/A", never as a guess. Every published fact carries
> a source URL and a date-checked value, both visible on the page.

### D7 — CLAIMED IS NOT VERIFIED

> The listing product means owners will claim venues. A claim is an
> identity event; a verification is a provenance event. They never share a
> field. If a claim can flip the verified flag, then the headline verified
> count - the entire value proposition, exactly as findswimmingholes uses
> "1,216 Verified Places" - becomes whatever venue owners type in.

### D8 — VERIFIED COUNTS ONLY IN TITLES

> A city with 22 imported rows and 6 verified venues has a title that says
> 6. The imported row count never appears anywhere a user or crawler can
> see it. Holding 18,038 rows creates constant pressure to publish the
> bigger number, which is precisely how PlayPickleball ended up with 5,750
> dead city pages.

### Where each decision is enforced

The decision is the authority. The rule is how it is written as an
instruction, and the enforcer is the code that makes it non-optional.

| Decision | Rules | Enforced by | Status |
| --- | --- | --- | --- |
| **D1** URL pattern | §1, R4 | `scripts/validate-keyword-map.mjs` (`LOCKED_URL_PATTERNS`) | **Active** |
| **D2** One count query | R2 | `lib/data/counts.mjs` (Count symbol) + `lib/data/store.mjs` (no countable collection) + `scripts/validate-no-bypass.mjs` | **Active**, 3 layers |
| **D3** Sentence not paragraph | R3 | `lib/page/editorial.mjs` + Page Gate 4 in `lib/page/gates.mjs` (3 specific sentences, cross-page duplicate detection) | **Active** |
| **D4** Five filters | §2, R4 | `LOCKED_URL_PATTERNS`; a sixth filter URL fails the validator | **Active** |
| **D5** Word bands | §4, R5 | `lib/page/words.mjs` (`WORD_BANDS` + the counting definition that closed O8) | **Active** |
| **D6** Honest gaps | R6 | tri-state types in `data/schemas/venue.schema.json`; `countUnknown()` in `lib/data/counts.mjs`; null-preservation in `scripts/lib/load-csv.mjs` | **Active** |
| **D7** Claimed ≠ verified | R11 | `claimed_by_owner` and `data_verified` are separate fields in the schema; `lib/data/promote.mjs` never reads a claim | **Active** |
| **D8** Verified counts only | R8, R12 | `getCounts()` draws its denominator from verified venues only; `lib/page/titles.mjs` accepts Count objects, never raw totals | **Active** |

Two decisions carry a standing pressure that no code can remove, so they
are named here rather than assumed away:

- **D4** — the imported dataset offers tempting sixth filters (surface,
  climate_control, covered, pro_shop, venue_type, price band). All are
  query parameters. Adding a sixth means deleting one.
- **D8** — 18,038 rows sit behind a published count that today is zero.
  Every request to show the larger number is refused, not negotiated.

## 9. Open decisions — NOT YET MADE

These are live. Each one blocks something specific. None has been defaulted
silently.

| # | Decision | Blocks | Notes |
| --- | --- | --- | --- |
| **O1** | Controlled vocabulary for `access_type` | The `/public/` filter page | `access_type` decides who may enter, and it drives an indexable filter page, but v4 gives it no controlled set. As free text it violates Import Gate I4 for a filtered field. The other four filters have a clean driver: `indoor_courts` for indoor, `outdoor_courts` for outdoor, `fee_type=free` for free, `light=true` for lights. `public` alone does not. |
| **O2** | Provenance of `rating`, `user_rating`, `review_count` | `AggregateRating` schema (Page Gate 3) | All three arrived with the import and their origin is undocumented. Rule 7 requires a source on every published fact, and Gate 3 allows AggregateRating "only where real". They are marked QUARANTINED in the schema and must not be rendered or fed to schema until their origin is known. |
| **O3** | Cadence length for `date_checked` | Import Gate I2 | I2 requires date_checked "inside cadence" but does not define the window. Likely differs by field: an address changes rarely, hours and fees change often. |
| **O4** | `fee_type` precedence rule | Import Gate I4 | A venue can offer several payment routes. The proposed rule records the least restrictive way a member of the public can play, in the order free > donation > permit_required > drop_in_fee > reservation_fee > membership_required. Written into `data/vocabularies/fee-type.json` and needs sign-off. |
| **O5** | Multi-surface venues | `surface` field | Proposed: record the surface of the majority of pickleball courts, describe the rest in `amenities`. Needs sign-off. |
| **O6** | Rendering mode: SSG vs static export | Freshness workflow | Currently plain static generation, NOT `output: 'export'`, so incremental revalidation stays available for re-verification without a full rebuild. Both satisfy Rule 1. Reversible, but cheaper to settle now. |
| **O7** | Affiliate disclosure placement | Gear phase | Gear is the revenue layer. Disclosure obligations affect page template and schema. |
| ~~**O8**~~ | ~~Word-band checker~~ | — | **CLOSED 2026-09-03.** `lib/page/words.mjs` holds both the bands and the definition of a word: body prose counts; navigation, footer, JSON-LD, the provenance line, venue names and addresses, and bare table numbers do not. |
| **O9** | The 404 page | Rule/competitive | Pickleheads bleeds traffic through hard 404s. A 404 that routes a lost visitor to the nearest live city page is a cheap, direct win. Currently the Next.js default. |
| ~~**O10**~~ | ~~Canonical hostname~~ | — | **CLOSED 2026-09-04.** `SITE_ORIGIN` is set to `https://pickleball-courts-cyan.vercel.app` in the Vercel project and the value is recorded in [DEPLOYMENT.md](./DEPLOYMENT.md). Verified against the deployed site: canonicals, the sitemap and every URL inside the JSON-LD carry the real host, and `example.invalid` appears nowhere in the output. The hostname is a Vercel-generated domain; attaching a custom domain later means changing the variable and rebuilding, not reopening this decision. |
| **O13** | State-page threshold | The `/pickleball/us/{state}/` page | The brief sets 3+ verified venues for city, county and filter pages but names no threshold for a state. A state with one published city has no document to be that its city page is not already, and Rule 9 forbids two URLs competing for one intent. `lib/site/links.mjs` sets `STATE_MIN_CITIES = 3` and Washington therefore does not publish a state page today. Needs sign-off; the number is a judgement, the need for one is not. |
| **O11** | Where verification data comes from | Everything | **Answered eight times and still open as a general question.** Each published city came from its own operator: two ArcGIS layers (Seattle, Raleigh) and six municipal web pages. 74 venues carry provenance; the other ~18,000 imported rows still hold no `source_url` and no `date_checked` and remain `pending` under Rule 12. No general method has emerged, and on this evidence none will — the next city is another search. |
| **O12** | CSS and design system | All content pages | Deliberately deferred by the Phase 0 constraint. No stylesheet is imported anywhere. |

## 10. Change log

| Date | Change | Reason |
| --- | --- | --- |
| 2026-09-02 | File created at Phase 0. Sections 1-7 locked. | Foundation. |
| 2026-09-03 | **§8 filled and locked.** The eight decisions were supplied and are now reproduced verbatim, D1-D8, with an enforcement map. The section is no longer a blocking gap. | The owner supplied strategy §8a (D1-D6) and the v4 changelog items 4 and 5 (D7-D8). Nothing was invented; the D-numbering that §8 reserved is now allocated. |
| 2026-09-03 | Enforcement columns in §4, §5, §6 and §7 refreshed against the code that now exists. | The tables were written at Phase 0 and said "not built" for eleven things that Phases 1, 1B and 2 built. A constitution that misreports its own enforcement is worse than one with none. |
| 2026-09-03 | Phase 4: internal linking centralised in `lib/site/links.mjs`; every href minted from the link graph, so a link to an unpublished page cannot be written. New **O13** records the state-page threshold. | A crawl of the built HTML found 30 dead links from one hard-coded nav href, plus an orphaned county page. Both were invisible from inside the code that generates the links. |
| 2026-09-03 | **O8 closed.** | The word-band checker and its counting definition shipped in `lib/page/words.mjs`. |
| 2026-09-03 | Identity pass run over all 18,037 rows. 549 slugs canonicalised, 203 rows held back on identity grounds. | §3 makes URLs permanent at launch and nothing is published yet, so this is the last moment a slug is free to change. Verification cannot fix identity — no source states a slug. |
| 2026-09-03 | **Portland, OR published — city #6, first state outside WA and NC.** 11 venues, 59 courts, one operator (Portland Parks & Recreation), one source page. First city in the directory with a verified `fee_type` and the first with a `drop_in_fee_usd`; first `indoor` and first `free` filter pages. `surface` refused at 9 of 11 venues because the city says "hard courts", which names a category rather than a material. | The operator states the court count, the full postal address, indoor/outdoor, cost and whether nets are provided, all on one line per venue — the richest municipal source found so far. |
| 2026-09-03 | `venueTitle()` now declares its location clause as droppable tokens instead of one fixed string. | It was declared as a single non-droppable token, so the overflow model this module exists for never ran for a venue: any name pushing the title past 65 chars failed the build outright. "East Portland Community Center" is 66 by one character and the operator has no shorter name for it. Exactly one existing title changed; it is the one that was breaking. |
| 2026-09-03 | New **`PAGEABLE_FILTERS`** in `lib/page/city-page.mjs`; `qualifyingFilters()` iterates it instead of `FILTERS`. **O1 is now load-bearing rather than theoretical.** | `filterView()` refuses to render `/public/` (no count key, D2), but `qualifyingFilters()` — which feeds both the sitemap and the city page's filter nav — matched on `access_type === 'public'`. The Portland run populated `access_type` in draft and immediately produced a hard 404 in an internal link and in the sitemap simultaneously. The renderer is now the single authority on which filter pages exist. `access_type` was then dropped from the run as well, so the shipped data still writes nothing to that field while O1 is open — but the link bug was real and the fix stands on its own. |
| 2026-09-03 | `scripts/gate-all.mjs` reports a filter the renderer refuses as a failed page instead of throwing. | A null `filterView()` crashed the runner on line 92 and hid the gate results for all 89 pages behind one inconsistent path. A checker that dies on the failure it exists to detect is worse than no checker. |
| 2026-09-03 | **Vancouver, WA published — city #7,** Washington's second city and the first venue set in Clark County. 3 venues, 14 courts, one operator. Oakbrook Community Park carries the **first stated NEGATIVE on lighting in the directory** — "The courts do not have lighting" — so it renders "No" rather than "Not verified yet". | The City states a court count and a street address for three of the four venues on its pickleball page. No fee is claimed for the park courts: unlike Portland, Vancouver never writes "free", so `fee_type` stays null rather than being promoted from an assumption. |
| 2026-09-03 | **Fisher Basin Community Park excluded, and the source conflict recorded rather than resolved.** The City's pickleball page gives it Oakbrook's address (`3103 NE 99th Ave.`); the City's own park page for it gives `SE 192nd Ave. Vancouver, WA 98607`. It also states no court count, and no published address for it carries a house number so the Census geocoder returns no match. | Three independent grounds, all recorded. Both contradicting snapshots are committed and the verify run **asserts the contradiction still exists** — if the City fixes the page, the run fails rather than continuing to publish the accusation. |
| 2026-09-03 | Verify runs now assert the Census **incorporated place**, not just the county. `apply-vancouver-parks.mjs` refuses any venue the geocoder does not place in "Vancouver city". | A great many addresses reading "Vancouver, WA" are in unincorporated Clark County. The same check is what ruled out a THPRD (Beaverton) set earlier in the same search: that district spans Beaverton plus several unincorporated CDPs, so filing all of it under one city name would have been wrong in the way a postcode guess is wrong. |
| 2026-09-03 | **`NEAREST_CITIES_MAX_KM = 250`** added to `lib/site/links.mjs`; `nearestCities()` filters by radius before taking the five closest. | There was no cap at all. Vancouver's page listed Charlotte NC (3,669 km), Cary (3,794) and Apex (3,796) under the heading "Nearby cities we publish" — three of five entries proposing a drive across the continent. The empty-state copy ("nothing to send you across to") had been unreachable since the second city was published anywhere in the country. |
| 2026-09-03 | **`dynamicParams = false`** pinned on all three dynamic routes (`[state]`, `[state]/[city]`, `[state]/[city]/[slug]`). | Checking the live site found that every unmatched URL under `/pickleball/us/` returned **500, not 404** — `/pickleball/us/zz/`, `/pickleball/us/or/nosuchcity/`, a mistyped venue slug, and `/{city}/public/`. The static `/nonexistent/` 404 worked; only the dynamic tree failed, and it had done so since those routes existed. A 500 tells a crawler the page is temporarily broken and to KEEP the URL, where a 404 retires it — the same traffic leak **O9** records against a competitor, in the error class that preserves the dead URL. Pinning it is also the honest semantics: the publishable set is decided at build time by the link graph and the six gates, so a page that cleared no gate must not be conjurable by typing its address. Verified against `next start`: 8 unbuilt paths now 404, 12 real pages still 200. Incremental revalidation (**O6**) is unaffected — `dynamicParams` governs only params `generateStaticParams()` never returned. |
| 2026-09-04 | **Bellevue, WA published — city #8,** Washington's third city and the second in King County. 12 venues, 38 courts (24 outdoor, 14 indoor), from one City page that states a court count for every venue it lists. Highland Community Park excluded on three grounds, chief among them that its stated address does not resolve in the Census geocoder. | The richest municipal source read so far: it states the counts, marks the exceptions ("dedicated", "over tennis net", "basketball court overlay", "with low ceiling"), and writes down its own default — "Bellevue's pickleball courts are shared use with tennis courts, unless otherwise noted." A city that publishes its default has told you what every unmarked entry means. |
| 2026-09-04 | **`/pickleball/us/wa/` published — the second state page.** Washington reached `STATE_MIN_CITIES = 3` when Bellevue shipped. | **O13** working as designed: the threshold is met and the page publishes because a state note was written for it. Until that note existed, `statePagePublishes()` removed WA from the link graph entirely, so nothing linked to a page that did not exist. |
| 2026-09-04 | **New `data/identity/resolutions.json`,** read by `scripts/identity/audit.mjs`: a recorded answer to an in-city slug collision, naming which row keeps the slug, with a basis and a source. The audit throws on a resolution that names a row outside the collision, leaves a member unaccounted for, or settles a collision that no longer exists. | Two imported rows claimed `hillaire-park` in Bellevue, so the identity pass held both — and a venue the City states three courts for, at an address that geocodes, could not publish because an unsourced row shares its name. The audit's own header said such collisions "go to a review queue"; the queue had nowhere to send an answer back to. The quarantine exists to stop a GUESS becoming a permanent URL, and the City's park index listing exactly one Hillaire Park is not a guess. |
| 2026-09-04 | **`scripts/verify/build-queue.mjs` now applies the verified overlay** before running the import gates, and derives county onto the imported rows first, while the indexes still line up. `reports/completeness.md` moves from "0 of 100 ready" to "5 of 100", and names the published cities that sit outside the queue. | The dashboard PHASES.md calls "the one to watch" was reading `data.csv` without the overlay, so it reported eight published cities as blocked on provenance they carry. The first attempt at the fix was worse than the bug: the overlay appends minted venues, the array grew past the county derivation it is indexed against, the length guard fell through, and every venue in the country failed I3 — while the report still printed a confident number. |
| 2026-09-04 | **A published claim corrected.** Vancouver's venue and city pages said Oakbrook Community Park carried the first stated negative on lighting in the directory. It did not: Seattle's ArcGIS layer has a `LIGHTED` field reading "No" for nineteen of its twenty-four venues, shipped a day earlier. Corrected on both pages and in the run that generates them, with the correction left visible in `reports/vancouver-conflicts.md`. | The claim came from reading the cities whose sources are prose and forgetting the one whose source is a table. A directory whose whole argument is that it does not publish things nobody told it cannot leave a false superlative on a live page because the superlative flattered the work. |
| 2026-09-04 | **Madison, WI published — city #9,** the first city outside the Pacific Northwest and the Carolinas, and the first in Wisconsin. 21 venues, 53 courts (48 outdoor, 5 indoor), Dane County. Three venues the City lists are excluded — Door Creek, Reindahl and Rennebohm, eighteen courts — because the Census geocoder resolves none of their addresses. | Madison Parks states a court count AND a surface for every venue, in one structured line per park page. Five of the seventy-four venues published before this city carried a verified surface; Madison supplies twenty. It also settles its own ambiguity: Reindahl Park's "Courts: 8, asphalt; 4 striped for pickleball" proves that an unqualified count under a "Tennis & Pickleball" heading is a count of courts you can play pickleball on. |
| 2026-09-04 | **Warner Park and the Warner Park Community Recreation Center published as two venues at one street address,** where Bellevue's Hidden Valley Fieldhouse and Sports Park were published as one. | The test is what the operator does, not what is convenient. WPCRC has its own pages, its own ID card, its own membership or daily admission and its own booking system; Hidden Valley's fieldhouse had none of those and shared a single park page. WPCRC's five indoor courts are also the first bookable pickleball courts in the directory — every other verified court across nine cities is first come, first served. |
| 2026-09-04 | **`data/identity/resolutions.json` took its second entry unmodified** — `tenney-park`, two imported rows 301 m apart on one 38-acre Madison park. | The mechanism was built the same day for Bellevue's Hillaire Park. Madison producing the identical failure within hours is the first evidence it generalises rather than solving one case. |
| 2026-09-04 | **`venuePagePublishes()` now checks the venue is in the city's published set, not only that its editorial notes are complete.** | It answered "publishes" for a venue the identity pass was holding, and the city page's best-for block trusted it and rendered a link to a URL with no page behind it. Nothing failed at build time. `scripts/crawl-report.mjs` caught it by reading the built HTML — the same class of dead link that Phase 4 exists to prevent, found the same way. |
| 2026-09-04 | **O10 closed.** `SITE_ORIGIN` is set in the Vercel project and the hostname is now recorded in `DEPLOYMENT.md` rather than living only in a dashboard. Verified on the deployed site: canonical tags, sitemap and JSON-LD all carry the real host and `example.invalid` appears nowhere. | The decision had been effectively closed in production for a day and still read as open here, because nothing in the repository named the domain — so nobody reading this file could tell whether the site was configured. A decision whose answer exists only in a settings panel is not written down. |
| 2026-09-04 | **Austin, TX published — city #10,** the first in Texas. 21 venues, 60 courts, all outdoor, across Travis County (19) and Williamson (2). Balcones District Park excluded on two grounds: the City states "striping for Pickleball" with no number, and its address does not geocode. | Austin marks eleven of its twenty-one venues "Lighted during park hours" and publishes opening hours for every one. Before it, forty-three of the ninety-five published venues carried a lighting answer either way and more than half came from one Seattle GIS layer — Austin is the first operator to state it venue by venue in prose at scale, and gives this directory its first `/lights/` page built from sentences rather than a database column. It is also the first operator anywhere to state that a net is NOT provided, at three venues. |
| 2026-09-04 | **Assertions in a verify run may now be scoped to one venue's block of a page rather than to the page.** `apply-austin-parks.mjs` cuts the City's list at the venue names and checks each fact inside its own block. | "Lighted during park hours" appears eleven times on Austin's page and the standard open-play line fifteen. A page-wide check would have proved nothing about which park a claim belonged to, and would have let a lighting claim survive being moved between parks. Every previous run asserted page-wide because no previous source repeated itself this way. |
| 2026-09-04 | **`venueTitle()`: the " - Pickleball Courts" suffix is now droppable, and drops last.** | "Austin Tennis and Pickleball Center at Walnut Creek Sports Park" is 63 characters. With the suffix fixed, the title came to 83 with both location tokens already dropped, and the build failed on the largest venue in the city — telling the reader to shorten a fixed token that was not theirs to shorten. The assembler takes the rightmost droppable first, so the order is state, then city, then suffix. A title that is only the venue's name is weaker and honest; refusing to publish a real venue over its operator's naming is neither. Second time this module has been widened by a real name, after Portland's East Portland Community Center. |
| 2026-09-04 | **County is taken per venue, and Austin is the first city where that changed an answer.** Nineteen venues sit in Travis County and two in Williamson, so Travis publishes a county page and Williamson does not. | The behaviour was always correct — the geocoder returns a county per address — but every city published before Austin sat inside one county, so it had never been visible. Assuming a city has a county would have put two venues in the wrong one. |
