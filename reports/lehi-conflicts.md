# Lehi verification - one page, every park, one counted sentence each

Run 2026-09-07. 6 venues published, 16 courts. 7 parks refused or set aside.

Lehi is the second city in Utah on this site and the first in Utah County. Every count and address comes from
the City's parks page, "Welcome to Lehi City Parks", where each park has an "Address:" line and an amenity sentence.

| venue | courts | section | what the City writes |
| --- | ---: | --- | --- |
| `allred-park` | 2 | RESERVABLE PAVILIONS | "Playground, restrooms, 2 pickleball courts, 2 half basketball courts, soccer fields, and a fire pit." |
| `holbrook-farms-park` | 6 | RESERVABLE PAVILIONS | "Restrooms, playground with swings, 6 pickleball courts, water fountain, walking path(w/benches), small pavilion (non-reservable w/2 tables)" |
| `olympic-park` | 3 | RESERVABLE PAVILIONS | "Restroom, playground with swings, 3 pickleball courts, fire pit, 3 soccer fields, designated parking, walking path that connects to the Jordan River Trail." |
| `centennial-park` | 1 | NON-RESERVABLE PARKS | "1 Large pavilion with 11 tables, 1 trash can, electrical outlets (120V, 15amp max), pavilion lighting, 2 large BBQ grills, 1 pickleball court, walking path with benches, 2 half basketball courts, playground, and designated parking." |
| `stagecoach-large-park` | 2 | NON-RESERVABLE PARKS | "1 Small pavilion with 6 tables, a large BBQ grill and a trash can, 2 pickleball courts, 1 full basketball court, playground with swings, 2 soccer goals and benches." |
| `watercress-park` | 2 | NON-RESERVABLE PARKS | "1 Large pavilion with 11 tables with 1 trash can, 8 Horseshoe pits, 2 pickleball courts, 1 tennis court, and a large open grass area." |

## Eleven counted, six resolved

The City counts courts at eleven parks. Five write addresses that neither resolver finds as written, and are
refused on the address (the Foster Park rule). Four of the six that publish resolve through OpenStreetMap at
house-number level: the Census file has no record of Holbrook Farms or Stagecoach Large, drops the "N." from
Allred Park Rd., and answers "1500 N" for Watercress's 1500 South. In each case OpenStreetMap finds the address
as the City writes it, and that is the one published.

## Refused

**Shadow Ridge Park** - "Restrooms, playground, 4 pickleball courts, bike rack, and a water fountain." (3050 W. Traverse Mountain Blvd, Lehi UT 84043)

1. Four courts, stated. The address the City writes, "3050 W. Traverse Mountain Blvd", is unresolved by the Census address file and by OpenStreetMap. The count-bearing address must resolve as written (the Foster Park rule), and this one does not.

**Salix Park** - "Restroom, 2 playgrounds (east and west), 4 pickleball courts, walking path with benches, parking, and trash cans." (3109 W. Allred Dr., Lehi UT 84043)

1. Four courts, stated. "3109 W. Allred Dr." is unresolved by both resolvers.

**South Creek Park** - "1 Small pavilion with 4 tables and a trash can, 1 half basketball court, 1 pickleball court, lighting, and open space." (1987 West 1450 South, Lehi UT 84043)

1. One court, stated as a digit. "1987 West 1450 South" is unresolved by both resolvers.
2. The sentence also says "lighting", which is a park amenity between a court and "open space" and does not say what is lit; had the address resolved, that word would not have published as a lit court.

**Spring Creek Park** - "1 Small pavilion with 4 tables and a trash can, playground, 3 pickleball courts, 2 half basketball courts, benches, walking path with fitness equipment, and parking." (2108 S Bullrush Pkwy, Lehi UT 84043)

1. Three courts, stated. "2108 S Bullrush Pkwy" is unresolved by both resolvers. The imported dataset carries this park as spring-creek-park-lehi-lehi-ut at "2100 S Bullrush Pkwy" with three courts; that row stays pending, because the City's own address is the one that has to resolve, and the import's house number is not the City's.

**Northridge Park** - "1 Small pavilion with 4 tables and a trash can, playground, 1 half basketball court, bike rack, benches, and a pickleball court." (2333 W. Northridge Dr, Lehi UT 84043)

1. "a pickleball court" is an article, not a number. Chandler's ruling: "This single pickleball court" is a count of one; "the pickleball court" is a label. "a pickleball court" is a label.
2. "2333 W. Northridge Dr" is unresolved by both resolvers in any case.

**Gateway Park** - "Walking path, playground, pickleball, 2 basketball half courts, restrooms, water fountain, park lights and hose bib." (1875 North 1400 West, Lehi UT 84043)

1. "pickleball" with no number. A flag is not a count.

**Eagle Summit Park** - "Restrooms, playgrounds, multiple picnic tables with BBQ grates, a walking path, a baseball backstop, basketball courts, bridges, a swing set, a tennis court, and a water fountain." (5097 N. Ravencrest Ln., Lehi, UT 84043)

1. The City's sentence for this park names a tennis court and no pickleball at all. It is listed here because a scout named it; the assertion below fails the build if the City ever adds pickleball to the sentence, so the park is re-read rather than missed.

## What Lehi does not say

- **price.** "All other amenities are open to the public." is not a price, and nothing says free. Null everywhere.
- **lighting.** "pavilion lighting" at Centennial lights the pavilion; "lighting" at South Creek and "park lights" at Gateway are at refused parks and name no court. Null.
- **surface.**
- **indoor or outdoor.** Amenity lists do not say, and the word "park" is not a statement. Null.
- **hours.** None published for courts.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `watercress-park` | name | "Watercress Park (Lehi)" | "Watercress Park" | overridden |
| `watercress-park` | street_address | "1500 S Center St" | "151 East 1500 South" | overridden |
| `watercress-park` | pricing_notes | "Public - Dedicated" | "The City states no price for the courts. It lists this park under \"NON-RESERVABLE PARKS\": the courts cannot be booked, and nothing on the page prices them or says they are free." | overridden |
