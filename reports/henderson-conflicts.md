# Henderson verification - five tables of counts, a directory of addresses, all read in a browser

Run 2026-09-07. 7 venues published, 33 courts (18 outdoor, 3 indoor, 12 on no stated side). 7 facilities refused.

Henderson is the second city in Nevada on this site and the second in Clark County, after Las Vegas. Its
sources are three text snapshots read in a browser, because cityofhenderson.com answers every scripted
fetch with HTTP 403; see `data/sources/henderson/README.md`. The City's pickleball page states a count
for every facility and no addresses; the addresses are the City's own, from its park directory and its
facility pages (Saint Paul's rule). Every row of all five tables and every address block is asserted
against those files, in order.

| venue | courts | indoor | outdoor | what the City writes | address, and where it is printed |
| --- | ---: | ---: | ---: | --- | --- |
| `black-mountain-recreation-center` | 18 | - | 18 | "Black Mountain Recreation Center 18" under "OUTDOOR PICKLEBALL COURTS" | "599 Greenway Rd." (facility page) |
| `aventura-park` | 2 | - | - | "Aventura Park 2" under "PICKLEBALL & TENNIS COMBINED" | "2525 Via Firenze" (park directory) |
| `mission-hills-park` | 3 | - | - | "Mission Hills Park 3" under "PICKLEBALL & TENNIS COMBINED" | "551 E. Mission Dr." (park directory) |
| `siena-heights-trailhead` | 2 | - | - | "Siena Heights Trailhead 2" under "PICKLEBALL & TENNIS COMBINED" | "2570 Siena Heights Dr." (park directory) |
| `sonata-park` | 2 | - | - | "Sonata Park 2" under "PICKLEBALL & TENNIS COMBINED" | "1550 Seven Hills Dr." (park directory) |
| `sunridge-park` | 2 | - | - | "Sunridge Park 2" under "PICKLEBALL & TENNIS COMBINED" | "1010 Sandy Ridge Ave." (park directory) |
| `silver-springs-recreation-center` | 4 | 3 | - | "Silver Springs Recreation Center 3" under "INDOOR PICKLEBALL COURTS"; "Silver Springs Recreation Center 1" under "PICKLEBALL COURTS" | "1951 Silver Springs Pkwy." (facility page) |

## A side is claimed only where the City's heading says the word

Black Mountain's eighteen courts sit under "OUTDOOR PICKLEBALL COURTS" and publish as outdoor; Silver
Springs' three sit under "INDOOR PICKLEBALL COURTS" and publish as indoor. The five venues under
"PICKLEBALL & TENNIS COMBINED" are shared with tennis and the heading says nothing about a roof, so
indoor and outdoor are null on all five. The notes say the courts are shared.

## Silver Springs is printed twice

"Silver Springs Recreation Center 3" under "INDOOR PICKLEBALL COURTS" and "Silver Springs Recreation
Center 1" under a fifth heading that reads only "PICKLEBALL COURTS". Two City counts at one address
publish as one venue of four courts, three of them indoor (Mount Pleasant's Park West rule). The fourth
court is on no stated side. The venue is flagged for re-check on exactly that point.

## Black Mountain is one venue under two City names

The count page says "Black Mountain Recreation Center"; the park directory lists "Black Mountain
Pickleball Park" at the same address, 599 Greenway Rd., with pickleball among its amenities; the centre's
facility page prints the same address. One address, one venue, under the name the count page uses
(the Forest Hills / Edgemoor rule). Both blocks are asserted.

## Nothing is lit, surfaced, priced or timed, and nothing is free

The City writes no price, no hours, no surface and no lighting for any court, and never writes "free".
It says courts "can be reserved for a friendly game of pickleball, a tournament or event by calling the
Sports Office at 702-267-5717"; that publishes as a pricing note without a price. Play format is null
too: the page states reservations, not open play, and this project publishes only what the operator
says.

## Refused

**Blooming Cactus Park** - "Blooming Cactus Park 2" under "OUTDOOR PICKLEBALL COURTS", "410 Grand Cadence Drive"

1. The City states a count, "Blooming Cactus Park 2" under "OUTDOOR PICKLEBALL COURTS", and an address, "410 Grand Cadence Drive", and the address does not resolve. The Census address geocoder returns no match for it in Henderson, NV, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator (the Foster Park rule).
2. The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.

**Dundee Jones Park** - "Dundee Jones Park 2" under "OUTDOOR PICKLEBALL COURTS", "10550 Jeffreys St"

1. The City states a count, "Dundee Jones Park 2" under "OUTDOOR PICKLEBALL COURTS", and an address, "10550 Jeffreys St", and the address does not resolve. The Census address geocoder returns no match for it in Henderson, NV, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator (the Foster Park rule).
2. The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.

**Montagna Park** - "Montagna Park 4" under "OUTDOOR PICKLEBALL COURTS", "3495 Via Altamira"

1. The City states a count, "Montagna Park 4" under "OUTDOOR PICKLEBALL COURTS", and an address, "3495 Via Altamira", and the address does not resolve. The Census address geocoder returns no match for it in Henderson, NV, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator (the Foster Park rule).
2. The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.

**Whitney Mesa** - "Whitney Mesa 4" under "OUTDOOR PICKLEBALL COURTS", "1990 Patrick Ln."

1. The City states a count, "Whitney Mesa 4" under "OUTDOOR PICKLEBALL COURTS", and an address, "1990 Patrick Ln.", and the address does not resolve. The Census address geocoder returns no match for it in Henderson, NV, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator (the Foster Park rule).
2. The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.

**Weston Hills Park** - "Weston Hills Park 2" under "PICKLEBALL & TENNIS COMBINED", "950 Weston Ridge St."

1. The City states a count, "Weston Hills Park 2" under "PICKLEBALL & TENNIS COMBINED", and an address, "950 Weston Ridge St.", and the address does not resolve. The Census address geocoder returns no match for it in Henderson, NV, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator (the Foster Park rule).
2. The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.

**Downtown Recreation Center** - "Downtown Recreation Center 3" under "INDOOR PICKLEBALL COURTS", "50 Van Wagenen St."

1. The City states a count, "Downtown Recreation Center 3" under "INDOOR PICKLEBALL COURTS", and an address, "50 Van Wagenen St.", and the address does not resolve. The Census address geocoder returns no match for it in Henderson, NV, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator (the Foster Park rule).
2. The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.

**Whitney Ranch Recreation Center** - "Whitney Ranch Recreation Center 1" under "INDOOR PICKLEWALL COURTS"

1. The City prints "Whitney Ranch Recreation Center 1" under the heading "INDOOR PICKLEWALL COURTS", a heading of its own, separate from "INDOOR PICKLEBALL COURTS". A pickle wall is a practice wall, not a court, and this directory counts courts. Nothing on the page states a pickleball court at Whitney Ranch.
2. This run asserts that heading and that row, so the day the City moves Whitney Ranch under a pickleball heading the run fails and the venue is reconsidered.

## Imported rows left pending

- **Dundee Jones Park** (imported at "10561 Jeffreys", two courts) is refused above on the City's address, "10550 Jeffreys St".
- **Montagna Park** (imported as montagna-park-henderson-nv, four courts, same street) is refused above on the address.
- **Downtown Recreation Center** (imported at "105 West Basic Road", three indoor courts, with a drop-in fee) is refused above: the City
  prints the centre at "50 Van Wagenen St." and that address resolves nowhere; "105 W. Basic Rd." is Downtown Park in the City's directory.
- **Whitney Mesa Tennis/Pickleball Complex** and **Whitney Mesa Tennis Complex** (imported at 1661 and 1575 Galleria Drive, twelve and eight
  courts) are not the City's "Whitney Mesa 4", which the directory places at 1990 Patrick Ln.; that address is refused above and the
  imported rows stay pending.
- Clubs, commercial facilities, residential communities and gyms in the imported rows are not on the City's page and stay pending.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `black-mountain-recreation-center` | name | "Black Mountain Recreation Center Pickleball Courts" | "Black Mountain Recreation Center" | overridden |
| `black-mountain-recreation-center` | total_courts | 6 | 18 | overridden |
| `black-mountain-recreation-center` | street_address | "599 Greenway Road" | "599 Greenway Rd." | overridden |
| `black-mountain-recreation-center` | pricing_notes | "Free public play" | "Courts can be reserved by calling the City's Sports Office; the City publishes no price for a reservation and does not say the courts are free." | overridden |
| `black-mountain-recreation-center` | outdoor_courts | 6 | 18 | overridden |
| `mission-hills-park` | total_courts | 8 | 3 | overridden |
| `mission-hills-park` | street_address | "551 East Mission Drive" | "551 E. Mission Dr." | overridden |
| `mission-hills-park` | pricing_notes | "No Fee" | "Courts can be reserved by calling the City's Sports Office; the City publishes no price for a reservation and does not say the courts are free." | overridden |
| `mission-hills-park` | postal_code | "89009" | "89002" | overridden |
| `siena-heights-trailhead` | total_courts | 3 | 2 | overridden |
| `siena-heights-trailhead` | street_address | "2570 Siena Heights Drive" | "2570 Siena Heights Dr." | overridden |
| `siena-heights-trailhead` | pricing_notes | "No Fee" | "Courts can be reserved by calling the City's Sports Office; the City publishes no price for a reservation and does not say the courts are free." | overridden |
