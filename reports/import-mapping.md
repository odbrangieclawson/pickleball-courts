# Import mapping: source columns to the v4 data model

Generated from `COLUMN_MAP` in `scripts/import/mapper.mjs`. That table is
the code that performs the mapping, so this document cannot drift from
the behaviour it describes.

**37 source columns. 37 dispositions. Nothing silently discarded.**

| # | source column | disposition | v4 target | reasoning |
| ---: | --- | --- | --- | --- |
| 1 | `slug` | **map** | `slug` | Verbatim. Rule 10 shape is checked, not repaired. |
| 2 | `name` | **map** | `name` | Verbatim. |
| 3 | `city` | **map** | `city` | Verbatim. |
| 4 | `state` | **map** | `state` | Upper-cased. Non two-letter values are reported, not corrected. |
| 5 | `postal_code` | **map** | `postal_code` | Verbatim, zero-padded to 5 where the leading zero was lost to a numeric export. |
| 6 | `street_address` | **map** | `street_address` | Verbatim. Import Gate I1 requires it to RESOLVE, which this pipeline cannot check without a geocoder. |
| 7 | `total_courts` | **map** | `total_courts` | P2: 0 becomes null and is flagged. A venue with no courts is not a venue. |
| 8 | `indoor_courts` | **map** | `indoor_courts` | P2 EXCEPTION: a real 0 is kept. Rule 14 needs it to drive /indoor/. |
| 9 | `outdoor_courts` | **map** | `outdoor_courts` | P2 EXCEPTION: a real 0 is kept. |
| 10 | `surface` | **vocab** | `surface` | 77 distinct source values. Unmappable values become null and are reported. 76.3% of rows say "Standard", which carries no surface information. |
| 11 | `access_type` | **split** | `fee_type + access_type` | Conflates who may enter with what you pay. Split into two axes. See vocab.mjs. |
| 12 | `is_free` | **split** | `fee_type` | P1 applies. TRUE is strong evidence for fee_type=free; FALSE is not evidence of anything. |
| 13 | `drop_in_fee_usd` | **extend** | `drop_in_fee_usd` | EXTENSION. Not in the v4 spec. Definition: the per-session charge in USD a non-member pays to play once. Kept because it is the only numeric evidence for fee_type=drop_in_fee and because Rule 7 will need a figure to attribute. 84.5% null. |
| 14 | `membership_from_usd` | **map** | `membership_from_usd` | 93.7% null. |
| 15 | `pricing_notes` | **map** | `pricing_notes` | Free text. Not a filtered field, so Import Gate I4 does not bind it. |
| 16 | `pricing_details` | **map** | `pricing_details` | Free text. Frequently identical to pricing_notes; the duplication is reported, not merged. |
| 17 | `rating` | **map** | `rating` | QUARANTINED (decisions.md O2). P2: 0 becomes null. Must not feed AggregateRating. |
| 18 | `lighted` | **map** | `light` | RENAMED. P1 applies. Drives /lights/ only when true. |
| 19 | `restrooms` | **map** | `restroom` | RENAMED. P1 applies. |
| 20 | `pro_shop` | **map** | `pro_shop` | P1 applies. |
| 21 | `climate_controlled` | **map** | `climate_control` | RENAMED. P1 applies. Rule 14: NOT indoor. |
| 22 | `covered` | **map** | `covered` | P1 applies. Rule 14: NOT indoor. |
| 23 | `amenities` | **map** | `amenities` | Split on comma/semicolon into an array. Free text, not a filtered field. |
| 24 | `website` | **map** | `website` | 57.7% null. |
| 25 | `latitude` | **map** | `latitude` | Range-checked, never corrected. |
| 26 | `longitude` | **map** | `longitude` | Range-checked, never corrected. |
| 27 | `phone` | **map** | `phone` | 48.0% null. |
| 28 | `hours` | **map** | `hours_of_operation` | RENAMED. Free text. |
| 29 | `venue_type` | **vocab** | `venue_type` | 52 distinct source values. 47.5% say "Public", which describes access, not who operates the venue, so it maps to nothing and becomes null. |
| 30 | `parking` | **map** | `parking` | Free text. 91.3% null. |
| 31 | `level_of_play` | **map** | `level_of_play` | Free text. 99.1% null. |
| 32 | `court_availability` | **map** | `court_availability` | Free text. 95.3% null. |
| 33 | `user_rating` | **map** | `user_rating` | QUARANTINED (O2). P2: 0 becomes null. |
| 34 | `review_count` | **map** | `review_count` | QUARANTINED (O2). P2: 0 becomes null. |
| 35 | `claimed` | **split** | `claimed_by_owner + claimed_or_verified` | Rule 11. Feeds claimed_by_owner as an IDENTITY signal only, and is preserved verbatim in the legacy claimed_or_verified field for traceability. It NEVER touches status or verified_by. Only 17 rows are TRUE. |
| 36 | `sport` | **extend** | `source_sport` | EXTENSION. Definition: the sport the source record describes, as the source labelled it. 18,017 rows say "pickleball" and 20 say "both". Kept because "both" marks shared tennis/pickleball facilities, which affects how court counts should be read. |
| 37 | `source_url` | **map** | `source_url` | SEE THE PROVENANCE WARNING BELOW. Mapped so the trail is not lost, but it does NOT satisfy Import Gate I2. |

Columns in the CSV with no disposition: **0** ✓

## Dispositions used

- **map** — straight into a v4 field, possibly renamed or type-coerced
- **vocab** — into a v4 field through a controlled vocabulary
- **split** — one source column feeds more than one v4 field
- **extend** — the v4 model gains a field for it, with a written definition
- **drop** — deliberately not imported, with a stated reason

- `map`: 30
- `vocab`: 2
- `split`: 3
- `extend`: 2

No column carries the **drop** disposition. Every source column survives
into the model in some form, including the two that only exist for
traceability (`claimed_or_verified`, `source_url`).

## Model extensions

Two fields were added to v4 that the spec did not list, because the source
carries them and discarding them would lose real information:

- **`drop_in_fee_usd`** — EXTENSION. Not in the v4 spec. Definition: the per-session charge in USD a non-member pays to play once. Kept because it is the only numeric evidence for fee_type=drop_in_fee and because Rule 7 will need a figure to attribute. 84.5% null.
- **`source_sport`** — EXTENSION. Definition: the sport the source record describes, as the source labelled it. 18,017 rows say "pickleball" and 20 say "both". Kept because "both" marks shared tennis/pickleball facilities, which affects how court counts should be read.

## v4 fields the source cannot fill

- **`county`** — Not in the source. Must be derived from lat/lng or postal_code, which needs a reference dataset this repo does not have. See reports/README of the county step.
- **`date_checked`** — Not in the source. No row carries any date at all, so Import Gate I2 cannot pass for any row.
- **`nets_provided`** — Not in the source and not derivable from any column.
- **`verified_by`** — Not in the source. The only candidate, source_url, points to a competitor directory, which is not one of the four permitted values.
- **`status`** — Set to pending for every row by Rule 12. Never computed from source data.
- **`claim_date`** — Not in the source, even for the 17 rows where claimed is TRUE.
- **`play_format`** — NO SOURCE SIGNAL. The brief asked for access_type to be split into fee_type and play_format, but access_type contains no play-format information: its values describe cost and entry, never whether a venue runs open play, leagues or lessons. Imported as null for all rows rather than guessed. court_availability mentions reservations on 3 rows, which is too thin to build a field on.

## Provenance

```
{
  "rows_with_source_url": 18037,
  "distinct_source_domains": [
    "www.courtsource.us"
  ],
  "rows_with_qualifying_provenance": 0,
  "rows_with_date_checked": 0
}
```

Every row imports as `status=pending` (Rule 12). No exceptions, no
overrides, no path in the mapper that sets any other value.