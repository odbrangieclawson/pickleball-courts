# Louisville verification - a list that counts, park pages that locate, and a city with three names

Run 2026-09-07. 16 venues published, 67 courts, all outdoor on the City's word. 1 venue refused.

Louisville is the first city in Kentucky on this site and the first in Jefferson County.

| venue | list line | courts | address | resolver place |
| --- | --- | ---: | --- | --- |
| `charlie-vettiner-park` | "Vettiner Park - 14" | 14 | 5550 Charlie Vettiner Park Rd. | Louisville (osm) |
| `iroquois-park` | "Iroquois - 4" | 4 | 5216 New Cut Rd. | Louisville city (census) |
| `mcneely-lake-park` | "McNeely Lake - 2" | 2 | *10500 Cedar Creek Rd. | Louisville/Jefferson County metro government (balance) (census) |
| `sun-valley-park` | "Sun Valley - 1" | 1 | 6616 Ashby Ln. | Louisville/Jefferson County metro government (balance) (census) |
| `crescent-hill-park` | "Crescent HIll - 4" | 4 | 201 Reservoir Avenue | Louisville city (census) |
| `des-pres-park` | "Des Pres - 3" | 3 | 4709 Lowe Rd. | Louisville/Jefferson County metro government (balance) (census) |
| `fern-creek-park` | "Fern Creek - 6" | 6 | 8703 Ferndale Rd. | Louisville/Jefferson County metro government (balance) (census) |
| `george-rogers-clark-park` | "George Rogers Clark - 2" | 2 | 1024 Thruston Ave. | Louisville city (census) |
| `hays-kennedy-park` | "Hays Kennedy - 6" | 6 | 7003 Beachland Beach Rd. | Louisville (osm) |
| `petersburg-park` | "Petersburg - 4" | 4 | 5008 E Indian Trail | Louisville/Jefferson County metro government (balance) (census) |
| `riverview-park` | "Riverview - 4" | 4 | 8202 Greenwood Rd. | Louisville/Jefferson County metro government (balance) (census) |
| `wyandotte-park` | "Wyandotte - 6" | 6 | 1104 Beecher St. | Louisville city (census) |
| `nelson-hornbeck-park` | "Nelson Hornbeck - 6" | 6 | 709 Fairdale Rd. | Louisville (osm) |
| `riverside-gardens-park` | "Riverside Gardens - 1" | 1 | 3899 Lees Ln. | Louisville/Jefferson County metro government (balance) (census) |
| `tyler-park` | "Tyler - 2" | 2 | 1501 Castlewood Ave. | Louisville city (census) |
| `new-walnut-street-park` | "New Walnut Street - 2" | 2 | 1327 W Muhammad Ali Blvd. | Louisville city (census) |

## Three names for one city

The Census address geocoder returns "Louisville city" for addresses inside the pre-merger city and
"Louisville/Jefferson County metro government (balance)" for the rest of the consolidated city; OpenStreetMap
says "Louisville". All three are accepted. A different incorporated city is not:

## Refused

**Hounz Lane Park** - "Hounz Lane - 3" - 2300 Hounz Ln.

1. The Census address geocoder places "2300 Hounz Ln." in the incorporated place "Lyndon city", one of the small cities inside Jefferson County that stayed separately incorporated when Louisville and the county merged. It is not inside the City of Louisville.
2. Louisville Metro runs the park and lists it with three courts, and that does not change where it is. This is the Scottsdale Community College ground: a city page must contain venues in that city, and who programmes them is a separate question. The list line and the address are asserted so the refusal is re-examined if either changes.

## Two venues rest on the list alone

Fern Creek Park and Riverview Park have park pages that do not mention pickleball. The list states a number
for each, the number publishes (the Lincoln rule), and the run asserts the park page's silence so the
caveat cannot outlive its truth.

## What Louisville does not say

- **lighting, price, surface, nets** - nothing, at any venue.
- **indoor** - the set is "outdoor" in the City's word; indoor stays null rather than being written as 0.
- **postcodes** - the City prints none; the resolver's publish.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `sun-valley-park` | hours_of_operation | "Contact facility" | "Park hours 6 a.m. to 11 p.m." | overridden |
| `des-pres-park` | hours_of_operation | "Monday: 6 AM to 11 PM; Tuesday: 6 AM to 11 PM; Wednesday: 6 AM to 11 PM; Thursday: 6 AM to 11 PM; Friday: 6 AM to 11 PM; Saturday: 6 AM to 11 PM; Sunday: 6 AM to 11 PM" | "Park hours 6 a.m. to 11 p.m." | overridden |
