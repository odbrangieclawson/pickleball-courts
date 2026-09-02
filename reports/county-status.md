# County derivation

**Source:** US Census Bureau, 2020 ZCTA5-to-County relationship file
(`tab20_zcta520_county20_natl.txt`) plus the 2023 Gazetteer county file
(`2023_Gaz_counties_national.txt`), for county internal points. Both
public domain, downloaded 2026-09-02.

**Method:** `postal_code` → ZCTA → county. Where a ZCTA spans more than
one county — 30.1% of them do — the winner is the county whose centroid
is nearest the venue, falling back to land-area share when the row has no
coordinates.

Switching the tiebreak from land area to proximity **changed the answer on
1,138 of 4,585 multi-county rows (24.8%)**. Land area was not merely
uncertain, it was wrong: Anchorage ZIP 99503 resolved to "Bethel" because
that census area holds 83.7% of the ZCTA land while essentially none of
its addresses. It now resolves to Anchorage Municipality, 33 km away
against 552 km.

## Results

| outcome | rows | rate |
| --- | ---: | ---: |
| County derived and **accepted** (confidence ≥ 0.85) | **13,909** | **77.1%** |
| County derived but **flagged for review** | 3,012 | 16.7% |
| No county derived | 1,116 | 6.2% |
| **Total flagged for manual review** | **4,128** | **22.9%** |

## By method

| method | rows | rate |
| --- | ---: | ---: |
| `zip_single_county` | 12,487 | 69.2% |
| `zip_nearest_county_centroid` | 4,585 | 25.4% |
| `none` | 947 | 5.3% |
| `zip_dominant_county` | 18 | 0.1% |

## Why rows were flagged

| reason | rows |
| --- | ---: |
| no postal_code | 528 |
| ZIP has no ZCTA in the Census relationship file (often a PO-box or point ZIP) | 419 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 30 km (margin 13 km) | 15 |
| derived county is in NY but the row says TX - ZIP or state is wrong | 13 |
| derived county is in NY but the row says WA - ZIP or state is wrong | 13 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 28 km (margin 10 km) | 12 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 26 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 12 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 24 km (margin 7 km) | 12 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 23 km (margin 6 km) | 12 |
| derived county is in PA but the row says WA - ZIP or state is wrong | 12 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 28 km (margin 13 km) | 11 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 25 km (margin 9 km) | 11 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 30 km (margin 10 km) | 11 |
| derived county is in NY but the row says VA - ZIP or state is wrong | 11 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 26 km (margin 8 km) | 10 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 30 km (margin 18 km) | 10 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 26 km (margin 12 km) | 10 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 25 km (margin 7 km) | 10 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 27 km (margin 10 km) | 9 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 26 km (margin 9 km) | 9 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 26 km (margin 10 km) | 9 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 34 km (margin 10 km) | 9 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 42 km (margin 15 km) | 9 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 25 km (margin 6 km) | 9 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 26 km (margin 6 km) | 9 |
| derived county is in NY but the row says OR - ZIP or state is wrong | 9 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 27 km (margin 11 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 22 km (margin 4 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 28 km (margin 19 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 26 km (margin 1 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 28 km (margin 9 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 19 km (margin 1 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 24 km (margin 5 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 30 km (margin 7 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 25 km (margin 8 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 24 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 8 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 30 km (margin 8 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 25 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 8 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 20 km (margin 6 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 31 km (margin 8 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 22 km (margin 3 km) | 8 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 30 km (margin 2 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 23 km (margin 8 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 23 km (margin 2 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 35 km (margin 10 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 28 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 7 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 24 km (margin 11 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 35 km (margin 12 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 31 km (margin 6 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 17 km (margin 6 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 29 km (margin 15 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 28 km (margin 8 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 24 km (margin 4 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 21 km (margin 1 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 27 km (margin 6 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 27 km (margin 8 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 21 km (margin 7 km) | 7 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 25 km (margin 4 km) | 7 |
| derived county is in CA but the row says NV - ZIP or state is wrong | 7 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 36 km (margin 13 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 24 km (margin 9 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 27 km (margin 5 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 29 km (margin 12 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 23 km (margin 11 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 31 km (margin 18 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 36 km (margin 14 km) | 6 |
| ZCTA spans N counties; dominant county holds N% of land area (no coordinates to disambiguate) | 6 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 27 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 6 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 21 km (margin 2 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 31 km (margin 13 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 26 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 6 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 21 km (margin 6 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 27 km (margin 15 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 19 km (margin 8 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 27 km (margin 18 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 20 km (margin 12 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 21 km (margin 12 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 29 km (margin 20 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 23 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 6 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 25 km (margin 1 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 26 km (margin 7 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 26 km (margin 19 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 27 km (margin 9 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 28 km (margin 12 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 28 km (margin 6 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 25 km (margin 0 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 20 km (margin 5 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 23 km (margin 15 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 26 km (margin 5 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 31 km (margin 9 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 28 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 6 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 26 km (margin 3 km) | 6 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 20 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 6 |
| derived county is in PA but the row says OR - ZIP or state is wrong | 6 |
| derived county is in PA but the row says TX - ZIP or state is wrong | 6 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 32 km (margin 16 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 30 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 5 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 30 km (margin 14 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 31 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 5 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 22 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 5 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 28 km (margin 7 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 33 km (margin 10 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 38 km (margin 18 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 15 km (margin 6 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 20 km (margin 16 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 22 km (margin 11 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 22 km (margin 14 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 25 km (margin 17 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 30 km (margin 12 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 32 km (margin 18 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 23 km (margin 3 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 22 km (margin 1 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 24 km (margin 2 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 27 km (margin 4 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 21 km (margin 8 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 34 km (margin 15 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 23 km (margin 4 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 22 km (margin 7 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 26 km (margin 15 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 24 km (margin 17 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 25 km (margin 5 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 27 km (margin 13 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 29 km (margin 9 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 14 km (margin 1 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 27 km (margin 3 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 27 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 5 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 35 km (margin 16 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 23 km (margin 7 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 31 km (margin 7 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 19 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 5 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 31 km (margin 16 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 34 km (margin 12 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 26 km (margin 20 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 29 km (margin 6 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 20 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 5 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 30 km (margin 6 km) | 5 |
| ZCTA spans N counties; nearest county centroid is 44 km away, next is 58 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 5 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 35 km (margin 19 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 32 km (margin 20 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 29 km (margin 10 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 28 km (margin 5 km) | 4 |
| derived county is in CA but the row says AZ - ZIP or state is wrong | 4 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 43 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 42 km (margin 9 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 50 km (margin 15 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 44 km (margin 11 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 43 km (margin 9 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 38 km (margin 12 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 27 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 24 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 26 km (margin 16 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 37 km (margin 17 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 29 km (margin 17 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 27 km (margin 20 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 14 km (margin 5 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 12 km (margin 1 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 20 km (margin 7 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 22 km (margin 16 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 20 km (margin 14 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 22 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 23 km (margin 12 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 18 km (margin 5 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 32 km (margin 5 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 28 km (margin 11 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 24 km (margin 6 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 29 km (margin 7 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 30 km (margin 16 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 25 km (margin 16 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 33 km (margin 15 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 27 km (margin 12 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 26 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 30 km (margin 10 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 23 km (margin 0 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 27 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 20 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 27 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 28 km (margin 18 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 34 km (margin 14 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 23 km (margin 5 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 30 km (margin 11 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 29 km (margin 18 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 29 km (margin 19 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 22 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 25 km (margin 11 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 16 km (margin 0 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 30 km (margin 20 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 24 km (margin 18 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 36 km (margin 18 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 24 km (margin 12 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 30 km (margin 12 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 26 km (margin 4 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 29 km (margin 14 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 26 km (margin 2 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 41 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 30 km (margin 9 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 24 km (margin 8 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 27 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 28 km (margin 5 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 33 km (margin 12 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 37 km (margin 18 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 36 km (margin 16 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 22 km (margin 5 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 27 km (margin 8 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 34 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 25 km (margin 14 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 49 km away, next is 49 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 33 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 4 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 35 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 4 |
| derived county is in PA but the row says VA - ZIP or state is wrong | 4 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 24 km (margin 14 km) | 4 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 29 km (margin 11 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 32 km (margin 11 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 29 km (margin 14 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 34 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 27 km (margin 3 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 25 km (margin 2 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 35 km (margin 8 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 25 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 57 km away, next is 60 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 48 km (margin 13 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 31 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 38 km (margin 17 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 38 km (margin 14 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 36 km (margin 2 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 38 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 33 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 39 km (margin 4 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 40 km (margin 13 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 38 km (margin 0 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 51 km (margin 18 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 20 km (margin 2 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 30 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 21 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 31 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 30 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 33 km (margin 16 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 19 km (margin 6 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 32 km (margin 9 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 23 km (margin 9 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 24 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 17 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 13 km (margin 1 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 17 km (margin 0 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 17 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 18 km (margin 4 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 17 km (margin 3 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 29 km (margin 13 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 20 km (margin 18 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 20 km (margin 15 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 24 km (margin 15 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 28 km (margin 15 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 18 km (margin 9 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 21 km (margin 13 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 23 km (margin 17 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 18 km (margin 1 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 21 km (margin 5 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 18 km (margin 15 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 18 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 18 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 31 km (margin 14 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 26 km (margin 19 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 21 km (margin 13 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 22 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 31 km (margin 17 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 34 km (margin 18 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 22 km (margin 10 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 23 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 27 km (margin 7 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 27 km (margin 14 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 30 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 24 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 26 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 41 km (margin 12 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 38 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 32 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 34 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 19 km (margin 5 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 27 km (margin 19 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 28 km (margin 9 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 19 km (margin 9 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 31 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 25 km (margin 9 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 23 km (margin 14 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 32 km (margin 12 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 19 km (margin 15 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 19 km (margin 3 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 26 km (margin 12 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 22 km (margin 18 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 15 km (margin 4 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 25 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 26 km (margin 19 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 22 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 26 km (margin 18 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 25 km (margin 2 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 39 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 15 km (margin 2 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 33 km (margin 19 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 37 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 27 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 20 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 38 km (margin 13 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 37 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 47 km (margin 15 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 28 km (margin 4 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 19 km (margin 2 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 27 km (margin 12 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 38 km (margin 16 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 26 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 22 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 27 km (margin 17 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 29 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 22 km (margin 15 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 21 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 26 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 21 km (margin 18 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 29 km (margin 4 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 21 km (margin 10 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 26 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 30 km (margin 17 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 28 km (margin 12 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 32 km (margin 10 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 25 km (margin 3 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 21 km (margin 0 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 29 km (margin 12 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 33 km (margin 11 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 26 km (margin 11 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 28 km (margin 17 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 31 km (margin 19 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 23 km (margin 4 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 21 km (margin 4 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 23 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 37 km (margin 6 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 28 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 39 km (margin 9 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 37 km (margin 20 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 27 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 36 km (margin 16 km) | 3 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 25 km (margin 1 km) | 3 |
| derived county is in GA but the row says TX - ZIP or state is wrong | 3 |
| ZCTA spans N counties; nearest county centroid is 41 km away, next is 45 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 34 km (margin 7 km) | 3 |
| derived county is in WV but the row says VA - ZIP or state is wrong | 3 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 7 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 9 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 3 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 13 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 15 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 48 km away, next is 57 km (margin 9 km) | 3 |
| derived county is in VA but the row says WA - ZIP or state is wrong | 3 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 39 km (margin 10 km) | 3 |
| derived county is in NY but the row says WI - ZIP or state is wrong | 3 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 23 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 3 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 39 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 3 |
| derived county is in ID but the row says WY - ZIP or state is wrong | 3 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 22 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 34 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 37 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 20 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 51 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 23 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 34 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 46 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 35 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 35 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 34 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 147 km away, next is 160 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 39 km away, next is 48 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 37 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 41 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 29 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 62 km away, next is 75 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 33 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 42 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 33 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 35 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 34 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 37 km away, next is 57 km (margin 20 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 48 km away, next is 59 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 51 km (margin 20 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 52 km away, next is 57 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 48 km away, next is 54 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 50 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 38 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 40 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 20 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 24 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 42 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 56 km (margin 20 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 27 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 51 km away, next is 61 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 20 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 62 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 61 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 32 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 53 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 35 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 45 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 39 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 44 km away, next is 44 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 35 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 36 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 34 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 16 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 38 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 52 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 43 km away, next is 53 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 29 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 34 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 32 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 28 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 22 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 21 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 36 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 26 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 29 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 25 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 35 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 32 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 26 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 30 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 38 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 25 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 37 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 15 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 13 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 12 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 12 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 14 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 18 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 19 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 16 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 22 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 25 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 24 km (margin 19 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 28 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 25 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 22 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 24 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 24 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 24 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 15 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 20 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 21 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 18 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 29 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 28 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 19 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 23 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 31 km (margin 19 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 33 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 23 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 23 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| derived county is in SD but the row says IA - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 17 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 24 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 21 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 38 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 40 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 37 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 32 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 38 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 34 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 29 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 27 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 40 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 32 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 21 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 20 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 21 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 29 km (margin 20 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 23 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 24 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 28 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 19 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 24 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 23 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 25 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 17 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 25 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 38 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 35 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 21 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 19 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 17 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 24 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 30 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 35 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 15 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 23 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 26 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 19 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 26 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 11 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 19 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 20 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 23 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 26 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 15 km (margin 0 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 25 km (margin 20 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 20 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 25 km (margin 19 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 30 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 33 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 16 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 16 km (margin 4 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 26 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 26 km (margin 0 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 30 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 29 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 30 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 151 km away, next is 167 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 29 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 48 km (margin 20 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 28 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 25 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 37 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 27 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 30 km (margin 4 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 25 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 26 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 29 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 25 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 40 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 27 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 32 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 37 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 34 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 10 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 14 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 36 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 19 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 29 km (margin 8 km) | 2 |
| derived county is in ND but the row says MN - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 51 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 52 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 23 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 25 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 38 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 18 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 15 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 21 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 23 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 29 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 25 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 29 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 12 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 27 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 20 km (margin 4 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 19 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 19 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 37 km (margin 19 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 32 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 38 km (margin 19 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 29 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 25 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 21 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 24 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 27 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 22 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 21 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 19 km (margin 4 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 22 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 25 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 32 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 18 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 23 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 35 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 27 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 30 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 31 km (margin 20 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 33 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 37 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 28 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 16 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 24 km (margin 15 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 62 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 25 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 34 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 28 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 32 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 13 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 34 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 27 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 16 km (margin 7 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 26 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 29 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 30 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 35 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 22 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 32 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 14 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 41 km away, next is 60 km (margin 19 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 36 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 30 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 29 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 22 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 22 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 23 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 22 km (margin 9 km) | 2 |
| derived county is in NY but the row says OH - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 24 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 28 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 20 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 19 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 20 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 40 km (margin 19 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 49 km (margin 14 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 52 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 43 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 33 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 29 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 26 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 27 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 26 km (margin 16 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 28 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 39 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 38 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 39 km (margin 13 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 35 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 36 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 38 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 33 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 21 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 26 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 30 km (margin 9 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 11 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 11 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 5 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 23 km (margin 4 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 28 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 18 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 2 |
| derived county is in TX but the row says TN - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 29 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 21 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 35 km (margin 18 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 38 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 22 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 34 km (margin 11 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 24 km (margin 6 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 36 km (margin 12 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 31 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 31 km (margin 3 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 46 km away, next is 47 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 31 km (margin 10 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 25 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 2 |
| derived county is in MD but the row says TX - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 29 km (margin 6 km) | 2 |
| derived county is in PA but the row says UT - ZIP or state is wrong | 2 |
| derived county is in MD but the row says VA - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 5 km (margin 2 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 6 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 9 km (margin 5 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 7 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 19 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 3 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 11 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 22 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 6 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 14 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 19 km (margin 1 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 23 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 5 km (margin 4 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 15 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 32 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 17 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 18 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 2 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 20 km (margin 17 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 10 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 27 km (margin 9 km) | 2 |
| derived county is in WV but the row says WA - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 41 km (margin 19 km) | 2 |
| derived county is in AL but the row says WA - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 43 km (margin 8 km) | 2 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 34 km (margin 1 km) | 2 |
| derived county is in PA but the row says WI - ZIP or state is wrong | 2 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 27 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 23 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 31 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 29 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 30 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 37 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 23 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 32 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 29 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 26 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 29 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 37 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 108 km away, next is 111 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 58 km away, next is 61 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 56 km away, next is 74 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 54 km away, next is 65 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 59 km away, next is 76 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 52 km away, next is 66 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 58 km away, next is 75 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 119 km away, next is 124 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 129 km away, next is 135 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 130 km away, next is 136 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 77 km away, next is 86 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 71 km away, next is 80 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 73 km away, next is 76 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 43 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 49 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 49 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 48 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 40 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 31 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 32 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 50 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 66 km away, next is 66 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 31 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 51 km away, next is 63 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 40 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 122 km away, next is 133 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in AZ but the row says CA - ZIP or state is wrong | 1 |
| derived county is in WA but the row says CA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 114 km away, next is 128 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 45 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 75 km away, next is 85 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 44 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 56 km away, next is 57 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 52 km away, next is 55 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 51 km away, next is 56 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 41 km away, next is 47 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 289 km away, next is 306 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 45 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 45 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 103 km away, next is 123 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 105 km away, next is 122 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 107 km away, next is 124 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 105 km away, next is 124 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 103 km away, next is 119 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 104 km away, next is 123 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 102 km away, next is 119 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 40 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 36 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 35 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 47 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 49 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 48 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 48 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 52 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in IA but the row says CO - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 40 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 47 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 47 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 49 km away, next is 56 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 58 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 58 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 24 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 778 km away, next is 780 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 28 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 15 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 52 km away, next is 59 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 24 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 35 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 20 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 22 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 46 km away, next is 61 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 60 km (margin 12 km) | 1 |
| derived county is in PA but the row says CO - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 1327 km away, next is 1346 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 34 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 35 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 41 km away, next is 55 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 43 km away, next is 54 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 53 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 48 km away, next is 52 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 49 km away, next is 52 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in ME but the row says CT - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 27 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 28 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 48 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in GA but the row says FL - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 48 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 46 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 48 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 52 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 50 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 35 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 36 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 29 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 32 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 42 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 50 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 43 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 46 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 45 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 44 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 49 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 50 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 45 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 34 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 30 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 51 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 43 km away, next is 54 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 40 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 39 km away, next is 41 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 44 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in MS but the row says FL - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 31 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 30 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 41 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 27 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 31 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 28 km (margin 2 km) | 1 |
| derived county is in ME but the row says FL - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 37 km away, next is 45 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 43 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 34 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 14 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 48 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 50 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 49 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 35 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 29 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 33 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 30 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 39 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 37 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 31 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 39 km away, next is 44 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 24 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 38 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 15 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 16 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 15 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 16 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 13 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 14 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 13 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 14 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 23 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 15 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 13 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 13 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 17 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 22 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 27 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 17 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 17 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 22 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 20 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 67 km away, next is 84 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 24 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 12 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 214 km away, next is 224 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 17 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 18 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 19 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 125 km away, next is 132 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 21 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 19 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 22 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 27 km (margin 19 km) | 1 |
| derived county is in NC but the row says GA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 19 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 16 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 19 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 13 km (margin 2 km) | 1 |
| derived county is in TN but the row says GA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 19 km (margin 10 km) | 1 |
| derived county is in SC but the row says GA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 20 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 14 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 16 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 19 km (margin 11 km) | 1 |
| derived county is in CA but the row says HI - ZIP or state is wrong | 1 |
| derived county is in PA but the row says IA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 24 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 29 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 31 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 28 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 32 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 94 km away, next is 104 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 23 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 21 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 20 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 25 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 224 km away, next is 231 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 71 km away, next is 90 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 23 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 22 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1167 km away, next is 1185 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 34 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 28 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 29 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 19 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 36 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 28 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 27 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 30 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 32 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 37 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 44 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 40 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 28 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 43 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 40 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 36 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 40 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 27 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 37 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in WA but the row says ID - ZIP or state is wrong | 1 |
| derived county is in MN but the row says ID - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 34 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 28 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 30 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 27 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in SC but the row says IL - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 27 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 27 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 24 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 34 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 31 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 32 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in FL but the row says IL - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 26 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 29 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 208 km away, next is 208 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 21 km (margin 0 km) | 1 |
| derived county is in KY but the row says IL - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 19 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 17 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 24 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 21 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 19 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 35 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 35 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 35 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 33 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 22 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 33 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 23 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 37 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 20 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 24 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 22 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 17 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 25 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 23 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 37 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 19 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 16 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 20 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 21 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 26 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 24 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 23 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 21 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 16 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 24 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 167 km away, next is 186 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 21 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 23 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 33 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 33 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 26 km (margin 5 km) | 1 |
| derived county is in MO but the row says KS - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 37 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 17 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 32 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 30 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 27 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 23 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 21 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 14 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 14 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 24 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 18 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 15 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 15 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 22 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 234 km away, next is 252 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 18 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 22 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 15 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 16 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 33 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 25 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 36 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 26 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 26 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 26 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 40 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 37 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 36 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 18 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 19 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 41 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 21 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 10 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 18 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 9 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 17 km (margin 16 km) | 1 |
| derived county is in TX but the row says MD - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 23 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 22 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 19 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 27 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 51 km away, next is 59 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 24 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 17 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 9 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 29 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 22 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 11 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 42 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 42 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 29 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 30 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 27 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 31 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 29 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 43 km (margin 18 km) | 1 |
| derived county is in NJ but the row says MI - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 42 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 26 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 41 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 29 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 33 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 42 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 42 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 26 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 27 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 25 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 22 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 31 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 31 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 22 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 38 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 38 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 25 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 12 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 44 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 30 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 41 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 48 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 33 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 43 km away, next is 45 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 42 km away, next is 46 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 44 km away, next is 45 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 54 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 20 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 39 km away, next is 52 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 18 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 36 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 156 km away, next is 170 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 28 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 54 km away, next is 61 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 54 km away, next is 63 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 21 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 21 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 22 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 32 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 36 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 29 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 58 km away, next is 73 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 441 km away, next is 448 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 21 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 23 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 30 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 25 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 29 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 39 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 36 km (margin 9 km) | 1 |
| derived county is in WI but the row says MN - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 33 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 19 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 31 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 32 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 33 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 38 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 37 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 29 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 24 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 13 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 24 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 16 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 13 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 32 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 24 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 9 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 31 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 30 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 32 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 30 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 25 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 39 km away, next is 45 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 32 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 32 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 23 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 10 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 10 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 28 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 27 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 13 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 12 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 26 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 21 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 15 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 19 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 23 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 13 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 17 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 28 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 11 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 36 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 28 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 25 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 15 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 34 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 48 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 41 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 46 km away, next is 63 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 25 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 31 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 27 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 16 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 18 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 29 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 22 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 40 km away, next is 53 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 30 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 22 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 23 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 28 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 33 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 26 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 19 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 21 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 14 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 25 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 23 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 32 km (margin 19 km) | 1 |
| derived county is in NY but the row says NC - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 18 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 18 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 36 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 46 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 25 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 25 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 28 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 46 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 23 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 27 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 28 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 41 km away, next is 54 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 37 km away, next is 41 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 35 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 101 km away, next is 105 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 29 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 31 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 194 km away, next is 199 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 41 km away, next is 52 km (margin 11 km) | 1 |
| derived county is in VT but the row says NH - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 24 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 27 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 16 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in PA but the row says NJ - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 17 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 32 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 42 km away, next is 59 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 44 km away, next is 62 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 65 km away, next is 85 km (margin 20 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 14 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 30 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 23 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in TN but the row says NY - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 37 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 40 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 21 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 36 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 37 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 36 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 14 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 143 km away, next is 148 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 33 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 29 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 21 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 31 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 47 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 50 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 32 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 29 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 15 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 37 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 25 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 20 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 41 km away, next is 55 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 42 km away, next is 56 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 43 km away, next is 57 km (margin 14 km) | 1 |
| derived county is in VT but the row says NY - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 21 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 24 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 22 km (margin 17 km) | 1 |
| derived county is in IL but the row says OH - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 25 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 30 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 23 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 105 km away, next is 121 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 28 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 18 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 30 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 31 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 21 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 20 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 24 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 150 km away, next is 151 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 25 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 26 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 22 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 21 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 23 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 19 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 22 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 22 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 26 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 21 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 16 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in WI but the row says OH - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 37 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 326 km away, next is 343 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 19 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 28 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in SD but the row says OK - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 34 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 33 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 25 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in NY but the row says OK - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 28 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 22 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 41 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 41 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 46 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 48 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 49 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 48 km (margin 20 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in KY but the row says OR - ZIP or state is wrong | 1 |
| derived county is in SC but the row says OR - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 48 km away, next is 51 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 51 km away, next is 52 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 36 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 37 km away, next is 48 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 40 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 35 km away, next is 41 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 33 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 36 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 29 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 30 km (margin 0 km) | 1 |
| derived county is in GA but the row says OR - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 31 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 31 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 40 km away, next is 47 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 49 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 36 km (margin 9 km) | 1 |
| derived county is in TN but the row says OR - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 48 km away, next is 50 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 51 km (margin 19 km) | 1 |
| derived county is in DE but the row says OR - ZIP or state is wrong | 1 |
| derived county is in DC but the row says OR - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 47 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 52 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 18 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 27 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 15 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 22 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 23 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 27 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 19 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 41 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 27 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 445 km away, next is 450 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 21 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 29 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 33 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 18 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 29 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 18 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 16 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 25 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 25 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 8 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 9 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 12 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 10 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 12 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 10 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 7 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 11 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 7 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 9 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 7 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 16 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 31 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 34 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 38 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 30 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 24 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 34 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 23 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 22 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 35 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 29 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 17 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 44 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 43 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 23 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 60 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 19 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 19 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 32 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 29 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 24 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 67 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 18 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 19 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 30 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 20 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 21 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 25 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 24 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 30 km (margin 16 km) | 1 |
| derived county is in FL but the row says TN - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 12 km away, next is 20 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 22 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 20 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 18 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in WY but the row says TX - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 29 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 32 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 45 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 119 km away, next is 122 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 35 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 31 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 35 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 34 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 43 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 35 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 34 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 34 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 30 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 30 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 30 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 34 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 36 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 36 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 27 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 32 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 37 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in NC but the row says TX - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 38 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 28 km away, next is 32 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 33 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 26 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 33 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 32 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 31 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 31 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 35 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 36 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 23 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 21 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 46 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 36 km away, next is 46 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 30 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 28 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 35 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in VA but the row says TX - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 21 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 28 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 31 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 30 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in NY but the row says UT - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 46 km away, next is 51 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 50 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 37 km away, next is 44 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 13 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 15 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 13 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 17 km (margin 16 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 14 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 17 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 14 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1572 km away, next is 1584 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 4 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 15 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 15 km (margin 13 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 135 km away, next is 154 km (margin 20 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 12 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 9 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 10 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 5 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 6 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 8 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 7 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 10 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 6 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 4 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 6 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 4 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 18 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 19 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 21 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 21 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 2 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 22 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 20 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 21 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 20 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 3 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 3 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 10 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 4 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 2 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 10 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 11 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 6 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 10 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 27 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 24 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 22 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 25 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 17 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 17 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 16 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 19 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 7 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 8 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 6 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 9 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 22 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 33 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 16 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 16 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 5 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 32 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 23 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 19 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 17 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 22 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 19 km (margin 12 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 21 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 8 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 6 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 6 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 9 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 4 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 12 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 13 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 14 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 24 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 12 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 15 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 15 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 14 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 15 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 15 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 23 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 16 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 42 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 19 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 13 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 15 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 23 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 10 km away, next is 27 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 25 km (margin 14 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 20 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 19 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 24 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 23 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 17 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 19 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 20 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 6 km away, next is 22 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 20 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 15 km (margin 12 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 13 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 14 km (margin 13 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 11 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 47 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 25 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 5 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 7 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 19 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 8 km (margin 5 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 3 km away, next is 11 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 2 km away, next is 11 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 0 km away, next is 9 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 5 km away, next is 6 km (margin 2 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 1 km away, next is 8 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 16 km away, next is 20 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 24 km (margin 2 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 34 km (margin 1 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 32 km away, next is 34 km (margin 3 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 33 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 32 km (margin 14 km) | 1 |
| derived county is in GA but the row says WA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 27 km away, next is 35 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in MD but the row says WA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 44 km away, next is 54 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 38 km (margin 8 km) | 1 |
| derived county is in OR but the row says WA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 40 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 43 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| derived county is in NC but the row says WA - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 49 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 45 km away, next is 60 km (margin 15 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 43 km away, next is 59 km (margin 16 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 48 km away, next is 48 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 48 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 47 km away, next is 47 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 49 km away, next is 49 km (margin 0 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 39 km away, next is 58 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 48 km (margin 15 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 34 km away, next is 48 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 49 km away, next is 57 km (margin 8 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 38 km away, next is 44 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 22 km (margin 0 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 28 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 18 km away, next is 25 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 24 km (margin 4 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 33 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 31 km away, next is 35 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 24 km away, next is 30 km (margin 7 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 26 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 25 km (margin 6 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 27 km (margin 6 km) | 1 |
| derived county is in VA but the row says WI - ZIP or state is wrong | 1 |
| derived county is in VT but the row says WI - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 22 km away, next is 24 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 39 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 26 km away, next is 40 km (margin 14 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 14 km away, next is 34 km (margin 19 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 33 km away, next is 34 km (margin 1 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 41 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 31 km (margin 10 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 39 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 19 km away, next is 22 km (margin 4 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 28 km (margin 18 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 36 km (margin 19 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 31 km (margin 17 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 7 km away, next is 16 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 28 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 13 km away, next is 29 km (margin 17 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 29 km away, next is 38 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 25 km away, next is 34 km (margin 9 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 30 km (margin 9 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 20 km away, next is 31 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 30 km (margin 6 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 30 km away, next is 34 km (margin 3 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 21 km away, next is 40 km (margin 18 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 24 km (margin 8 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 23 km away, next is 43 km (margin 20 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 8 km away, next is 18 km (margin 11 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 11 km away, next is 31 km (margin 20 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 17 km away, next is 28 km (margin 10 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 15 km away, next is 19 km (margin 5 km) | 1 |
| ZCTA spans N counties; nearest county centroid is 9 km away, next is 19 km (margin 11 km) — OVERRODE the larger-by-land-area candidate | 1 |
| ZCTA spans N counties; nearest county centroid is 4 km away, next is 20 km (margin 17 km) | 1 |
| derived county is in NE but the row says WY - ZIP or state is wrong | 1 |
| ZCTA spans N counties; nearest county centroid is 66 km away, next is 72 km (margin 7 km) — OVERRODE the larger-by-land-area candidate | 1 |

### State mismatches: 169

The derived county sits in a different state than the row claims. Both
cannot be true. Confidence forced to 0 regardless of area share, because
Rule 3 would make a wrong county URL permanent.

```
guerneville: says Guerneville, AZ — ZIP 95446 resolves to Sonoma County
laguna-niguel-regional-park: says Laguna Niguel, AZ — ZIP 92677 resolves to Orange County
mt-tam-racquet-club: says Larkspur, AZ — ZIP 94939 resolves to Marin County
shady-oaks-park: says Orangevale, AZ — ZIP 95662 resolves to Sacramento County
newhall: says Newhall, CA — ZIP 86321 resolves to Yavapai County
stonehouse-park-rancho-murieta-ca: says Rancho Murieta, CA — ZIP 98583 resolves to Grays Harbor County
boone-county-family-ymca-5974: says Boone, CO — ZIP 50036 resolves to Boone County
lifetime-fitness-parker-colorado: says Parker, CO — ZIP 16049 resolves to Butler County
westbrook-community-center: says Westbrook, CT — ZIP 04092 resolves to Cumberland County
nye-jordan-park: says Bartow, FL — ZIP 30338 resolves to DeKalb County
silver-lakes-rv-and-golf-resort: says Naples, FL — ZIP 39114 resolves to Smith County
lakeside-landings: says Oxford, FL — ZIP 04428 resolves to Penobscot County
temple-baptist-gym: says Mount Airy, GA — ZIP 27030 resolves to Surry County
islands-family-ymca: says Savannah, GA — ZIP 38372 resolves to Hardin County
del-webb-cane-bay-pickleball-club: says Summerville, GA — ZIP 29483 resolves to Dorchester County
... 154 more
```

## What this unlocks

- Distinct counties with at least one accepted venue: **1,631**
- Counties with **3 or more** accepted venues (Rule 8 threshold): **979**

Those county pages are still not publishable — Rule 8 counts VERIFIED
venues, and no row has qualifying provenance. This is the county page
ceiling once provenance is attached, not a publishable set.

| rank | county | state | venues |
| ---: | --- | --- | ---: |
| 1 | Maricopa | AZ | 160 |
| 2 | King | WA | 151 |
| 3 | Los Angeles | CA | 135 |
| 4 | San Diego | CA | 129 |
| 5 | Honolulu | HI | 128 |
| 6 | Riverside | CA | 116 |
| 7 | Middlesex | MA | 115 |
| 8 | Sacramento | CA | 114 |
| 9 | Orange | CA | 102 |
| 10 | Cook | IL | 96 |
| 11 | Suffolk | NY | 93 |
| 12 | Worcester | MA | 92 |
| 13 | Fairfield | CT | 90 |
| 14 | Essex | MA | 76 |
| 15 | Palm Beach | FL | 75 |
| 16 | Harris | TX | 75 |
| 17 | Cuyahoga | OH | 73 |
| 18 | Brevard | FL | 72 |
| 19 | Clark | NV | 72 |
| 20 | Montgomery | MD | 69 |
| 21 | Hennepin | MN | 67 |
| 22 | Pinellas | FL | 66 |
| 23 | Dane | WI | 64 |
| 24 | Sussex | DE | 62 |
| 25 | Broward | FL | 59 |

## Limitations, stated

1. **A ZCTA is not a ZIP code.** ZCTAs approximate ZIP delivery areas;
   PO-box and point ZIPs have none. Those rows return `none` rather than
   being force-matched to a neighbour.
2. **Area share is not population share.** The relationship file carries
   land area, not addresses. A ZCTA can be mostly rural land in one county
   while its population sits in another, so a high share is strong
   evidence, not proof.
3. **No point-in-polygon.** Deriving from lat/lng would be more accurate
   and would settle multi-county ZCTAs properly, but needs county boundary
   geometry and a shapefile reader. Rows with coordinates but no usable
   ZIP are left underived rather than guessed from a centroid.

Because of limitation 2, no result here is given the 0.98 that a true
point-in-polygon derivation would earn. The ceiling is 0.90.
