# Long Beach verification - one line per park, dedicated and striped counted apart

Run 2026-09-07. 8 venues published, 48 courts (23 dedicated). 3 venues refused.

Long Beach is the third city in California on this site and the first in Los Angeles County.

| venue | courts | dedicated | what the City writes | address |
| --- | ---: | ---: | --- | --- |
| `deforest-park` | 8 | 8 | "DeForest Park (6255 DeForest Ave.) - 8 dedicated courts." | 6255 DeForest Ave |
| `silverado-park` | 4 | 4 | "Silverado Park (1545 W. 31st St.) - 4 dedicated pickleball courts. Call 562.570.1675." | 1545 W 31st St |
| `veterans-park` | 12 | 4 | "Veterans Park (101 E. 28th St.) - Hybrid location: 8 pickleball courts on 1 tennis court and 4 dedicated pickleball courts." | 101 E 28th St |
| `junipero-beach` | 2 | 2 | "Junipero Beach (2100 E. Ocean Blvd.) - 2 dedicated pickleball courts on repurposed half basketball court." | 2100 E Ocean Blvd |
| `el-dorado-park-west` | 3 | 0 | "El Dorado Park West (2800 N. Studebaker Rd.) - 3 pickleball courts on a shared sports court." | 2800 N Studebaker Rd |
| `bayshore-park` | 3 | 1 | "Bayshore Park (5415 E. Ocean) - 1 dedicated court, 2 dual-striped." | 5415 E Ocean |
| `marina-vista-park` | 8 | 4 | "Marina Vista Park (Colorado St. & Santiago) - Hybrid location: 4 dedicated pickleball courts and 4 dual-striped courts for either tennis or pickleball." | 5355 Eliot St |
| `el-dorado-park-tennis-center` | 8 | 0 | "El Dorado Tennis Center offers eight shared-use pickleball courts with drop-in play available on Tuesday and Thursday mornings from 8 to 11 am, and Friday evenings from 6 to 9pm." | 2800 Studebaker Road |

## The City's aggregate does not match its own list

"Currently there are 24 dedicated pickleball courts in Long Beach." The dedicated figures the City states venue by venue sum to 23. The sentence is
asserted, not used: a total is not a venue, and this one disagrees with the list beneath it.

## Two venues at 2800 Studebaker Road

El Dorado Park West (three courts on a shared sports court) and the El Dorado Park Tennis & Pickleball Center
(eight lit courts, its own hours and prices, its own page) share one address and publish as two venues, on
the test Madison's Warner Park set.

## Refused

**Somerset Park** - "Somerset Park (1500 E. Carson) - Dual striping 8 pickleball on 2 tennis courts."

1. The City writes "1500 E. Carson" on its pickleball page and "1500 E. Carson St." on the park's own page, with no city on either, and the Census address geocoder places that address in "Carson city", postcode 90745 - the neighbouring incorporated city that shares the street's name. A city page must contain venues in that city (the test that kept Scottsdale Community College off Scottsdale's page), and this one does not resolve inside Long Beach.
2. The count is stated - "Dual striping 8 pickleball on 2 tennis courts" - and the site is a City of Long Beach park on the City's own directory. The venue fails on where the resolver puts its address, and the run fails the day the address resolves inside Long Beach, so it is re-read rather than forgotten.

**Billie Jean King Tennis Center** - "Billie Jean King Tennis Center offers four shared-use pickleball courts"

1. Two City records, two numbers. The City's pickleball page says the centre "offers four shared-use pickleball courts"; the centre's own page lists "8 Pickleball Courts, Fully Lighted". The rule that decided Saint Paul and Lincoln - the record that states a number publishes - cannot choose between two numbers, and Irvine's Los Olivos was refused on exactly this shape. Both statements are asserted so the build fails when the City agrees with itself.

**Whaley Park** - "Whaley Park (5620 Atherton St.) - Dual-striped pickleball and volleyball court."

1. The City states no number: "Dual-striped pickleball and volleyball court." A court is not a count, and Page Gate 1 requires a stated count.

## What Long Beach does not say

- **indoor or outdoor**, about any venue. Null.
- **price at the parks.** "first-come, first-served" is a play format. Only the tennis centre is priced.
- **lighting**, except "8 Pickleball Courts, Fully Lighted" at the tennis centre. El Dorado Park West's
  "night-lighted basketball and multi-use courts" is not tied to the shared sports court the pickleball is on.
- **surface and nets.**
- **street addresses on the DeForest, Silverado and Veterans park pages**; those rest on the pickleball page.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `veterans-park` | total_courts | 8 | 12 | overridden |
| `veterans-park` | street_address | "101 E. 28th St. , enter on Spring" | "101 E 28th St" | overridden |
| `marina-vista-park` | total_courts | 4 | 8 | overridden |
| `marina-vista-park` | street_address | "5355 E Eliot Street , Right side tennis court" | "5355 Eliot St" | overridden |
| `marina-vista-park` | postal_code | "90803" | "90814" | overridden |
| `el-dorado-park-tennis-center` | name | "El Dorado Park Tennis Center" | "El Dorado Park Tennis & Pickleball Center" | overridden |
| `el-dorado-park-tennis-center` | street_address | "2800 N Studebaker Rd" | "2800 Studebaker Road" | overridden |
| `el-dorado-park-tennis-center` | drop_in_fee_usd | 10 | 5 | overridden |
| `el-dorado-park-tennis-center` | pricing_notes | "$$10/hour per court Monday thru Friday from 7am to 4pm. $15/hour per court Friday nights from 6pm to 9pm." | "Drop-in play $5 per person for up to three hours; private pickleball court reservations $10 per court per hour. Drop-in pickleball on Tuesday and Thursday mornings 8 to 11 am and Friday evenings 6 to 9 pm when read. No light fees." | overridden |
| `el-dorado-park-tennis-center` | hours_of_operation | "Private pickleball reservations from 7am to 4pm, Monday thru Friday, as well as Friday nights from 6pm to 9pm." | "Monday to Friday 7 a.m. to 9:30 p.m.; Saturday and Sunday 7 a.m. to 8 p.m." | overridden |
