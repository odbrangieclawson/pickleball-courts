# decisions.md

**Status: Phase 0. Locked sections are IMMUTABLE.**

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

> **Enforced by:** nothing yet. A word-band checker is required before the
> first content page ships. Tracked as **O8**.

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
| 2 | `getCounts()` module | Not built yet |
| 3 | Review | Manual |
| 4 | `LOCKED_URL_PATTERNS` | **Active** |
| 5 | Word-band checker | Not built (**O8**) |
| 6 | Tri-state types in `venue.schema.json` | Schema only; renderer not built |
| 7 | Import gate validator | Not built |
| 8 | Import gate validator | Not built |
| 9 | `scripts/validate-keyword-map.mjs` | **Active** (template level); instance level inactive until data exists |
| 10 | `slug` pattern in all schemas | **Active** in schema |
| 11 | Separate fields in `venue.schema.json` | **Active** in schema |
| 12 | `status` default `pending` | **Active** in schema |
| 13 | Import gate validator | Not built |
| 14 | Filter derivation from `indoor_courts` only | Not built |

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

> **Enforced by:** nothing yet. The import gate validator is the first
> deliverable of the import phase. `data/schemas/venue.schema.json` encodes
> what it can; I1 slug shape, I2 field presence and enum membership, and I4
> for the four controlled fields. It cannot express I3 arithmetic or
> reachability, which need the validator.

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

> **Enforced by:** Gate 2 is active via `scripts/check-js-off.mjs`, which
> also asserts the BreadcrumbList half of Gate 3. Gates 1, 4, 5, 6 and the
> rest of Gate 3 need data and content and are not built.

## 8. The eight decisions — NOT SUPPLIED

> **BLOCKING GAP.** The Phase 0 brief said "Include the eight decisions I am
> pasting below." No decisions followed the instruction in the message that
> requested this file. Nothing has been invented to fill the space.
>
> This section is reserved. When the eight arrive they are pasted here
> verbatim, numbered D1 to D8, and marked IMMUTABLE. Until then, any code
> comment or document that needs to cite one refers to a section name in this
> file rather than a D-number, so that the D-numbering stays free for the
> owner's use.

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
| **O8** | Word-band checker | Rule 5, Page Gate 4 | Needs to exist before the first content page. Also needs a definition of what counts as a word: does boilerplate navigation count, does the provenance line count. |
| **O9** | The 404 page | Rule/competitive | Pickleheads bleeds traffic through hard 404s. A 404 that routes a lost visitor to the nearest live city page is a cheap, direct win. Currently the Next.js default. |
| **O10** | Canonical hostname | Schema `@id`, sitemap, breadcrumb `item`, canonical tags | Everything currently uses `example.invalid` as an obvious placeholder. Real values cannot be minted until the domain is fixed. |
| **O11** | Where verification data comes from | Everything | 18,038 rows hold no `source_url` and no `date_checked`, so by Rule 12 all 18,038 are `pending` and by Rule 8 the publishable inventory is **zero**. The verification pipeline is the real Phase 1, not page building. |
| **O12** | CSS and design system | All content pages | Deliberately deferred by the Phase 0 constraint. No stylesheet is imported anywhere. |

## 10. Change log

| Date | Change | Reason |
| --- | --- | --- |
| 2026-09-02 | File created at Phase 0. Sections 1-7 locked. | Foundation. |
