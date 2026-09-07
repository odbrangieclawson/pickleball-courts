# Chandler verification - two publishable venues, below the threshold: the city does not publish

Run 2026-09-07. 2 venues publishable, 2 courts. 6 venues refused. **No page is built for Chandler.**

Chandler cannot publish. A city, county or filter page exists only with three or more verified venues, and
after the refusals below Chandler has two: La Paloma Park and Brooks Crossing Park, one court each. Both pass
every gate. The run is kept so the record exists, it asserts every sentence it relies on, and it throws before
writing data/verified/chandler-az.json. It would be the third city in Arizona, after Scottsdale and Mesa, and
the third in Maricopa County, if any one of Arrowhead Meadows, Tumbleweed or Arbuckle ever resolved, or if
Homestead North or Pecos Ranch ever gained a number.

| venue | courts | lit | what the City writes | address |
| --- | ---: | --- | --- | --- |
| `la-paloma-park` | 1 | not stated | "The single pickleball court at La Paloma park is the perfect spot to practice your skills and enjoy some friendly competition." | 6579 S. Amanda Drive |
| `brooks-crossing-park` | 1 | yes | "This single pickleball court is perfect for a quick game, or a few, with friends or family. Play into the evening on this well lit court." | 1345 W. Calle Del Norte |

## The refusal that took Chandler below the threshold

**Arrowhead Meadows Park** - "It's also a pickleball player's paradise, featuring six courts." - 1475 W. Erie St., 85224

The City prints "1475 W. Erie St." and the postcode 85224. The Census address file answers "1475 E ERIE ST" in
85225 - West became East, and the postcode changed with it - and OpenStreetMap has no record of the address as
written. That is Tampa's Foster Park case exactly: the direction flipped by the resolver, and the City's own
postcode contradicting the only answer available. Foster Park was refused. An earlier draft of this run
published Arrowhead on the Census answer under Mesa's Chaparral Park postcode rule, which covers a postcode
disagreement on an address that resolved as written; this one did not resolve as written. A rule relaxed on
the day it costs something is not a rule, and here it costs six courts and the city page.

## The count rule this city needed

A written number is a count ("six courts"). So is "single" attached to the court ("This single pickleball
court"): it states how many. A definite or indefinite article is not ("The well-lit pickleball court at
Homestead North", "features a pickleball court" at Pecos Ranch): it says a court exists and nothing about
how many, which is the label the Mesa rule refuses. Both parks plainly have a court; neither publishes,
because reading is not the same as the operator stating it. The run fails if either page gains a number.

## Refused

**Arrowhead Meadows Park** - "It's also a pickleball player's paradise, featuring six courts." - 1475 W. Erie St., 85224

1. The City prints "1475 W. Erie St." and the postcode 85224. The US Census address geocoder answers "1475 E ERIE ST, CHANDLER, AZ, 85225" - the compass direction flipped from W to E and a different postcode - and OpenStreetMap has no record of the address as the City writes it. An address that resolves only by changing which side of the city it is on has not resolved.
2. The City's own postcode, 85224, contradicts the only answer available. This is Tampa's Foster Park case exactly, and Foster Park was refused. Mesa's Chaparral Park rule - publish the Census postcode and state the disagreement - covers an address that resolved as written; it does not cover one the resolver had to rewrite. A rule relaxed on the day it costs something is not a rule.
3. The count is stated twice - "featuring six courts" and "This park has six courts" - so the venue fails on its address alone. Six courts, and the refusal that takes Chandler from three publishable venues to two, below the threshold.

**Tumbleweed Park Pickleball Facility** - "the facility features 18 outdoor courts with LED lighting, restrooms, practice courts, drinking fountains, and a new parking lot." - 2041 S. Pioneer Parkway

1. Neither address resolver finds "2041 S. Pioneer Parkway", the address the City publishes for it: the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.
2. This is the third time this project has refused it. It was among the nine refusals that prompted the second resolver on 2026-09-04, the second resolver still refused it that day, and it is refused again here. Eighteen lit outdoor courts, opened 6 September 2025, against the two courts that survive the gates - the most expensive refusal in the city by a distance.

**Arbuckle Park** - "This single pickleball court is perfect for practicing your skills and playing games with friend." - 1100 S. Norman Way / 110 S. Norman Way

1. The City prints two addresses for it: "1100 S. Norman Way" on the park's own page and "110 S. Norman Way" on its pickleball page. Neither resolves with either resolver.
2. The count is stated - "This single pickleball court" - so the venue fails on its address alone, twice over.

**Homestead North Park** - "The well-lit pickleball court at Homestead North is a great place to get your pickle on all day long." - 1925 E. Frye Road

1. The City states no count. "The well-lit pickleball court" is a definite article, not a number: it says a court exists and says nothing about how many. That is a label, and a flag is not a number (the Mesa rule). The address resolves and the court is stated lit; the venue fails on the one fact a court page cannot do without.

**Pecos Ranch Park** - "This multi-use court features a pickleball court as well as some extra space to play your own game." - 1555 W. Maplewood St.

1. The City states no count. "features a pickleball court" is an article, not a number, and the park description says only "a multi-use court with a pickleball net". Same ground as Homestead North.

**Apache Park** - "Please note that the pickleball courts are lined only and use existing tennis court nets." - 1300 N. Hartford St.

1. The City states no count. Its page says the pickleball courts "are lined only and use existing tennis court nets" and counts the tennis courts ("four tennis courts"), never the pickleball ones. Apache is not on the City's pickleball page at all.

## What Chandler does not say

- **lighting**, at La Paloma. Its page says the basketball court is well lit and says nothing about the
  pickleball court. Brooks Crossing says it: "Play into the evening on this well lit court."
- **surface.**
- **nets.**

_No imported row was overwritten._
