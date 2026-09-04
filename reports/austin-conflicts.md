# Austin verification - the city that answers the lighting question

Run 2026-09-04. 21 venues published, 60 courts, all outdoor. 1 venue excluded.

**11 of 21 venues are stated lit.** Before Austin, forty-three of the ninety-five
venues in this directory carried a verified answer on lighting either way - and more than half of
those came from one Seattle GIS layer. Austin states it for eleven in prose.

**3 venues state that a net is NOT provided** - "bring your own portable net" or "Nets not
included." No other city in this directory has said either way anywhere.

| venue | courts | composition | lit | nets | county |
| --- | ---: | --- | --- | --- | --- |
| `austin-high-tennis-center` | 3 | dedicated | yes | not stated | Travis |
| `austin-tennis-and-pickleball-center` | 8 | dedicated | yes | not stated | Travis |
| `beverly-s-sheffield-northwest-district-park` | 4 | striped on 2 courts | yes | not stated | Travis |
| `brentwood-neighborhood-park` | 2 | striped on 1 court | yes | **not provided** | Travis |
| `delta-pocket-park` | 1 | dedicated | not stated | not stated | Travis |
| `dick-nichols-district-park` | 5 | striped on 2 courts | yes | not stated | Travis |
| `don-baylor-neighborhood-park` | 2 | striped on 1 court | not stated | not stated | Travis |
| `eastside-pocket-park` | 1 | dedicated | not stated | not stated | Travis |
| `gus-garcia-district-park` | 2 | striped on 1 court | not stated | not stated | Travis |
| `hancock-recreation-center` | 2 | striped on 1 court | not stated | not stated | Travis |
| `little-zilker-neighborhood-park` | 4 | striped on 1 court | yes | not stated | Travis |
| `mary-frances-baylor-clarksville-pocket-park` | 1 | dedicated | not stated | not stated | Travis |
| `mary-moore-searight-metro-park` | 4 | striped on 1 court | not stated | not stated | Travis |
| `mountain-view-neighborhood-park` | 4 | striped on 1 court | not stated | not stated | Travis |
| `north-lake-creek-neighborhood-park` | 1 | striped on 1 court | not stated | not stated | Williamson |
| `pan-american-neighborhood-park` | 4 | 3 dedicated + 1 striped | yes | not stated | Travis |
| `patterson-neighborhood-park` | 2 | striped on 1 court | yes | not stated | Travis |
| `rosewood-neighborhood-park` | 4 | 2 dedicated + 2 striped | yes | **not provided** | Travis |
| `shipe-neighborhood-park` | 2 | striped on 1 court | yes | not stated | Travis |
| `south-austin-neighborhood-park` | 2 | dedicated | yes | not stated | Travis |
| `springwoods-neighborhood-park` | 2 | striped on 1 court | not stated | **not provided** | Williamson |

## How Austin counts

Most entries give two numbers - "2 Multi-purpose Outdoor Courts with striping for 4 Pickleball
Courts" - meaning two physical slabs yielding four pickleball courts. The pickleball figure is what
this directory records. Two venues carry both forms and are added: Pan American is 3 dedicated plus
1 striped, and Rosewood is 2 dedicated plus 2 striped.

## Assertions are per venue, not per page

"Lighted during park hours" appears eleven times on this page and the standard open-play line
fifteen. A check that the string exists somewhere in the snapshot would prove nothing about which
park it belongs to. This run splits the list into one block per venue, cut at the venue names, and
asserts every fact inside its own block - so a lighting claim that moves parks fails the build.

## Two postcodes the City and the Census disagree on

| venue | City prints | geocoder returns |
| --- | --- | --- |
| `eastside-pocket-park` | 78702 | 78721 |
| `north-lake-creek-neighborhood-park` | 78753 | 78717 |

The geocoder's answer publishes, as it does for every venue in this directory, and the
disagreement is recorded rather than quietly resolved.

## Austin is in two counties

19 venues in Travis County, 2 venues in Williamson County.
Travis clears the three-venue threshold and gets a county page; Williamson does not and gets none.

## Excluded

**Balcones District Park** - "1 Multi-purpose outdoor court with striping for Pickleball, bring your own portable net" - two independent reasons:

1. The City states no pickleball court count for it. Its entry reads "striping for Pickleball" where every other multi-purpose entry on the page gives a figure — "striping for 4 Pickleball Courts", "striping for 2 Pickleball Courts". Page Gate 1 requires a verified court count and there is none to verify.
2. The Census address geocoder returns no match for "12017 Amherst Dr", so Import Gate I1 could not be satisfied either.

_No imported row was overwritten._
