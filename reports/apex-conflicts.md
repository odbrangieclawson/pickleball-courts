# Apex verification - what the town states

Run 2026-09-03. 5 venues published, 1 excluded.

The Town of Apex publishes a court table AND repeats most counts on each
venue's own page, so most of this set is corroborated twice by the same
publisher. Every quoted sentence is asserted present before the number in
it is published.

| venue | courts | in/out | lights | town's table row |
| --- | --- | --- | --- | --- |
| `pleasant-park` | 6 | outdoor | no | "Pleasant Park | Outdoor | No | 6 (open sunrise to 30 minutes after sunset)" |
| `kelly-road-park` | 4 | outdoor | yes | "Kelly Road Park | Outdoor | Yes | 4 (also used for Junior Tennis)" |
| `seymour-athletic-fields` | 4 | outdoor | yes | "Seymour Athletic Fields at Apex Nature Park | Outdoor | Yes | 4 (also used for Junior Tennis)" |
| `apex-community-park` | 3 | outdoor | yes | "Apex Community Park | Outdoor | Yes | 3" |
| `john-m-brown-community-center` | 4 | indoor | yes | "John M. Brown Community Center | Indoor | Yes | 4 (available only for ages 55+, during designated open gym hours)" |

## Stated, but not published

| venue | courts | why not |
| --- | --- | --- |
| Apex Elementary School | 4 | Not a town facility, no published address, and the import disagrees (3 v 4). |

## The county needed four sources

The town of Apex spans Wake AND Chatham counties (TIGERweb intersect of the
Apex town polygon against Census county boundaries), and both Apex
postcodes straddle the same line, so neither the town name nor the postcode
settles it. Each address was located in Wake County GIS Address Points and
each resulting point put through the Census geocoder. All five: Wake.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `kelly-road-park-apex-nc` | street_address | "1609 Kelly Rd" | "1609 Kelly Road" | overridden |
| `kelly-road-park-apex-nc` | hours_of_operation | "Contact facility" | "6:30 am - 10 pm (year round)" | overridden |
| `apex-seymour-athletic-fields-apex-nc` | name | "Apex Seymour Athletic fields" | "Seymour Athletic Fields" | overridden |
| `apex-seymour-athletic-fields-apex-nc` | street_address | "2600 Evans Rd" | "2500 Evans Road" | overridden |
| `apex-seymour-athletic-fields-apex-nc` | venue_type | "fitness_center" | "public_park" | overridden |
| `apex-seymour-athletic-fields-apex-nc` | hours_of_operation | "Contact facility" | "6:30 am - 10:00 pm" | overridden |
| `apex-community-center` | name | "Apex Community Center" | "John M. Brown Community Center" | overridden |
| `apex-community-center` | street_address | "53 Hunter Street, Apex, NC 27502" | "53 Hunter Street" | overridden |
