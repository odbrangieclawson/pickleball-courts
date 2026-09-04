# Madison verification - the first city that states its surfaces

Run 2026-09-04. 23 venues published, 67 courts (62 outdoor, 5 indoor). 1 venue excluded.

Madison Parks publishes a court count and a surface on each park page, in one line under a
"Tennis & Pickleball" or "Pickleball" heading. Before this city, five of the seventy-four venues
in this directory had a verified surface. Madison adds twenty.

| venue | courts | surface | lit | what the City writes |
| --- | ---: | --- | --- | --- |
| `bordner-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `brittingham-park` | 4 | asphalt | not stated | "Courts: 4, asphalt" |
| `door-creek-park` | 8 | asphalt | not stated | "Courts: 8, asphalt" |
| `rennebohm-park` | 6 | asphalt | not stated | "Courts: 6, asphalt" |
| `elver-park` | 3 | asphalt | not stated | "Courts: 3, asphalt" |
| `garner-park` | 6 | asphalt | not stated | "Courts: 6, asphalt" |
| `heritage-heights-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `huegel-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `kennedy-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `nakoma-park` | 1 | asphalt | not stated | "Courts: 1, asphalt" |
| `norman-clayton-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `northland-manor-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `olbrich-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `reynolds-park` | 2 | modular_tile | not stated | "Courts: 2, sport court tile" |
| `richmond-hill-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `tenney-park` | 3 | asphalt | yes | "Courts: 3, asphalt, lighted" |
| `walnut-grove-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `warner-park` | 3 | asphalt | not stated | "Courts: 3, asphalt" |
| `waunona-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `westhaven-trails-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `westmorland-park` | 2 | modular_tile | not stated | "Courts: 2, sport court tile" |
| `wexford-park` | 2 | asphalt | not stated | "Courts: 2, asphalt" |
| `warner-park-community-recreation-center` | 5 | not stated | not stated | "Blue Gym: 2 courts - 20ft x 44ft"; "Green Gym: 3 courts - 20ft x 44ft" |

Surfaces: 20 asphalt, 2 modular_tile.

## What "Courts: N" means

Most of these are tennis courts striped for pickleball, so an unqualified count could have meant
either the courts you can play on or the tennis courts of which some are striped. Reindahl Park
settles it by being the exception:

> Courts: 8, asphalt; 4 striped for pickleball

When only some courts are striped, Madison says so. Reindahl is not published here - its address
does not resolve - but its snapshot is committed and this run asserts that line still exists,
because every other count in this city depends on it.

## Excluded

**Reindahl (Amund) Park** - "Courts: 8, asphalt; 4 striped for pickleball" at 1818 Portage Rd.. Neither address resolver places this at a house
number, so Import Gate I1 cannot be satisfied. The City states the courts; this is an identity
failure rather than a data one, and it publishes the day the address resolves.

Three venues were refused when Madison first published - Door Creek, Reindahl and Rennebohm, on
eighteen courts between them - because the Census address file has no record of any of the three
addresses. On 2026-09-04 Import Gate I1 gained a second resolver, OpenStreetMap, consulted only
where the Census has nothing and accepted only when it returns the house number asked for. Door
Creek and Rennebohm resolve at that level and now publish, which adds fourteen courts including
the largest outdoor count in the city. Reindahl still does not, and is still refused. A rule that
had admitted all three would have been a rule written to reach a wanted answer.

## One address, two venues

Warner Park has three outdoor courts. The Warner Park Community Recreation Center, at the same
address, has five indoor ones. They publish separately, where Bellevue's Hidden Valley Fieldhouse
and Sports Park published as a single venue. The difference is the operator: WPCRC has its own
pages, its own ID card, its own membership or daily admission and its own booking system, and the
outdoor courts have none of those - they are first come, first served with no stated charge.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `garner-park` | street_address | "333 South Rosa Road" | "333 S. Rosa Rd." | overridden |
| `heritage-heights-park` | postal_code | "53715" | "53714" | overridden |
| `norman-clayton-park` | surface | "clay" | "asphalt" | overridden |
| `norman-clayton-park` | postal_code | "53719" | "53711" | overridden |
| `northland-manor-park` | street_address | "902 Northland Dr, Madison, WI 53704" | "902 Northland Dr." | overridden |
| `northland-manor-park` | postal_code | "53705" | "53704" | overridden |
| `tenney-park` | total_courts | 2 | 3 | overridden |
| `tenney-park` | outdoor_courts | 2 | 3 | overridden |
| `walnut-grove-park` | postal_code | "53705" | "53717" | overridden |
| `westhaven-trails-park` | street_address | "3020 Cimarron Trail" | "3020 Cimarron Trl." | overridden |
