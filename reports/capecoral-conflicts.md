# Cape Coral verification - a count, a lighting answer and a price on one page

Run 2026-09-04. 5 venues published, 20 courts. 3 venues refused.

Cape Coral is the first city in Florida on this site and the first in Lee County. It is also only the
second city, after Scottsdale, whose operator states a court count, a lighting answer and a price in
one document.

| venue | courts | lit | dedicated | what the City writes | address |
| --- | ---: | --- | --- | --- | --- |
| `camelot-park` | 4 | yes | converted tennis | "Two (2) tennis courts -OR- Four (4) pickleball courts with lights - open until 9:00 p.m. daily" | 1718 SW 52 Terrace |
| `giuffrida-park` | 2 | **no (stated)** | yes | "Two (2) dedicated pickleball courts  - no lights" | 1044 NE 4 Street |
| `jim-jeffers-park` | 6 | yes | converted tennis | "Two (2) tennis courts -OR- Four (4) pickleball courts with lights - open until 9:00 p.m. daily; and two (2) warm-up pickleball courts" | 2817 SW 3 Lane |
| `joe-stonis-park` | 4 | yes | converted tennis | "Two (2) tennis courts -OR- Four (4) pickleball courts with lights - open until 9:00 p.m. daily" | 3444 Ceitus Parkway |
| `sands-park` | 4 | not stated | yes | "Four (4) dedicated pickleball courts" | 2718 SW 43rd Terrace |

## A stated negative on lighting

Giuffrida Park reads "Two (2) dedicated pickleball courts  - no lights". That is the second stated
lighting negative in this directory, after Vancouver's Oakbrook Community Park, and it is what gives
the rest of Cape Coral's lighting data its value: an operator willing to write "no lights" when it
means it turns every unmarked venue into a genuine silence. Sands Park is that silence, and its
lighting is recorded as unverified rather than read as a no.

## The street type is part of the address

Asked for `1718 SW 52 Terrace`, the Census geocoder answered `1718 SW 52ND ST` - with the right
county, the right place and the right postcode. In Cape Coral those are two different streets about
seventy-seven metres apart, both carrying a house number 1718. Nothing downstream could have caught
it, and three venues here would have published coordinates for the wrong street.

An audit of all 85 addresses resolved across this project found four such mismatches - three here and
one in Austin. Austin is why the fix is not "reject the mismatch": the City writes "North Lake Creek
Blvd", the Census answers "N LAKE CREEK PKWY", and OpenStreetMap has no Lake Creek Blvd in Austin at
all. One street, one name, correctly normalised. So `scripts/verify/geocode.mjs` now treats a
differing street type as a reason to stop trusting the first resolver silently: it asks OpenStreetMap
for the address as the operator wrote it, and the operator's street type wins if OSM can find it.
Austin's resolution is unchanged; three Cape Coral venues moved to the correct street.

## Refused

**Gator Trails Park** - "Two (2) dedicated pickleball courts with lights" - 3628 Garden Blvd

1. Neither address resolver finds "3628 Garden Blvd", the address the City publishes on the park's own page: the US Census address file returns no match, and OpenStreetMap returns nothing at house-number level for it either. Import Gate I1 requires a street address that resolves.
2. This is the expensive refusal of the run. The City states both a count and a lighting answer for it - "Two (2) dedicated pickleball courts with lights" - which is more than it states for Sands Park, which does publish. The venue fails on its address alone.

**The Courts** - "32 dedicated pickleball courts and 12 tennis courts" - no address published

1. The City publishes no address for it. It appears in the list on the Park Sports/Games page and has no page of its own among the City's parks and facilities, so there is no municipal record of where it is. Import Gate I1 requires a street address, and this project has never taken one from a source outside the operator.
2. Its thirty-two dedicated courts are the largest count this project has read anywhere, which is a reason for more care rather than less.
3. It also sits underneath the City's sentence that these courts are "available for public use at no charge", while being a paid facility on its own operator's account. Publishing it would mean inheriting a price the City's own page contradicts. The contradiction is recorded here rather than resolved.

**Four Freedoms Park** - "the portable indoor court" - 4818 Tarpon Court

1. The City states no court count. It offers "indoor pickleball in air-conditioned comfort on the portable indoor court at Four Freedoms Park", which names a facility rather than counting courts, and Page Gate 1 requires a stated count.
2. Everything else about it is unusually well published: the address, 4818 Tarpon Court, the price of $5 per person for two hours, a maximum of four players, and that paddles and balls can be borrowed. It is the only indoor pickleball the City names, and it does not publish for want of a number.

## What Cape Coral does not say

- **indoor or outdoor**, about any published venue. The breakdowns stay null, following Mesa and
  Kirkland. The one venue the City does call indoor, Four Freedoms Park, states no count.
- **surface.** The only surface named in the city belongs to a tennis court: Burton Memorial Park's
  "One (1) asphalt tennis court - no lights".
- **lighting at Sands Park**, which is the one published venue the City neither marks lit nor marks
  unlit.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `camelot-park` | name | "Camelot Park (Cape Coral)" | "Camelot Park" | overridden |
| `camelot-park` | total_courts | 2 | 4 | overridden |
| `camelot-park` | street_address | "1718 SW 52nd Terrace" | "1718 SW 52 Terrace" | overridden |
| `camelot-park` | hours_of_operation | "Contact facility" | "Open sunrise to 9:00 p.m. daily." | overridden |
| `giuffrida-park` | name | "Giuffrida Park (Cape Coral)" | "Giuffrida Park" | overridden |
| `giuffrida-park` | street_address | "1044 NE 4th St" | "1044 NE 4 Street" | overridden |
| `giuffrida-park` | hours_of_operation | "Contact facility" | "Open sunrise to sunset." | overridden |
| `jim-jeffers-park` | name | "Jim Jeffers Park (Cape Coral)" | "Jim Jeffers Park" | overridden |
| `jim-jeffers-park` | total_courts | 2 | 6 | overridden |
| `jim-jeffers-park` | street_address | "2817 SW 3rd Ln" | "2817 SW 3 Lane" | overridden |
| `jim-jeffers-park` | hours_of_operation | "Contact facility" | "Open sunrise to 9:00 p.m. daily." | overridden |
| `joe-stonis-park` | name | "Joe Stonis Park (Cape Coral)" | "Joe Stonis Park" | overridden |
| `joe-stonis-park` | street_address | "3444 Ceitus Pkwy" | "3444 Ceitus Parkway" | overridden |
| `joe-stonis-park` | hours_of_operation | "Contact facility" | "Open sunrise to 9:00 p.m. daily." | overridden |
