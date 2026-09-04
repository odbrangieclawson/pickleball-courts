# Scottsdale verification - the first operator that says how to share a court

Run 2026-09-04. 3 venues published, 21 courts, all outdoor, all lit, all free.
2 of the City's 5 listed locations refused.

Every other city in this directory answers "how many courts" and stops. Scottsdale publishes the
rule for sharing one, on every park page:

> Court use by individuals and groups is limited to standard game format; first side scoring 11
> points or leading by at least 2 points wins. This comes with a 30 minute time limit, at which
> time players should rotate off the court with any waiting players.

and a peak time, which no operator had published before:

> Mornings are typically the busiest time for pickleball play at Cholla.
> Mornings are typically the busiest time for pickleball play at Horizon.
> Mornings are typically the busiest time for pickleball play at Thompson Peak.

| venue | courts | lit | cost | hours |
| --- | ---: | --- | --- | --- |
| `cholla-park` | 8 | yes | free | sunrise - 10:30 p.m. |
| `horizon-park` | 10 | yes | free | sunrise - 10:30 p.m. |
| `thompson-peak-park` | 3 | yes | free | sunrise - 10:30 p.m. |

## One venue is closed right now

Thompson Peak Park is published with its courts shut. The City states they are closed from
17 August to 11 September 2026 for resurfacing and expected to reopen on the 12th, weather
permitting; this run was made on 4 September. The closure sentence is asserted, so when the City
takes it down the build fails - a directory carrying a stale closure is worse than one carrying none.

## Refused

**Ashler Hills Park** - "Eight outdoor lighted pickleball courts"

1. The Census address geocoder returns no match for "32220 N. 74th Way", the address the City prints on its pickleball page, nor for three spelling variants of it. Import Gate I1 requires a street address that resolves.
2. Separately, the park's own page prints its postcode as "Scottsdale, AZ 32220" — the street number in the postcode's place. That is a defect in the City's record rather than a reason for exclusion, and Thompson Peak Park's page carries the same malformation.

**Scottsdale Community College** - "Six outdoor lighted pickleball courts"

1. The Census geocoder places 9000 E Chaparral Rd in NO incorporated place: it is not inside Scottsdale city limits. Every venue in this directory must be inside the city it is published under, and a City-run programme at a site outside the city does not move the site.
2. The courts belong to the college; Scottsdale Parks and Recreation runs a free public drop-in programme on them in partnership. That makes the operator relationship worth recording and does not change where the courts are.

Three venues is exactly the threshold this site requires. A city at the minimum is still a city.

## A postcode defect in the City's own records

Ashler Hills Park's page prints "Scottsdale, AZ 32220" and Thompson Peak Park's prints
"Scottsdale, AZ 20199" - in both cases the street number where the postcode belongs. The
pickleball page has the correct postcodes (85266 and 85255), and the published postcodes here come
from the Census geocoder as they do everywhere on this site. Recorded because it is the City's
record and somebody should know.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `cholla-park` | street_address | "11320 E Via Linda , Via Linda & Frank Lloyd Wright" | "11320 E. Via Linda" | overridden |
| `cholla-park` | hours_of_operation | "Sunrise to 10:30pm, 7-days a week" | "Open sunrise to 10:30 p.m. daily." | overridden |
| `horizon-park` | outdoor_courts | 8 | 10 | overridden |
| `horizon-park` | street_address | "15444 N. 100th St" | "15444 N. 100th St." | overridden |
| `horizon-park` | hours_of_operation | "Sunrise to 10:30 pm, 7 days a week" | "Open sunrise to 10:30 p.m. daily." | overridden |
| `thompson-peak-park` | total_courts | 6 | 3 | overridden |
| `thompson-peak-park` | outdoor_courts | 6 | 3 | overridden |
| `thompson-peak-park` | street_address | "20199 N 78th Place , Converted 2 Basketball Courts" | "20199 N. 78th Pl." | overridden |
| `thompson-peak-park` | hours_of_operation | "Sunrise to 10:30pm, 7-days a week" | "Open sunrise to 10:30 p.m. daily." | overridden |
| `thompson-peak-park` | court_availability | "Can be busy during peak hours" | "CLOSED FOR RESURFACING at the time of checking: the City states that all pickleball courts here are shut from 17 August to 11 September 2026 and are expected to reopen on Saturday 12 September, weather permitting. When open: three lighted courts with three portable nets, drop-in and not reservable, first come first served, standard game to 11 with a 30-minute limit and rotation for waiting players. Mornings are typically the busiest time." | overridden |
