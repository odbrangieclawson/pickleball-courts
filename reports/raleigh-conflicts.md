# Raleigh verification - what the sources changed and where they disagree

Run 2026-09-03. 11 venues.

Raleigh Parks states: "Raleigh Parks has 44 outdoor pickleball courts located at 11 locations". The eleven per-location counts
sum to 44, so the source reconciles with itself. This run refuses
to write anything if it stops doing so.

## Where the tier-1 page and the tier-2 GIS inventory disagree

| venue | raleighnc.gov/pickleball (tier 1) | Athletic Courts layer (tier 2) |
| --- | --- | --- |
| `baileywick-park` | 6 | 4 |
| `carolina-pines-park` | 4 | 3 |

Both are resolved in favour of tier 1 and flagged for one re-check.

## Every value a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `baileywick-park` | total_courts | 4 | 6 | overridden |
| `baileywick-park` | street_address | "9501 Baileywick Rd" | "9501 Baileywick Road" | overridden |
| `carolina-pines-park` | total_courts | 3 | 4 | overridden |
| `fred-fletcher-park` | street_address | "805 Washington St" | "820 Clay Street" | overridden |
| `method-community-park` | street_address | "514 Method Rd" | "514 Method Road" | overridden |
| `north-hills-park` | street_address | "100 Chowan Circle" | "100 Chowan Cir" | overridden |
| `north-hills-park` | website | "https://raleighnc.gov/parks-and-recreation/places/north-hills-park" | "https://raleighnc.gov/places/north-hills-park" | overridden |
| `north-hills-park` | street_address | "100 Chowan Cir" | "100 Chowan Circle" | overridden |
| `powell-drive-park` | street_address | "740 Powell Dr" | "740 Powell Drive" | overridden |
| `roberts-park` | street_address | "1300 E Martin St" | "1300 E. Martin St." | overridden |
| `sanderford-road-park` | street_address | "2623 Sanderford Rd" | "2623 Sanderford Road" | overridden |
| `southgate-park` | street_address | "1801 Proctor Rd" | "1801 Proctor Street" | overridden |
| `tarboro-road-community-center-outdoor-courts-raleigh-nc` | name | "Tarboro Road Community Center outdoor courts" | "Tarboro Road Park" | overridden |
| `tarboro-road-community-center-outdoor-courts-raleigh-nc` | venue_type | "community_center" | "public_park" | overridden |
| `tarboro-road-community-center-outdoor-courts-raleigh-nc` | street_address | "121 N Tarboro St" | "121 N. Tarboro Street" | overridden |

**15 values changed** across 11 venues.
