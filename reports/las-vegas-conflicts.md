# Las Vegas verification - two City records, three venues stated twice and two stated once

Run 2026-09-07. 5 venues published, 19 courts. 3 venues refused.

Las Vegas is the first city in Nevada on this site and the first in Clark County.

| venue | courts | park page | pickleball post | address |
| --- | ---: | --- | --- | --- |
| `aloha-shores-park` | 4 | "Pickleball courts (4)" | "Four at Aloha Shores Park" | 7550 Sauer St, 89128 |
| `centennial-hills-park` | 2 | "Pickleball courts (2)" | "Two at Centennial Hills Park" | 7101 N. Buffalo Drive, 89131 |
| `durango-hills-park` | 7 | "Pickleball courts (7)" | "Seven at Durango Hills Park" | 3521 N. Durango Dr, 89129 |
| `lorenzi-park` | 4 | **no mention of pickleball** | "Four at Lorenzi Park" | 3333 W. Washington Ave., 89107 |
| `patriot-park` | 2 | **no mention of pickleball** | "Two at Patriot Park" | 4050 Thom Blvd., 89130 |

## Two venues rest on one City record

The City's pickleball post of 11 March 2026 counts "Four at Lorenzi Park" and "Two at Patriot Park". Neither park's
own page mentions pickleball; Lorenzi's lists tennis courts "managed by No Quit Tennis Academy", basketball, a band
shell and a fishing pond, and Patriot's says it "features a basketball court, tennis courts, playground and picnic
areas". This is the shape Lincoln's Ballard and Densmore took, and the rule set there decides it: the record that
states a number publishes, the venue page says it rests on one record, and the run asserts that the park page still
says nothing - so the caveat cannot outlive its truth.

## Refused

**Police Memorial Park** - "Pickleball courts (8)" / "Eight at Police Memorial Park" - 3250 Metro Academy Way, 89129

1. Neither address resolver finds "3250 Metro Academy Way": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.
2. Eight courts, the largest count in the city, stated twice - "Pickleball courts (8)" on the park page and "Eight at Police Memorial Park" on the City's pickleball post - with hours, restrooms and two tennis courts beside them. The most expensive refusal in Las Vegas, and it fails on its address alone.

**Bill Briare Family Park** - "Pickleball Courts (4)" / "Four at Bill Briare Park" - 650 N. Tenaya Way, 89128

1. Neither address resolver finds "650 N. Tenaya Way", the address the City prints in the park page header. Import Gate I1.
2. Four courts stated twice, "Pickleball Courts (4)" and "Four at Bill Briare Park", on a ten-acre park the City names for a former mayor and where it runs the city's first National Fitness Campaign Fitness Court. It fails on its address alone.

**Justice Myron Leavitt & Jaycee Community Park** - "Four at Justice Myron Leavitt & Jaycee Community Park" - no address published

1. The City's pickleball post states "Four at Justice Myron Leavitt & Jaycee Community Park", and the park's own page carries no street address a reader can find and no pickleball count. With no address there is nothing for Import Gate I1 to resolve, and this project has never taken an address from outside the operator.
2. The blog line is asserted, so if the City adds an address to the park page the run must be revisited rather than continuing to omit four courts.

## What Las Vegas does not say

- **indoor or outdoor**, about any venue. The breakdowns stay null.
- **lighting**, anywhere. Null.
- **price.** "Drop in for a pop-up game" is a play format, not a price. Null.
- **surface.**

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `aloha-shores-park` | hours_of_operation | "daily" | "Park hours 7 a.m. to 11 p.m." | overridden |
| `centennial-hills-park` | street_address | "7101 N Buffalo" | "7101 N Buffalo Drive" | overridden |
| `centennial-hills-park` | hours_of_operation | "Daily" | "Park hours 7 a.m. to 11 p.m." | overridden |
