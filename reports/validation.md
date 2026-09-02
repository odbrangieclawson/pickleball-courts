# Data validation report

`data.csv` — 18,037 rows, **0 verified**.

**0 errors, 1557 warning types.**

An ERROR is a defect that would ship a wrong page. A WARNING is a defect
on a row that is not publishable anyway. With zero rows verified, almost
everything is a warning by construction — and each one becomes an error
automatically the moment its row is verified.

## Failures by type

| type | severity | count |
| --- | --- | ---: |
| `C2_schema` | warning | 640 |
| `C5_numeric_suffix` | warning | 627 |
| `C6_court_arithmetic` | warning | 266 |
| `C5_duplicate_slug` | warning | 21 |
| `C5_unresolvable` | warning | 1 |
| `C1_import_gates` | warning | 1 |
| `C7_count_mismatch` | warning | 1 |

## Why rows fail the import gates

| reason | rows |
| --- | ---: |
| status is "pending", not "verified" | 18,037 |
| source_url points to a competitor directory | 18,037 |
| no date_checked | 18,037 |
| no verified_by | 18,037 |
| no verified court count | 171 |
| no verified street_address | 1 |

## Slug registry audit (all rows)

- Distinct slugs: **18,016** of 18,037 rows
- Slugs with a numeric suffix (Rule 10 violation): **627**
- Colliding slugs: **21**
- Collisions the registry CAN resolve on real data: **20**
- Collisions needing a human: **1**

### Numeric-suffix slugs — every one must be renamed before publication

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
aquadome-recreation-center-58  (Aquadome Recreation Center, Decatur AL)
gulf-shores-cultural-center-63  (Gulf Shores Cultural Center, Gulf Shores AL)
guntersville-recreation-center-64  (Guntersville Recreation Center, Guntersville AL)
brahan-spring-recreation-center-66  (Brahan Spring Recreation Center, Huntsville AL)
fern-bell-recreation-center-67  (Fern Bell Recreation Center, Huntsville AL)
huntsville-madison-county-senior-center-68  (Huntsville Madison County Senior Center, Huntsville AL)
max-luther-drive-community-center-69  (Max Luther Drive Community Center, Huntsville AL)
optimist-park-recreation-center-70  (Optimist Park Recreation Center, Huntsville AL)
shurney-legacy-center-65  (Shurney Legacy Center, Huntsville AL)
trinity-united-methodist-church-71  (Trinity United Methodist Church, Huntsville AL)
... 607 more
```

### Collisions, with the disambiguation the registry proposes

```
hale-iwa-beach-park  x2
    -> hale-iwa-beach-park   (Hale?iwa Beach Park, Hale'iwa)
    -> hale-iwa-beach-park-62-449-kamehameha-hwy   (Hale?iwa Beach Park, Hale'iwa)
sunset-beach-neighborhood-park  x2
    -> sunset-beach-neighborhood-park   (Sunset Beach Neighborhood Park, Hale'iwa)
    -> sunset-beach-neighborhood-park-59-104-kamehameha-hwy   (Sunset Beach Neighborhood Park, Hale'iwa)
hau-ula-community-park  x2
    -> hau-ula-community-park   (Hau?ula Community Park, Hau'ula)
    -> hau-ula-community-park-54-050-kamehameha-hwy   (Hau?ula Community Park, Hau'ula)
kapunahala-neighborhood-park  x2
    -> kapunahala-neighborhood-park   (Kapunahala Neighborhood Park, Kāneʻohe)
    -> kapunahala-neighborhood-park-45-800-anoi-rd   (Kapunahala Neighborhood Park, Kāneʻohe)
laenani-neighborhood-park  x2
    -> laenani-neighborhood-park   (Laenani Neighborhood Park, Kāneʻohe)
    -> laenani-neighborhood-park-47-053-laenani-dr   (Laenani Neighborhood Park, Kāneʻohe)
k-ne-ohe-community-senior-center  x2
    -> k-ne-ohe-community-senior-center   (K?ne?ohe Community & Senior Center, Kne'ohe)
    -> k-ne-ohe-community-senior-center-45-613-puohala-st   (K?ne?ohe Community & Senior Center, Kne'ohe)
k-ne-ohe-district-park  x2
    -> k-ne-ohe-district-park   (K?ne?ohe District Park, Kne'ohe)
    -> k-ne-ohe-district-park-45-660-keaahala-rd   (K?ne?ohe District Park, Kne'ohe)
kahalu-u-community-park  x2
    -> kahalu-u-community-park   (Kahalu?u Community Park, Kne'ohe)
    -> kahalu-u-community-park-47-260-waihee-rd   (Kahalu?u Community Park, Kne'ohe)
kalani-anaole-beach-park  x2
    -> kalani-anaole-beach-park   (Kalani�anaole Beach Park, Wai'anae)
    -> kalani-anaole-beach-park-89-269-farrington-hwy   (Kalani�anaole Beach Park, Wai'anae)
m-kaha-community-park  x2
    -> m-kaha-community-park   (M?kaha Community Park, Wai'anae)
    -> m-kaha-community-park-84-730-manuku-st   (M?kaha Community Park, Wai'anae)
wai-anae-district-park  x2
    -> wai-anae-district-park   (Wai�anae District Park, Wai'anae)
    -> wai-anae-district-park-85-601-farrington-hwy   (Wai�anae District Park, Wai'anae)
hesse-park  x2
    -> hesse-park   (Hesse Park, O'Fallon)
    -> hesse-park-n-madison-st   (Hesse Park, O'Fallon)
```

## Sample errors

None. No row is verified, so no row can ship a wrong page yet.
