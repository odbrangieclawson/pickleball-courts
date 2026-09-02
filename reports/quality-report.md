# Data quality report

Generated from `data.csv` — **18,037 rows**, 37 source columns.

Read-only. No value in this report has been repaired, filled or inferred.

## 0. The finding that governs everything else

Every row carries a `source_url`. All 18,037 of them point to a single domain:

- `www.courtsource.us`

That is a **competitor directory, not a source**. Import Gate I2 requires
`verified_by` to be one of `municipal_source`, `owner_submission`,
`staff_check` or `user_report`. A competitor listing page is none of them.

- Rows with a URL in `source_url`: **18,037**
- Rows with provenance that satisfies I2: **0**
- Rows with a `date_checked`: **0** (the column does not exist in the source)

**Every row is blocked at I2. Publishable pages today: zero.**

## 1. Null rate per field (after mapping to v4)

Counted on the mapped v4 record, so it reflects what the model would
actually hold — including nulls created by policies P1 and P2, which are
broken out separately in section 3.

| v4 field | nulls | rate |
| --- | ---: | ---: |
| `slug` | 0 | 0.0% |
| `name` | 0 | 0.0% |
| `city` | 0 | 0.0% |
| `state` | 0 | 0.0% |
| `county` | 18,037 | 100.0% |
| `postal_code` | 528 | 2.9% |
| `street_address` | 1 | 0.0% |
| `latitude` | 245 | 1.4% |
| `longitude` | 245 | 1.4% |
| `total_courts` | 171 | 0.9% |
| `indoor_courts` | 0 | 0.0% |
| `outdoor_courts` | 0 | 0.0% |
| `surface` | 14,076 | 78.0% |
| `nets_provided` | 18,037 | 100.0% |
| `covered` | 12,857 | 71.3% |
| `climate_control` | 11,097 | 61.5% |
| `light` | 12,121 | 67.2% |
| `access_type` | 121 | 0.7% |
| `fee_type` | 10,290 | 57.0% |
| `membership_from_usd` | 16,901 | 93.7% |
| `pricing_notes` | 285 | 1.6% |
| `pricing_details` | 819 | 4.5% |
| `play_format` | 18,037 | 100.0% |
| `level_of_play` | 17,879 | 99.1% |
| `court_availability` | 17,181 | 95.3% |
| `venue_type` | 10,180 | 56.4% |
| `restroom` | 11,975 | 66.4% |
| `pro_shop` | 17,899 | 99.2% |
| `parking` | 16,465 | 91.3% |
| `amenities` | 5,858 | 32.5% |
| `website` | 10,405 | 57.7% |
| `phone` | 8,653 | 48.0% |
| `hours_of_operation` | 68 | 0.4% |
| `rating` | 0 | 0.0% |
| `user_rating` | 18,037 | 100.0% |
| `review_count` | 18,037 | 100.0% |
| `claimed_or_verified` | 0 | 0.0% |
| `source_url` | 0 | 0.0% |
| `date_checked` | 18,037 | 100.0% |
| `verified_by` | 18,037 | 100.0% |
| `status` | 0 | 0.0% |
| `claimed_by_owner` | 0 | 0.0% |
| `claim_date` | 18,037 | 100.0% |
| `drop_in_fee_usd` | 15,239 | 84.5% |
| `source_sport` | 0 | 0.0% |

## 2. Court arithmetic (Rule 13)

Rule 13 applies only where all three values are present: **17,866 rows** (99.1%).

- Rows where `total_courts != indoor + outdoor`: **266** (1.5% of checkable rows)

Sample:

```
city-of-dothan-pickleball-complex-dothan: total=25, indoor=0, outdoor=0
rip-hewes-pickleball-complex-dothan: total=25, indoor=0, outdoor=0
shaols-pickleball-club: total=20, indoor=3, outdoor=0
tuscaloosa-county-pickleball-association: total=4, indoor=3, outdoor=0
courtside-park-sylacauga: total=8, indoor=0, outdoor=0
summerhill-racquet-and-athletic-club: total=3, indoor=3, outdoor=4
anthem-community-center: total=14, indoor=0, outdoor=10
golden-sun-rv-resort: total=4, indoor=0, outdoor=2
prospector-park-pickleball-courts-apache-junction: total=10, indoor=0, outdoor=0
sun-city-festival: total=16, indoor=0, outdoor=24
```

## 3. Zero-filled and FALSE-filled nulls

The source has **no blank cells at all** in these columns. A column that
cannot express "unknown" was not recording one — the upstream process
collapsed missing values into `0` or `FALSE`. Rule 6 forbids treating
those as checked facts, so the mapper converts them to null and counts
them here.

| source column | filler | rows affected | rate | now null? |
| --- | --- | ---: | ---: | --- |
| `is_free` | `FALSE` | 14,627 | 81.1% | yes (P1) |
| `lighted` | `FALSE` | 12,121 | 67.2% | yes (P1) |
| `restrooms` | `FALSE` | 11,975 | 66.4% | yes (P1) |
| `pro_shop` | `FALSE` | 17,899 | 99.2% | yes (P1) |
| `climate_controlled` | `FALSE` | 11,097 | 61.5% | yes (P1) |
| `covered` | `FALSE` | 12,857 | 71.3% | yes (P1) |
| `claimed` | `FALSE` | 18,020 | 99.9% | no — identity field, kept as false |
| `total_courts` | `0` | 171 | 0.9% | yes (P2) |
| `rating` | `0` | 0 | 0.0% | yes (P2) |
| `user_rating` | `0` | 18,037 | 100.0% | yes (P2) |
| `review_count` | `0` | 18,037 | 100.0% | yes (P2) |
| `indoor_courts` | `0` | 10,723 | 59.5% | **no — kept** (P2 exception, Rule 14) |
| `outdoor_courts` | `0` | 6,575 | 36.5% | **no — kept** (P2 exception, Rule 14) |

## 4. Duplicate slug candidates (Rule 10)

- Distinct slugs: **18,016**
- Slugs used by more than one row: **21**
- Rows involved: **42**

- Slugs already carrying a numeric suffix (Rule 10 violation): **628**

```
fairview-recreation-center-5632  (Fairview Recreation Center, Anchorage AK)
o-malley-ice-and-sports-center-19  (O'Malley Ice and Sports Center, Anchorage AK)
the-alaska-dome-47  (The Alaska Dome, Anchorage AK)
the-northeast-muldoon-boys-girls-club-25  (The Northeast Muldoon Boys & Girls Club, Anchorage AK)
the-hames-center-50  (The Hames Center, Sitka AK)
ymca-of-calhoun-county-51  (Ymca Of Calhoun County, Anniston AL)
bessemer-wellness-recreation-center-51  (Bessemer Wellness & Recreation Center, Bessemer AL)
heardmont-park-54  (Heardmont Park, Birmingham AL)
chelsea-community-center-55  (Chelsea Community Center, Chelsea AL)
clay-pickleball-tennis-center-57  (Clay Pickleball & Tennis Center, Clay AL)
```

Sample collisions:

```
hale-iwa-beach-park  x2
    Hale?iwa Beach Park — Hale'iwa, HI
    Hale?iwa Beach Park — Hale'iwa, HI
sunset-beach-neighborhood-park  x2
    Sunset Beach Neighborhood Park — Hale'iwa, HI
    Sunset Beach Neighborhood Park — Hale'iwa, HI
hau-ula-community-park  x2
    Hau?ula Community Park — Hau'ula, HI
    Hau?ula Community Park — Hau'ula, HI
swanzy-beach-park-10938  x2
    Swanzy Beach Park — Kaʻaʻawa, HI
    Swanzy Beach Park — Kaʻaʻawa, HI
kapunahala-neighborhood-park  x2
    Kapunahala Neighborhood Park — Kāneʻohe, HI
    Kapunahala Neighborhood Park — Kāneʻohe, HI
laenani-neighborhood-park  x2
    Laenani Neighborhood Park — Kāneʻohe, HI
    Laenani Neighborhood Park — Kāneʻohe, HI
k-ne-ohe-community-senior-center  x2
    K?ne?ohe Community & Senior Center — Kne'ohe, HI
    K?ne?ohe Community & Senior Center — Kne'ohe, HI
k-ne-ohe-district-park  x2
    K?ne?ohe District Park — Kne'ohe, HI
    K?ne?ohe District Park — Kne'ohe, HI
kahalu-u-community-park  x2
    Kahalu?u Community Park — Kne'ohe, HI
    Kahalu?u Community Park — Kne'ohe, HI
kalani-anaole-beach-park  x2
    Kalani�anaole Beach Park — Wai'anae, HI
    Kalani�anaole Beach Park — Wai'anae, HI
```

## 5. Duplicate venue candidates (name similarity + proximity)

Two rows are a candidate pair when their normalised names match *and*
they sit within 2 km of each other, or when their names match and they
share a city. Candidates only — nothing is merged.

- Name-match pairs within 2 km: **181**
- Name-match pairs in the same city but not within 2 km (or missing coords): **74**

```
veterans-park-st-johns <-> veterans-park-13799  (Veterans Park / Veterans Park, St Johns FL) [same city]
willow-park-2 <-> willow-park-bennington-vt  (Willow Park / Willow Park, Bennington VT) [same city]
gattman-park-muscle-shoals <-> gattman-park-recreation-center  (Gattman Park / Gattman Park Recreation Center, Muscle Shoals AL) [within 2km]
rainbow-city-park <-> rainbow-city-recreation-center  (Rainbow City Park / Rainbow City Recreation Center, Rainbow City AL) [same city]
northwest-park-1499 <-> northwest-park-ia  (Northwest Park / Northwest Park, Davenport IA) [within 2km]
cheshire-park-901 <-> cheshire-park-cheshire  (Cheshire Park / Cheshire Park, Cheshire CT) [same city]
parque-los-arroyos <-> parque-los-arroyos-223  (Parque Los Arroyos / Parque Los Arroyos, Green Valley AZ) [within 2km]
kiwanis-courts <-> kiwanis-park-8730  (Kiwanis Courts / Kiwanis Park, Fayetteville GA) [within 2km]
kiwanis-park-1483 <-> kiwanis-park-ia  (Kiwanis Park / Kiwanis Park, Bettendorf IA) [same city]
lincoln-park-10232 <-> lincoln-park-il  (Lincoln Park / Lincoln Park, Red Bud IL) [within 2km]
```

## 6. Coordinates

- Missing latitude or longitude: **245** (1.4%)
- Null Island (0,0): **0**
- Out of valid range: **0**
- **Outside the stated state's bounding box: 30** (0.2%)

Bounding boxes are coarse and only prove a point is wrong, never that it
is right. A row inside its box may still be in the wrong state.

- State codes with no reference box: `MP`

```
guerneville: says AZ, coords 38.5020445,-122.9987407
shady-oaks-park: says AZ, coords 38.6785145,-121.2257818
anderson-valley-high-school: says CA, coords 37.4761991,-83.6749145
stapleton-rec-center: says CO, coords 32.9644062,-102.8249611
town-park-meeker: says CO, coords 45.0785112,-94.3104409
norwood-public-high-school-gym: says CO, coords 40.9988582,-73.958649
ymca-of-pueblo: says CO, coords 34.0380198,-118.3673282
public-court-millsboro: says DE, coords 39.981102,-80.0013245
southbridge-racquet-club: says GA, coords 43.1560785,-77.6923497
cole-park: says IA, coords 47.6144219,-122.192337
```

## 7. Postal code

- Missing postal_code: **528** (2.9%)
- **ZIP prefix disagrees with the stated state: 340** (1.9%)

**ZIP-vs-CITY was NOT checked.** It needs a ZIP-to-place reference table
this repo does not have. Reporting it as unchecked rather than
approximating it.

```
goodyear-tennis-complex: Goodyear, AZ has ZIP 89395
guerneville: Guerneville, AZ has ZIP 95446
laguna-niguel-regional-park: Laguna Niguel, AZ has ZIP 92677
mt-tam-racquet-club: Larkspur, AZ has ZIP 94939
shady-oaks-park: Orangevale, AZ has ZIP 95662
newhall: Newhall, CA has ZIP 86321
stonehouse-park-rancho-murieta-ca: Rancho Murieta, CA has ZIP 98583
boone-county-family-ymca-5974: Boone, CO has ZIP 50036
lifetime-fitness-parker-colorado: Parker, CO has ZIP 16049
westbrook-community-center: Westbrook, CT has ZIP 04092
```

## 8. Free text in fields that need controlled vocabularies (Gate I4)

### `surface` — 14,076 rows unmapped (78.0%)

| source value and reason | rows |
| --- | ---: |
| Standard — Carries no surface information. It is a placeholder value, not a measurement. | 13,766 |
| hard — Ambiguous: asphalt, concrete and acrylic are all "hard". Cannot be resolved without checking the venue. | 133 |
| Outdoor Surfacing — Describes location, not material. | 77 |
| Hard — Ambiguous: asphalt, concrete and acrylic are all "hard". Cannot be resolved without checking the venue. | 29 |
| Hard court — Ambiguous, same as "hard". | 9 |
| Laykold — unrecognised | 5 |
| Painted Concrete — unrecognised | 3 |
| mixed — More than one surface. Needs the O5 multi-surface decision before it can be recorded. | 3 |
| outdoor-style surfacing (indoor) — unrecognised | 2 |
| Acrytech Cushion-X — unrecognised | 2 |
| Hardwood/Gym Floor — unrecognised | 2 |
| Indoor Pro-Grade — unrecognised | 2 |
| sport_tech — unrecognised | 1 |
| outdoor-style (indoor) — unrecognised | 1 |
| Cushioned Gym Floor — unrecognised | 1 |
| *… 40 more distinct values* | |

### `venue_type` — 9,848 rows unmapped (54.6%)

| source value and reason | rows |
| --- | ---: |
| Public — Describes ACCESS, not who operates the venue. venue_type answers "who runs it"; this answers "who may enter". 47.5% of rows carry it. | 8,570 |
| Private — Describes ACCESS, not operator. | 788 |
| Commercial — Describes ownership model, not venue type. A commercial venue may be a fitness centre, a dedicated facility or an entertainment venue. | 206 |
| Community — Ambiguous between community_center and residential_community. | 103 |
| Sports Complex — Ambiguous between public_park and dedicated_pickleball_facility without checking the operator. | 73 |
| Private Club — unrecognised | 28 |
| Active Adult Community — unrecognised | 15 |
| indoor — unrecognised | 11 |
| Commercial Facility — unrecognised | 9 |
| outdoor — unrecognised | 8 |
| Indoor — unrecognised | 6 |
| Luxury Residential — unrecognised | 4 |
| Multi-Sport Complex — unrecognised | 2 |
| Golf Club — unrecognised | 2 |
| Social Club — unrecognised | 2 |
| *… 16 more distinct values* | |

### `fee_type` — 10,287 rows unmapped (57.0%)

| source value and reason | rows |
| --- | ---: |
| Public — Describes ACCESS, not cost. A public park may be free, permit-only or metered. 42.2% of rows carry it, and it is the single largest reason fee_type stays null. | 7,386 |
| Commercial — Describes the operator, not cost. A commercial venue may charge per session, by membership or both. | 1,474 |
| Public - Dedicated — Describes access and dedication, not cost. | 953 |
| Private — Describes access, not cost. | 454 |
| Hotel/Resort — Describes the operator. Guest pricing is unknown. | 5 |
| Public - Coming Soon (2026) — unrecognised | 3 |
| Municipal — Describes the operator, not cost. | 2 |
| Public Park — Describes access, not cost. | 2 |
| Residents Only - Coming Soon — unrecognised | 1 |
| Public - Renovations Completing March 2026 — unrecognised | 1 |
| Fee — unrecognised | 1 |
| municipal — Describes the operator, not cost. | 1 |
| Public - Coming Soon (2027) — unrecognised | 1 |
| private — Describes access, not cost. | 1 |
| Drop-In Free — unrecognised | 1 |
| *… 1 more distinct values* | |

## 9. What `claimed` actually contains (Rule 11)

- `claimed = TRUE`: **17** rows (0.1%)
- `claimed = FALSE`: **18,020** rows
- Any other value: **0**

The column is a plain boolean with no verification content in it at all.
Rule 11 is satisfied cheaply here: it maps to `claimed_by_owner` and
touches neither `status` nor `verified_by`. Note that a claim on a row
with no source is still an unverified row.

All claimed rows:

```
pickle-n-play-arena-simi-valley — Pickle N Play Arena, Simi Valley CA
south-end-racquet-health-club-torrance-ca — South End Racquet & Health Club, Torrance CA
fruitville-park — Fruitville Park, Sarasota FL
longwood-park — Longwood Park, Sarasota FL
pompano-trailhead-pickleball-courts — Pompano Trailhead Pickleball Courts, Sarasota FL
pickleball-kingdom-south-cobb — Pickleball Kingdom South Cobb, Austell GA
oak-paddle-pickleball-club-1788128972010 — Oak & Paddle Pickleball Club, Schaumburg IL
old-foundry — Old Foundry, Walkerton IN
charlotte-indoor-tennis-club — Charlotte Indoor Tennis Club, Charlotte NC
ruckman-park-closter-closter-nj — Ruckman Park (Closter), Closter NJ
the-pickle-lodge — The Pickle Lodge, Cincinnati OH
match-point-pickleball-club — Match Point Pickleball Club, Columbus OH
dill-dinkers-hamilton-f30015 — Dill Dinkers Hamilton, Hamilton OH
silverton-pickleball-s-awesome-spa-working-with-ymca — Silverton Pickleball's Awesome: SPA, working with YMCA, Silverton OR
veterans-memorial-park — Veterans Memorial Park, Cedar Park TX
black-desert-resort — Black Desert Resort, Ivins UT
marysville-the-armory-marysville-wa — Marysville - The Armory, Marysville WA
```

## 10. Column dispositions

| source column | disposition | v4 target |
| --- | --- | --- |
| `slug` | map | `slug` |
| `name` | map | `name` |
| `city` | map | `city` |
| `state` | map | `state` |
| `postal_code` | map | `postal_code` |
| `street_address` | map | `street_address` |
| `total_courts` | map | `total_courts` |
| `indoor_courts` | map | `indoor_courts` |
| `outdoor_courts` | map | `outdoor_courts` |
| `surface` | vocab | `surface` |
| `access_type` | split | `fee_type + access_type` |
| `is_free` | split | `fee_type` |
| `drop_in_fee_usd` | extend | `drop_in_fee_usd` |
| `membership_from_usd` | map | `membership_from_usd` |
| `pricing_notes` | map | `pricing_notes` |
| `pricing_details` | map | `pricing_details` |
| `rating` | map | `rating` |
| `lighted` | map | `light` |
| `restrooms` | map | `restroom` |
| `pro_shop` | map | `pro_shop` |
| `climate_controlled` | map | `climate_control` |
| `covered` | map | `covered` |
| `amenities` | map | `amenities` |
| `website` | map | `website` |
| `latitude` | map | `latitude` |
| `longitude` | map | `longitude` |
| `phone` | map | `phone` |
| `hours` | map | `hours_of_operation` |
| `venue_type` | vocab | `venue_type` |
| `parking` | map | `parking` |
| `level_of_play` | map | `level_of_play` |
| `court_availability` | map | `court_availability` |
| `user_rating` | map | `user_rating` |
| `review_count` | map | `review_count` |
| `claimed` | split | `claimed_by_owner + claimed_or_verified` |
| `sport` | extend | `source_sport` |
| `source_url` | map | `source_url` |

All 37 source columns accounted for. Nothing dropped silently.

### v4 fields the source cannot fill

- **`county`** — Not in the source. Must be derived from lat/lng or postal_code, which needs a reference dataset this repo does not have. See reports/README of the county step.
- **`date_checked`** — Not in the source. No row carries any date at all, so Import Gate I2 cannot pass for any row.
- **`nets_provided`** — Not in the source and not derivable from any column.
- **`verified_by`** — Not in the source. The only candidate, source_url, points to a competitor directory, which is not one of the four permitted values.
- **`status`** — Set to pending for every row by Rule 12. Never computed from source data.
- **`claim_date`** — Not in the source, even for the 17 rows where claimed is TRUE.
- **`play_format`** — NO SOURCE SIGNAL. The brief asked for access_type to be split into fee_type and play_format, but access_type contains no play-format information: its values describe cost and entry, never whether a venue runs open play, leagues or lessons. Imported as null for all rows rather than guessed. court_availability mentions reservations on 3 rows, which is too thin to build a field on.
