# Wichita verification - a page every script is refused, read in a browser

Run 2026-09-07. 10 venues published, 53 courts (31 outdoor, 22 indoor). 1 venue refused.

Wichita is the first city in Kansas on this site and the first in Sedgwick County. Its source is a text
snapshot read in a browser, because wichita.gov answers 403 to every scripted fetch; see
`data/sources/wichita/README.md`. Every quoted line is asserted against that file.

| venue | courts | in | out | tab | what the City writes |
| --- | ---: | ---: | ---: | --- | --- |
| `edgemoor-park` | 15 | 3 | 12 | parks | "Edgemoor Park / 5815 E 9th / 12 courts" and "Edgemoor / 5815 E 9th Street / 316-688-9392 / 3 courts" |
| `buffalo-park` | 2 | - | 2 | parks | "Buffalo Park / 10201 Hardtner / 2 courts" |
| `osage-park` | 2 | - | 2 | parks | "Osage Park / 2121 W 31st / 2 courts" |
| `seneca-park` | 6 | - | 6 | parks | "Seneca Park / 202 S Seneca / 6 courts" |
| `boston-recreation-center` | 3 | 3 | - | centres | "Boston / 6655 E Zimmerly / 316-688-9301 / 3 courts" |
| `evergreen-recreation-center` | 2 | 2 | - | centres | "Evergreen / 2700 N Woodland / 316-909-8036 / 2 courts" |
| `linwood-recreation-center` | 3 | 3 | - | centres | "Linwood / 1901 S Kansas / 316-337-9191 / 3 courts" |
| `brewer-recreation-center` | 2 | 2 | - | centres | "Brewer (Closed for Improvements) / 1329 E 16th Street / 316-337-9222 / 2 courts" |
| `orchard-park-recreation-center` | 3 | 3 | - | centres | "Orchard / 4808 W 9th Street / 316-337-9244 / 3 courts" |
| `riverside-tennis-center` | 15 | 6 | 9 | riverside | "551 Nims / Phone: 316-337-9257 / 9 outdoors with court lights for night play / 6 indoors (these are double-striped over the 3 tennis courts)" |

## Edgemoor is one venue

The Parks tab lists twelve outdoor courts at 5815 E 9th and the Recreation Centers tab three indoor at
5815 E 9th Street. One address, one venue, fifteen courts, after Bellevue's Hidden Valley and Tampa's
Forest Hills.

## Brewer publishes as closed

"Brewer (Closed for Improvements)" is how the City prints it. The venue publishes with that notice, as
Thompson Peak Park did during its resurfacing, and the run fails the day the note is removed.

## Surface is not published

"Outdoor courts with hard / concrete surfaces" and "Temporary indoor courts with wood and tile surfaces"
are each one sentence over several venues with two words joined by a slash or an "and". Which venue has
which is not stated, so no venue carries a surface.

## Refused

**Sherwood Glen** - "Sherwood Glen / 1 striped without net (portable net required)"

1. The City publishes no address for it. It is the last entry on the Parks tab, "Sherwood Glen / 1 striped without net (portable net required)", with no street line where every other park has one. Import Gate I1 requires a street address that resolves, and this project has never taken one from outside the operator.
2. The count is real - one striped court, no net - and the venue fails on the one fact it is missing.

## What Wichita does not say

- **which venues are free.** "Some can be reserved for a small fee while others are first-come-first-serve"
  names no venue, so `fee_type` is null everywhere.
- **hours.** Drop-in hours are in two PDFs the City links and this site has not read.
- **lighting** anywhere but Riverside.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `edgemoor-park` | total_courts | 12 | 15 | overridden |
| `edgemoor-park` | street_address | "5815 East 9th" | "5815 E 9th" | overridden |
| `edgemoor-park` | indoor_courts | 0 | 3 | overridden |
| `edgemoor-park` | phone | "(316) 268-4361" | "316-688-9392" | overridden |
| `buffalo-park` | street_address | "318-500 N Maize Rd" | "10201 Hardtner" | overridden |
| `osage-park` | street_address | "2121 W. 31st Street South" | "2121 W 31st" | overridden |
| `seneca-park` | street_address | "202 S. Seneca" | "202 S Seneca" | overridden |
| `seneca-park` | postal_code | "67215" | "67213" | overridden |
| `boston-recreation-center` | street_address | "6655 E. Zimmerly" | "6655 E Zimmerly" | overridden |
| `evergreen-recreation-center` | street_address | "2700 N Woodland St." | "2700 N Woodland" | overridden |
| `linwood-recreation-center` | street_address | "1901 S. Kansas" | "1901 S Kansas" | overridden |
| `orchard-park-recreation-center` | name | "Orchard Park Recreation Center" | "Orchard Recreation Center" | overridden |
| `orchard-park-recreation-center` | street_address | "4804 W 9th St N" | "4808 W 9th Street" | overridden |
