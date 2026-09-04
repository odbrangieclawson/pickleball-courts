# Bellevue verification - one page, fourteen counts, and the one that could not be placed

Run 2026-09-04. 12 venues published, 38 courts (24 outdoor, 14 indoor). 1 venue excluded.

The City of Bellevue publishes a court count for every pickleball venue it lists, indoor and
outdoor, on a single page - the richest municipal source read for this directory so far. It also
states its own default, which is rarer than the counts:

> "Bellevue's pickleball courts are shared use with tennis courts, unless otherwise noted."

| venue | courts | where | what kind, in the City's words |
| --- | ---: | --- | --- |
| `cherry-crest-mini-park` | 1 | outdoor | "1 court (over tennis net)" |
| `crossroads-park` | 4 | outdoor | "4 courts (portable nets)" |
| `eastgate-park` | 4 | outdoor | "4 courts (dedicated)" |
| `hidden-valley-park` | 5 | both | "2 courts (portable nets)" and "3 courts" |
| `hillaire-park` | 3 | outdoor | "3 courts (1 dedicated, 2 portable nets)" |
| `lakemont-community-park` | 4 | outdoor | "4 courts (portable nets)" |
| `lewis-creek-park` | 2 | outdoor | "2 courts (basketball court overlay, portable nets)" |
| `norwood-village-neighborhood-park` | 2 | outdoor | "2 courts (over tennis net)" |
| `spiritridge-park` | 2 | outdoor | "2 courts (portable nets)" |
| `crossroads-community-center` | 3 | indoor | "3 courts" |
| `north-bellevue-community-center` | 2 | indoor | "2 courts (with low ceiling)" |
| `south-bellevue-community-center` | 6 | indoor | "6 courts" |

## Excluded

**Highland Community Park** - "4 courts (portable nets)" - three independent reasons:

1. The Census address geocoder returns no match for "14224 Bel-Red Road", the address the City's own park page gives, and no match for four spelling variants of it. Import Gate I1 requires a street address that resolves.
2. The park's own page never mentions pickleball: its description lists "two tennis courts" and its amenity list carries "Tennis Courts", with no pickleball anywhere. The court count has no corroboration on the City's record card for the park.
3. The City's two pages disagree on its name. The pickleball page says "Highland Community Park"; the park page says "Highland Park".

The run asserts all three still hold. The day the address resolves, or the park page starts
naming pickleball, this run fails rather than continuing to exclude a venue for a reason that
has expired.

## One park listed twice

The City lists `Hidden Valley Fieldhouse: 3 courts` under Indoor and `Hidden Valley Sports Park:
2 courts (portable nets)` under Outdoor, and links both names to the same park page at
1903 112th Ave NE. They are published as one venue with 3 indoor and 2 outdoor courts - the first
venue in this directory to carry both - rather than two venue pages sharing a street address and
competing for the same search.

## A count with a date on it

Eastgate Park went pickleball-only on 1 September 2026, three days before this check. The City
announced it on 28 August: the tennis nets come off two dual-use sport courts, the four
pickleball courts become permanent, the courts stay first-come first-serve, and a resurfacing
with pickleball lines only is planned to follow. The same notice states that the department
"does not currently have conversions planned at any other dual-use courts in Bellevue" - a
stated negative, and one this run asserts, so that a later announcement breaks the build rather
than leaving a page quietly claiming nothing else is coming.

## What this city does not say

| field | venues with a value | why |
| --- | ---: | --- |
| `light` | 0 | Stated nowhere. Hidden Valley Park mentions "a lighted tennis court", which is not a statement about a pickleball court. |
| `surface` | 0 | Bellevue names what a court is shared with - tennis, basketball - which is a use, not a material. |
| `parking` | 0 | The word "Parking" appears in every snapshot as a navigation item, "Permits, Parking and Utilities". A naive amenity match would have published a parking fact for all twelve venues from a menu. |
| `fee_type` | 1 | Only South Bellevue Community Center publishes a price. The City's outdoor courts are never called free, and the other two centres point at PDF schedules dated 2023 and 2024. |
| `nets_provided` | 1 | "portable nets" says the nets are portable, not who brings them. Only South Bellevue says: "We provide pickleball balls, nets, and poles." |

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `hillaire-park` | total_courts | 1 | 3 | overridden |
| `hillaire-park` | outdoor_courts | 1 | 3 | overridden |
| `hillaire-park` | street_address | "15803 Ne 6th Street" | "15803 NE 6th St" | overridden |
| `hillaire-park` | court_availability | "Can be busy during peak hours" | "Three courts, of which one is dedicated pickleball and two are portable nets on the park's two tennis courts. The park page words the same split as \"three pickleball courts (one dedicated, two overlay)\"." | overridden |
| `south-bellevue-community-center` | drop_in_fee_usd | 4 | 5 | overridden |
| `south-bellevue-community-center` | pricing_notes | "$$4 (Bellevue Resident) / $5 (Non-resident)" | "Adult drop-in sessions cost $4 for Bellevue residents and $5 for non-residents. Family drop-in sessions are free, but require an adult and a child under 18 from the same household to be on court together." | overridden |
