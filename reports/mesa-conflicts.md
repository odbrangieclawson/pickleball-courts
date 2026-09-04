# Mesa verification - a label that is not a count, and a city that never says outdoor

Run 2026-09-04. 3 venues published, 26 courts. 6 venues refused.

Mesa was sitting in the PHASES.md "HTTP 403" bucket, refused during the runs for cities #9 to #12.
It does not refuse us now, and not because of Lincoln's browser-header fetcher: a BARE curl returns
200 from www.mesaaz.gov today, as it does from Durham, the other city retested from that bucket.
A 403 recorded against a site is a fact about one day. Fourteen cities in that bucket are untested.

## Published

| venue | courts | lit | what the City writes | address |
| --- | ---: | --- | --- | --- |
| `tennis-center-at-gene-autry-park` | 21 | yes | "21 lighted pickleball courts" | 4125 E McKellips Rd |
| `kleinman-park` | 4 | not stated | "Pickleball Courts (4)" | 710 S. Extension Rd. |
| `chaparral-park` | 1 | not stated | "Pickleball Court (1 lined court shared with basketball use, bring your own portable net)" | 1635 N Gilbert Road |

## The amenity label is not a count

Every Mesa park page carries a Features list, and nine of them include the words "Pickleball Court".
It is a label, printed the same whether a park has one court or six, and it is why five parks below
are refused. Sheepherders Park settles the question on a single page: "Pickleball Courts" in its
reservable list, "Pickleball Court" in its Features list, and no number anywhere on it.

Chaparral Park publishes one court not because its label is singular, but because the City writes
"(1 lined court shared with basketball use, bring your own portable net)" beside it.

## The Center is inside Gene Autry Park

Three records agree, and none of them knows about the others:

- the park page prints `4125 E Mckellips Rd`, the Center's page prints `4125 E McKellips Rd`
- the Center's page links to Gene Autry Park under "Additional Resources"
- the imported dataset files the Center under `mesa-tennis-center-at-gene-autry-park`

Publishing both would put two venues at one street address. The Center states a count; the park
does not. So the Center publishes, and the second ground would have been enough on its own.

## One postcode, two tier-1 answers

| source | postcode for 1635 N Gilbert Road |
| --- | --- |
| City of Mesa park page | 85213 |
| US Census address geocoder | 85203 |

The Census value publishes, because that is the resolver Import Gate I3 checks against. The
disagreement is printed on the venue page, and this run asserts BOTH sides still say what they say -
if either changes, the build fails rather than publishing a contradiction nobody is reading.

## Refused

**Gene Autry Park** - 4125 E Mckellips Rd

1. It shares a street address with the Mesa Tennis & Pickleball Center, which does publish here. The park page prints "4125 E Mckellips Rd" and the Center's page prints "4125 E McKellips Rd" - the same address, differing only in one capital letter. Publishing both would put two venues at one address.
2. Three independent records place the Center in this park: the shared address, the "Additional Resources" link from the Center's page to Gene Autry Park, and the imported dataset's own slug for the Center, "mesa-tennis-center-at-gene-autry-park".
3. Independently of all that, the park page states no pickleball count. Its Features list carries the label "Pickleball Court" and no number, which is the same ground the five parks below are refused on.

**Christopher J. Brady Park** - 7045 E. Monterey Ave.

1. The City states no pickleball count. The page says "Pickleball courts reservable online OR call the main line at 480-644-7529", which is a statement about booking, not a number, and the Features list carries the bare label "Pickleball Court".
2. The City does publish a per-court weekly calendar PDF for this park, headed "Christopher J. Brady Pickleball Court 01 at Christopher J. Brady Park". Counting how many such PDFs exist would produce a number, and that is a derivation rather than a stated count - the same shape as counting points in a map layer, which this project falsified for Sacramento and refused again for Saint Paul.

**Red Mountain Park** - 7745 E. Brown Rd

1. The City states no pickleball count. It describes the courts - "Pickleball Court - Lines on Basketball court (requires personal net)" - and gives no number. The description tells you the kind of court and what to bring, which is more than most, and it still does not say how many.

**Augusta Ranch Park** - 9455 E Neville Ave

1. The City states no pickleball count: "Pickleball Court lines (shared with basketball court, requires personal net)." As at Red Mountain, this describes the courts without counting them.

**Sheepherders Park** - 2455 E McDowell Rd

1. The City states no pickleball count. "Pickleball Courts" appears in the reservable list and "Pickleball Court" in the Features list on the same page, which is the clearest demonstration in this city that the label's singular and plural carry no information.

**Washington Park** - 44 E 5th St

1. The City states no pickleball count, in exactly the same shape as Sheepherders Park: "Pickleball Courts" in the reservable list, "Pickleball Court" in Features, no number on the page.

## What Mesa does not say

- **indoor or outdoor.** Not once, about any of these courts. `total_courts` publishes and both
  breakdowns stay null, so NO Mesa venue reaches the `/indoor/` or `/outdoor/` filter pages.
- **lighting, at the two parks.** Mesa marks lighting by writing it into the amenity name
  ("Basketball Court - Lighted"). Neither park marks its pickleball courts, and a lighted amenity
  sits directly above them in both lists. That is a house style, not a sentence, and Vancouver's
  rule is that only a stated negative publishes a No.
- **surface**, anywhere in the city.
- **a fee at the two parks.** Neither says "free", so `fee_type` stays null rather than being
  promoted from the absence of a price.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `tennis-center-at-gene-autry-park` | street_address | "4125 E McKellips Rd, Mesa, AZ 85215 (Gene Autry Park)" | "4125 E McKellips Rd" | overridden |
| `tennis-center-at-gene-autry-park` | hours_of_operation | "October hours: Mon-Fri 7:30am-12pm and 4-9:30pm; Sat 7:30am-12pm; Sun closed" | "Open 5:30 a.m. to 11:30 a.m. daily, and again 5:00 p.m. to 10:00 p.m. Monday through Friday. Closed evenings at the weekend." | overridden |
| `tennis-center-at-gene-autry-park` | fee_type | "drop_in_fee" | "reservation_fee" | overridden |
| `tennis-center-at-gene-autry-park` | pricing_notes | "City of Mesa municipal pricing. Reservations 2 weeks in advance." | "Court rental is $9.00 per court per hour daytime (8 AM-5 PM) and $13.00 per court per hour nighttime (5 PM-9 PM). The City states that \"Court fees must be paid inside pro shop before using the facility\", so there is no free play here." | overridden |
| `kleinman-park` | street_address | "710 S Extension Rd , Southern Blvd" | "710 S. Extension Rd." | overridden |
| `kleinman-park` | hours_of_operation | "6am To 10pm Daily" | "Open sunrise to 10 p.m., or as posted." | overridden |
