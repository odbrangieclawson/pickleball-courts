# Tallahassee verification - a count, a price and the rules of play on one page

Run 2026-09-07. 7 venues published, 34 courts (33 outdoor, 1 indoor). 5 venues refused.

Tallahassee is the third city in Florida on this site and the first in Leon County.

| venue | courts | in | out | lit | free | what the City writes | address |
| --- | ---: | ---: | ---: | --- | --- | --- | --- |
| `leverne-payne-community-center` | 6 | - | 6 | not stated | yes (Open Play) | "2 courts with adjustable net straps, 4 courts with portable nets if needed and all have painted lines" | 450 West 4th Avenue |
| `tom-brown-park` | 12 | - | 12 | not stated | yes (Open Play) | "4 pickleball courts | 8 pickleball courts on multi-purpose courts (tennis courts 1-4)" | 501 Easterwood Avenue |
| `winthrop-park` | 6 | - | 6 | not stated | not stated | "6 courts" | 1601 Mitchell Avenue |
| `jack-l-mclean-jr-community-center` | 2 | - | 2 | not stated | not stated | "2 courts with adjustable net straps and painted lines" | 700 Paul Russell Road |
| `jake-gaither-community-center` | 3 | 1 | 2 | not stated | not stated | "1 indoor court, 2 outdoor courts" | 801 Bragg Drive |
| `lafayette-park` | 2 | - | 2 | not stated | not stated | "2 courts with net tie-downs - paddles and balls available inside the Sue McCollum Community Center only during regular office hours" | 501 Ingleside Drive |
| `walker-ford-community-center` | 3 | - | 3 | yes ("night play") | not stated | "3 courts - night play is available" | 2301 Pasco Street |

## How "free" is read

The City prices Open Play at nothing and Reserved Play at $4.25 to $5.75, and puts no price on First-Come
First-Play. A venue publishes `fee_type = free` only where the City schedules an Open Play session; a
court that is open and unpriced is recorded as unknown, not as free. Winthrop's schedule is Reserved
Play and FCFP only, and McLean, Lafayette and Walker-Ford are "No Open or Reserved Play - FCFP Only".

## Refused

**Four Oaks Park** - "6 courts - Specific courts are identified in parentheses" - 5151 Four Oaks Boulevard

1. Neither address resolver finds "5151 Four Oaks Boulevard": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.
2. This is the most expensive refusal in the city. Six courts "used for pickleball only", an Open Play and Reserved Play schedule seven days a week running to 10:00pm, and online reservations - the flagship of the City's programme. It fails on its address alone, and the run throws the day the address resolves.

**Lawrence-Gregory Community Center at Dade Street** - 1115 Dade Street | 850-891-3910

1. Listed on the City's indoor schedule with an address and a Saturday Open Play session, and never a court count. Page Gate 1 requires a stated count.

**Lincoln Neighborhood Center** - 438 West Brevard Street | 850-891-4180

1. Listed on the City's indoor schedule as "No Pickleball (renovations in progress)" for every day, with no court count.

**Sue Herndon McCollum Community Center** - 501 Ingleside Avenue | 850-891-3946

1. Listed on the City's indoor schedule with Open Play and Reserved Play sessions and never a court count. Its outdoor courts are Lafayette Park's, which publish.

**Tallahassee Senior Center** - 1400 North Monroe Street | 850-891-4000 | $3 Donation Encouraged

1. Listed on the City's indoor schedule with Open Play sessions, lessons and "$3 Donation Encouraged", and never a court count.

## Tom Brown Park is two imported rows

`tom-brown-park` (501 EASTERWOOD DR) and `tom-brown-park-pickleball-courts` ("Easterwood Dr & Access Rd 16")
both canonicalise to `tom-brown-park` and the identity pass holds both. The City publishes one Tom Brown
Park at 501 Easterwood Avenue with twelve courts. A resolution in `data/identity/resolutions.json` naming
the first row as the keeper is required before Import Gate I1 will promote it.

## One address the City writes two ways

Lafayette Park: "501 Ingleside Drive" on the pickleball line, "501 Ingleside Avenue" for the Sue McCollum
Community Center on the same site. The Census resolves Avenue; OpenStreetMap has no Ingleside Drive at that
number. The count-bearing spelling publishes and both are asserted.

## A closure published as printed

McLean: "Due to scheduled resurfacing, both the outdoor tennis and pickleball courts at jack mclean will be unavailable for  use until december 5, 2025." - still on the page on 2026-09-07; asserted.

## What Tallahassee does not say

- **surface**, anywhere.
- **lighting**, except Walker-Ford's "night play is available". Four Oaks's 10:00pm schedule is not a statement about lights.
- **hours**, except Jake Gaither's "Outdoor FCFP: 8:00am - 9:00pm Daily, Closed on Sunday".
- **postcodes.** The resolver's publish.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `tom-brown-park` | name | "TOM BROWN PARK" | "Tom Brown Park" | agreed |
| `tom-brown-park` | total_courts | 4 | 12 | overridden |
| `tom-brown-park` | outdoor_courts | 16 | 12 | overridden |
| `tom-brown-park` | street_address | "501 EASTERWOOD DR" | "501 Easterwood Avenue" | overridden |
| `tom-brown-park` | postal_code | "32301" | "32311" | overridden |
| `tom-brown-park` | pricing_notes | "Free public play" | "Open Play sessions are drop-in and free. Reserved Play sessions require a fee: Singles $5.75, Singles Senior $4.75, Doubles $4.25, Doubles Senior $3.50 (senior rate from age 62). Reservations online or by phone on 850-891-4940." | overridden |
| `winthrop-park` | street_address | "1601 Mitchell Ave" | "1601 Mitchell Avenue" | overridden |
| `winthrop-park` | pricing_notes | "Public" | "No Open Play session is scheduled and no price is stated for first-come play. Reserved Play sessions require a fee: Singles $5.75, Singles Senior $4.75, Doubles $4.25, Doubles Senior $3.50 (senior rate from age 62). Reservations online or by phone on 850-891-4940." | overridden |
| `jack-l-mclean-jr-community-center` | name | "Jack L. Mclean Jr. Community Center" | "Jack L. McLean Jr. Community Center" | agreed |
| `jack-l-mclean-jr-community-center` | outdoor_courts | 0 | 2 | overridden |
| `jack-l-mclean-jr-community-center` | street_address | "700 Paul Russel Road" | "700 Paul Russell Road" | overridden |
| `walker-ford-community-center` | total_courts | 6 | 3 | overridden |
| `walker-ford-community-center` | street_address | "2301 Pasco Street , Tucker Street, Near Famu" | "2301 Pasco Street" | overridden |
