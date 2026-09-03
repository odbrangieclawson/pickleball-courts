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
| **O10** | Canonical hostname | Schema `@id`, sitemap, breadcrumb `item`, canonical tags | Everything currently uses `example.invalid` as an obvious placeholder. Real values cannot be minted until the domain is fixed. |
| **O13** | State-page threshold | The `/pickleball/us/{state}/` page | The brief sets 3+ verified venues for city, county and filter pages but names no threshold for a state. A state with one published city has no document to be that its city page is not already, and Rule 9 forbids two URLs competing for one intent. `lib/site/links.mjs` sets `STATE_MIN_CITIES = 3` and Washington therefore does not publish a state page today. Needs sign-off; the number is a judgement, the need for one is not. |
| **O11** | Where verification data comes from | Everything | 18,038 rows hold no `source_url` and no `date_checked`, so by Rule 12 all 18,038 are `pending` and by Rule 8 the publishable inventory is **zero**. The verification pipeline is the real Phase 1, not page building. |
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
