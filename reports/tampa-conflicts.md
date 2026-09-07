# Tampa verification - twenty cards on one page, and a resolver that changes directions

Run 2026-09-07. 16 venues published, 52 courts (45 outdoor, 7 indoor). 3 venues refused.

Tampa is the second city in Florida on this site and the first in Hillsborough County. Every count and
address comes from one City page, dated "Updated: 10/28/2025".

| venue | courts | in | out | what the City writes | address |
| --- | ---: | ---: | ---: | --- | --- |
| `al-barnes-park` | 4 | - | 4 | "4 courts" | 2902 N 32nd St, 33605 |
| `copeland-park` | 4 | - | 4 | "4 courts" | 11001 N 15th St, 33612 |
| `cuscaden-park` | 6 | - | 6 | "6 courts" | 2900 N 15th St, 33605 |
| `davis-islands` | 2 | - | 2 | "2 multi-purpose courts" | 155 Columbia Drive, 33606 |
| `forest-hills` | 4 | 2 | 2 | "2 courts" | 724 W 109th Ave, 33612 |
| `highland-pines-park` | 4 | - | 4 | "4 courts" | 4505 E 21st St, 33605 |
| `julian-b-lane-park` | 6 | - | 6 | "2 permanent courts" and "4 portable net courts" | 1001 N Boulevard, 33607 |
| `macfarlane-park` | 8 | - | 8 | "8 courts" | 1700 N MacDill Ave, 33607 |
| `madison-street-park` | 1 | - | 1 | "1 court" | 1224 E Madison St, 33602 |
| `new-tampa-sports-pavilion` | 4 | - | 4 | "4 courts" | 17302 Commerce Park Blvd, 33647 |
| `skyview-park` | 2 | - | 2 | "2 courts" | 6203 S Martindale Ave, 33611 |
| `vila-brothers-park` | 2 | - | 2 | "2 courts" | 700 N Armenia Ave, 33609 |
| `david-m-barksdale-center` | 1 | 1 | - | "1 court" | 1801 N Lincoln Ave, 33607 |
| `cordelia-b-hunt-center` | 1 | 1 | - | "1 court" | 4602 N Himes Ave, 33614 |
| `loretta-ingraham-center` | 2 | 2 | - | "2 courts" | 1611 N Hubert Ave, 33607 |
| `port-tampa-community-center` | 1 | 1 | - | "1 court" | 4702 W McCoy St, 33616 |

## The direction is part of the address

Asked for `4700 S Clark Ave`, the Census geocoder answered `4700 N CLARK AVE` in a different postcode.
Asked for `4602 N Himes Ave` it answered `4602 S HIMES AVE`, again in a different postcode. It also
dropped a direction outright: `1224 E Madison St` came back `1224 MADISON ST`. The street-type check that
shipped with Cape Coral could see none of this, so `scripts/verify/geocode.mjs` now treats a changed or
dropped direction the same way: ask OpenStreetMap for the address as written, and let the operator's
address win if OSM finds it at house-number level. Madison Street Park and Cordelia B Hunt were rescued
that way; Foster Park was not, and is refused. Re-running every city through the new check moved one
published venue - Bellevue's Crossroads Community Center, from SE 10th Street to the NE 10th Street the
City prints, about two kilometres north.

## Refused

**Rowlett Park** - "2401 E Yukon St., 33604 / 8 courts"

1. Neither address resolver finds "2401 E Yukon St": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.
2. Eight courts, tied with Macfarlane Park for the largest count in Tampa. The most expensive refusal in the city, and it fails on its address alone.

**Foster Park** - "4700 S Clark Ave., 33611 / 2 courts"

1. The City writes "4700 S Clark Ave., 33611". The Census address geocoder answers "4700 N CLARK AVE, 33614" - the compass direction flipped and a different postcode - and OpenStreetMap has no record of the address as the City writes it. This is the defect the resolver check was extended for during this run, and here the second resolver cannot rescue it.
2. The City's own postcode, 33611, contradicts the only answer available. An address that resolves only by changing which side of the city it is on has not resolved.

**Dr Martin Luther King Jr. Complex** - "220 N Oregon Ave., 33607 / 2 courts / Play resumes after Summer Camp ends / Schedule TBD"

1. The City's pickleball page gives "220 N Oregon Ave., 33607" and its recreation-centres page gives "2200 N Oregon Ave, 33607" for the same complex: two City records, two house numbers.
2. The count-bearing address resolves - to postcode 33606, which contradicts the City's own 33607 on both pages. The City's postcode sides with 2200, the address that carries no count. Cordelia B Hunt and Loretta Ingraham publish under the same two-record shape because their count-bearing addresses resolve as written in the postcode the City prints; this one does not.

## Two City records, two house numbers - and the rule that split them

Cordelia B Hunt Center (4602 vs 4810 N Himes Ave) and Loretta Ingraham Center (1611 vs 1615 N Hubert Ave)
publish; the Dr Martin Luther King Jr. Complex (220 vs 2200 N Oregon Ave) does not. The count-bearing
address must resolve as written in the postcode the City prints. The first two do. The third resolves
in 33606, and the City prints 33607 on both of its pages - so the City's own postcode refutes the
address that carries the count.

## Postcodes the City and the resolver disagree on

- Julian B Lane Riverfront Park: City 33606, OpenStreetMap 33607. No second City record. Resolver publishes.
- David M Barksdale Center: pickleball page 33606, recreation-centres page 33607, Census 33607.

## What Tampa does not say

- **lighting**, at any venue. Null everywhere.
- **price.** "free beginner lessons" at Barksdale prices a lesson, not a court.
- **surface.**
- **hours**, at ten of the twelve outdoor venues.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `cuscaden-park` | street_address | "2900 North 15th St" | "2900 N 15th St" | overridden |
| `julian-b-lane-park` | name | "Julian B Lane Park" | "Julian B Lane Riverfront Park" | overridden |
| `julian-b-lane-park` | total_courts | 2 | 6 | overridden |
| `julian-b-lane-park` | street_address | "1001 North Blvd" | "1001 N Boulevard" | overridden |
| `julian-b-lane-park` | postal_code | "33606" | "33607" | overridden |
| `julian-b-lane-park` | outdoor_courts | 2 | 6 | overridden |
| `port-tampa-community-center` | hours_of_operation | "Tuesdays 6:00-9:00 Thursdays 6:00-9:00" | "Pickleball sessions: Tuesday 6-9 pm and Thursday 6-9 pm. The City's card states \"Court closed for repairs through June 1\"." | overridden |
