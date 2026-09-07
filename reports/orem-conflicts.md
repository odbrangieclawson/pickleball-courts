# Orem verification - three park pages, three counts, exactly the threshold

Run 2026-09-07. 3 venues published, 22 courts. 1 venue refused.

Orem is the second city in Utah on this site, after St. George, and the first in Utah County. Every count
and address comes from the City's own park page for that park, and each count is stated twice on its page.
Three venues is the threshold, not a margin over it; the run throws before writing anything if one fails.

| venue | courts | lit | address | what the City writes |
| --- | ---: | --- | --- | --- |
| `hillcrest-park` | 12 | not stated | 650 E 1400 S (84097) | "12 Pickleball Courts (6 Courts reservable, 6 Courts open for public use)" |
| `sharon-park` | 6 | not stated | 600 N 300 E (84057) | "6 Pickleball Courts (we currently ONLY reserve pickleball courts for the city's tournaments, not for any other private use)." |
| `bonneville-park` | 4 | yes ("Lighted") | 1450 N 800 W (84057) | "Four Lighted Pickleball Courts" |

## Hours that belong to the splash pad

Hillcrest's page prints "Hours of Operations: Monday-Saturday from 10:00am-8:00pm" under the heading "Splash Pad Hours", between that heading and
"Concession will start June 10th from 10:00am-8:00pm", and the next paragraph says "The Splash Pad is open seasonally from Memorial Day at 10:00am to Labor Day at 8pm. After Labor Day, it is closed until the following Memorial Day." Nothing ties those hours to the courts,
so hours stay null at Hillcrest, and the order of those lines is asserted so that a page that moves the hours
under the pickleball block stops the build.

## What is not a price

No Orem park page states a price or the word "free". The reservation rules are about who may book a court:
"6 Pickleball courts can be reserved for private use" and the paddle rotation at Hillcrest, "(we currently ONLY reserve pickleball courts for
the city's tournaments, not for any other private use)" at Sharon, and nothing at Bonneville. They publish as
pricing notes with no price, and fee_type is null at all three.

## Refused

**Cascade Park** - "Pickleball/Tennis Courts"

1. The City's park page carries "Pickleball/Tennis Courts" in its amenity list and no number. A label is not a count, and a venue needs a stated count to exist here.
2. The page could not be re-fetched for this run - orem.gov/cascade-park/ answers 404 - so no snapshot of it is asserted; the refusal rests on the count it lacks, and the parks guide, which is asserted, lists the park by name.

## Two Sharon Park rows in the import

The import holds "sharon-park" at "500 N 300 E" with six courts, and "sharon-park-orem-orem-ut" at "285 500 N";
the identity pass quarantines both for claiming one slug. The City publishes one Sharon Park at 600 N 300 E.
This run matches the first row and replaces its address with the City's; the second is a second record of the
same park. A resolution in `data/identity/resolutions.json` naming sharon-park as the keeper is needed, as it
was for Tallahassee's Tom Brown Park.

## What Orem does not say

- **lighting**, at Hillcrest and Sharon. Only Bonneville writes "Lighted".
- **surface.**
- **indoor or outdoor.** A lighted court is not the word "outdoor". Null everywhere.
- **hours**, for the courts. The only hours line on any page is the splash pad's.
- **price**, anywhere.
- **nets.**

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `sharon-park` | street_address | "500 N 300 E" | "600 N 300 E" | overridden |
| `sharon-park` | pricing_notes | "Free public play" | "The City states no price. Its courts here cannot be reserved for private use: \"we currently ONLY reserve pickleball courts for the city's tournaments, not for any other private use\"." | overridden |
| `bonneville-park` | name | "Bonneville Park (Orem)" | "Bonneville Park" | overridden |
| `bonneville-park` | pricing_notes | "Public - Dedicated" | "The City states no price and no reservation rule for Bonneville's courts; its park page lists \"Four Lighted Pickleball Courts\" among the amenities and invites visitors to \"enjoy a game of Pickleball on one of the four new Pickleball courts\"." | overridden |
