# San Antonio verification - outdoor, indoor and lighted in the City's own sentence

Run 2026-09-07. 8 venues published, 43 courts (35 outdoor, 2 indoor, 6 unstated). 2 venues refused.

San Antonio is the second city in Texas on this site, after Austin, and the first in Bexar County.

| venue | courts | in | out | lit | what the City writes | address |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `fairchild-park` | 18 | - | 18 | yes | "There are 18 lighted, outdoor pickleball courts." | 1214 E Crockett St, San Antonio, TX 78202 |
| `garza-park` | 2 | - | 2 | not stated | "There are two outdoor pickleball courts." | 1450 Mira Vista, San Antonio, TX 78228 |
| `monterrey-park` | 8 | - | 8 | not stated | "There are eight outdoor pickleball courts." | 5909 W Commerce St, San Antonio, TX 78237 |
| `normoyle-park` | 4 | - | 4 | not stated | "There are four outdoor pickleball courts." | 700 Culberson Ave, San Antonio, TX 78225 |
| `oak-haven-park` | 1 | - | 1 | not stated | "There is one outdoor pickleball court." | 2215 Rest Haven Dr, San Antonio, TX 78232 |
| `palm-heights-park` | 2 | 2 | - | not stated | "There are 2 indoor pickleball courts." | 1201 W Malone, San Antonio, TX 78225 |
| `pittman-sullivan-park` | 2 | - | 2 | not stated | "There are two outdoor pickleball courts." | 1101 Iowa St, San Antonio, TX 78203 |
| `tejeda-park` | 6 | - | - | yes | "There are 6 lighted, pickleball courts." | 541 Division, San Antonio, TX 78214 |

## Tejeda says "lighted" and not "outdoor"

"There are 6 lighted, pickleball courts." Every other park page puts "outdoor" or "indoor" in the sentence;
Tejeda's does not, so its breakdown stays null. Quoting an operator means not completing its sentences.

## "Some courts are not lighted."

That caveat on the directory page is why seven venues carry no lighting answer. A park page that says
"The tennis court is not lighted" is talking about tennis, and the run fails if any of those pages gains
a lighting word about pickleball.

## Refused

**Piazza Italia Park** - "There is one outdoor pickleball court." - 500 Columbus, San Antonio, TX 78207

1. Neither address resolver finds "500 Columbus": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. The City writes the address without a street type on both its directory page and the park's own page. Import Gate I1 requires a street address that resolves.
2. One outdoor court, restrooms in the amenity list, and park hours stated. It fails on its address alone.

**Hamilton Community Center** - "Courts at Hamilton Community Center are available Saturday, 10 a.m. - 2 p.m." - 10700 Nacogdoches Rd., San Antonio, TX 78217

1. The City states no court count. The directory page lists the centre with its address and facility hours and gives its pickleball window - "Courts at Hamilton Community Center are available Saturday, 10 a.m. - 2 p.m." - and the number of courts appears nowhere. Page Gate 1 requires a stated count.
2. The address resolves in the City of San Antonio. The venue fails on the one fact it is missing, as Mesa's six parks and Cape Coral's Four Freedoms did.

## Fetched with a browser header set

www.sa.gov answered a bare curl with 200 during the search and with 403 twenty minutes later.
`scripts/verify/fetch/san-antonio.sh` carries the header set that it serves the document to.

## The directory says eleven results and serves ten

Nine parks and Hamilton Community Center are listed; the pager's page 2 returns the same ten. The
"11 Result(s) Found" line is asserted so a change is noticed, and the eleventh is not guessed at.

## What San Antonio does not say

- **price.** "first-come, first-served" is a play format. Null everywhere.
- **surface.**
- **lighting**, at seven of nine venues.

_No imported row was overwritten._
