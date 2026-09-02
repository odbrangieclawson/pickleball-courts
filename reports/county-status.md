# County derivation status

## BLOCKED — and not by anything in the data

County derived for **0 of 18,037 rows (0.0%)**.

County is not in the source and cannot be computed from it. Deriving it
needs a reference table that maps geography to county names. This repo
has none, and inventing one is not possible — no amount of arithmetic on
a latitude turns into "Tarrant".

Nothing has been guessed. All 18,037 rows carry `county: null`.

## What this blocks

- **Every county page.** `/pickleball/us/{state}/{county}-county/` is one
  of the six locked URL patterns and it has no data to stand on.
- **Import Gate I3**, which requires "derived county confidence above
  threshold". Strictly, no row can pass a full I3 today. The triage report
  scores I3-minus-county and labels it as such, so its numbers are not
  quietly overstating readiness.

## The good news: the inputs are there

The dataset has what a resolver needs. This is a missing lookup table,
not missing data.

| input available | rows | rate |
| --- | ---: | ---: |
| lat + lng (best: point-in-polygon) | 17,792 | 98.6% |
| postal_code (fallback: ZIP crosswalk) | 17,509 | 97.1% |
| at least one of the two | 17,862 | 99.0% |
| **neither — underivable even with a reference** | **175** | 1.0% |

So with a reference file, roughly **99.0%** of rows become derivable
immediately, and only 175 rows would need manual attention.

## What would unblock it

Any one of these, in preference order:

1. **US Census county boundary file** (TIGER/Line or cartographic
   boundary GeoJSON). True point-in-polygon from lat/lng. Highest
   accuracy, public domain.
2. **Census ZCTA-to-county relationship file**, or the **HUD USPS
   ZIP-county crosswalk**. ZIP-based lookup. Smaller, simpler, public
   domain. Weaker where a ZIP spans two counties.
3. **A geocoding API** returning county. Costs money, needs a key, and
   sends your address list to a third party.

Options 1 and 2 are downloads of public reference data, not collection of
new venue data, so they sit inside the Phase 1 constraint. They are still
a third-party fetch into this repo, so they wait for your word.

Drop the file in `data/reference/` and this script runs.

## The confidence model, already specified

| method | confidence | flagged for review? |
| --- | ---: | --- |
| `point_in_polygon` | 0.98 | no |
| `zip_single_county` | 0.90 | no |
| `zip_dominant_county` | 0.60–0.85 | **yes** |
| `nearest_centroid` | 0.40 | **yes** |
| `none` | 0.00 | **yes** |

Review threshold: **0.85**. Every ZIP result that is not
unambiguous, and every centroid fallback, goes to a human. That is
deliberate: Rule 3 makes a county URL permanent once published, so a
wrong county is expensive to undo and cheap to prevent.

Rows currently flagged for review: **18,037** (all of them, method `none`).
