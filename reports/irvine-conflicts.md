# Irvine verification - two City records per venue, and one venue where they disagree

Run 2026-09-07. 3 venues published, 18 courts. 1 venue refused.

Irvine is the first city in California on this site and the first in Orange County. Every published
count is stated twice by the City - once on its pickleball page, once in the park's own amenity list.

| venue | courts | lit | pickleball page | park page | address |
| --- | ---: | --- | --- | --- | --- |
| `mike-ward-community-park` | 8 | yes | "eight lit pickleball courts located at Mike Ward Community Park" | "8 Lighted Pickleball Courts" | 20 Lake Road |
| `portola-springs` | 6 | yes | "six lit pickleball courts located at Portola Springs Community Park" | "6 Lighted Pickleball Courts" | 900 Tomato Springs |
| `heritage-community-park` | 4 | yes | "four lit pickleball courts located at Heritage Park" | "4 Lighted Pickleball Courts" | 14301 Yale Ave. |

## Refused

**Los Olivos Community Park** - "two lit pickleball courts located at Los Olivos Community Park" / "3 Lighted Pickleball Courts" - 101 Alfonso

1. The City disagrees with itself about the count. Its pickleball page says "two lit pickleball courts located at Los Olivos Community Park", its court regulations page says "two lit pickleball courts at Los Olivos Community Park", and the park's own amenity list says "3 Lighted Pickleball Courts". Three City records, two numbers.
2. The rule that decided Saint Paul and Lincoln - the record that states a number publishes - cannot choose between two numbers, and Colorado Springs was refused as a city for a contradiction of exactly this shape. The address resolves and the courts are lit; the venue fails on the one fact a court page cannot do without.

## The hybrid courts are an aggregate

The City's pickleball page: "In addition, there are 10 hybrid tennis and pickleball courts located at the
following parks: Heritage, Knollcrest, Los Olivos, Portola Springs, San Carlo, Turtle Rock, and University."
The regulations page says nine, and lists six parks. A city-wide total across several parks is not a venue count, so Knollcrest, San Carlo, Turtle
Rock and University are not venues here and Heritage's four dedicated courts are published without them.

## What Irvine does not say

- **indoor or outdoor**, about any court. The breakdowns stay null.
- **free.** The City prices its reservable courts and calls the rest first come, first served. It never
  writes the word, so `fee_type` stays null and no Irvine venue is on the /free/ page.
- **surface.**

## A postcode the City and the Census disagree on

Portola Springs Community Park: the City prints "Irvine, CA 92620"; the Census address file returns 92618
for 900 Tomato Springs. The Census value publishes, as at Mesa's Chaparral Park, and the run asserts both.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `portola-springs` | name | "Portola Springs" | "Portola Springs Community Park" | overridden |
| `portola-springs` | hours_of_operation | "Monday: 6 AM to 10 PM; Tuesday: 6 AM to 10 PM; Wednesday: 6 AM to 10 PM; Thursday: 6 AM to 10 PM; Friday: 6 AM to 10 PM; Saturday: 6 AM to 10 PM; Sunday: 6 AM to 10 PM" | "6 a.m. to 10 p.m., daily" | overridden |
| `portola-springs` | postal_code | "92816" | "92618" | overridden |
| `portola-springs` | pricing_notes | "Free public play" | "Courts #5 and #6 can be reserved online: resident rate $17/hr, non-resident rate $19/hr, in one- or two-hour blocks, 7 a.m. to noon and 4 to 10 p.m. The other courts are first come, first served and the City states no price for them." | overridden |
| `heritage-community-park` | total_courts | 2 | 4 | overridden |
| `heritage-community-park` | street_address | "14301 Yale Ave" | "14301 Yale Ave." | overridden |
| `heritage-community-park` | hours_of_operation | "Contact facility" | "6 a.m. to 10 p.m., daily" | overridden |
