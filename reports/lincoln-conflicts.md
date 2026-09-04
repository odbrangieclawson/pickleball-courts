# Lincoln verification - dedicated courts, and a city page its parks do not confirm

Run 2026-09-04. 3 venues published, 22 courts, all outdoor. 1 venue refused.

Lincoln counts its pickleball courts in prose under a heading that names the kind of court:
"Dedicated Pickleball Courts", then "Includes six courts dedicated to pickleball play." Sixteen
of the 22 published courts are dedicated rather than striped onto tennis.

| venue | courts | dedicated | what the City writes | address |
| --- | ---: | --- | --- | --- |
| `ballard-park` | 6 | yes | "Includes six courts dedicated to pickleball play." | 3901 N 66th St. |
| `densmore-park` | 6 | 2 of 6 | "two dedicated pickleball courts; 2 dual striped (can be used as 4 pickleball courts)" | 6701 S. 14th Street |
| `peterson-park` | 10 | yes | "Includes ten courts dedicated to pickleball play." | 4400 Southwood Drive |

## The City keeps two records and they disagree

The Tennis and Pickleball page names and counts the pickleball venues. Each park also has a page
in Parks A to Z with its own Features list. They do not match:

| park | on the pickleball page | on the park page |
| --- | --- | --- |
| Ballard | six dedicated courts | no mention of pickleball; Features reads "Tennis Courts" |
| Densmore | two dedicated + two dual striped | no mention of pickleball; Features reads "Tennis Courts" |
| Peterson | ten dedicated courts | "includes ten pickleball courts", Pickleball in Features |
| Eden | six dedicated courts | Pickleball in Features - and refused, on its address |

The record that states a number is the record that publishes, which is the rule Saint Paul set.
Where the second record is silent, the venue page says so rather than implying two sources agree.
The run asserts that silence: if a park page starts naming pickleball, this build fails.

## Densmore is six, and the City did the arithmetic

> two dedicated pickleball courts; 2 dual striped (can be used as 4 pickleball courts)

Two plus four. The parenthesis is the City converting its own tennis courts, not us multiplying
anything. Tyrrell Park's "one dedicated tennis court; one dual striped" is a count of TENNIS
courts and yields no pickleball number, so Tyrrell does not publish.

## Refused

**Eden Park** - "Includes six courts dedicated to pickleball play."

1. Neither address resolver finds "46 Antelope Creek Rd", the address the City prints in the Location field of the park's own page: the US Census address file returns no match, and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.
2. The City's own description of the park, on the same page, places it "near 46th and Antelope Creek Road" — an intersection rather than a house number, which is what "46" appears to be a truncation of. The two statements do not agree with each other.
3. This is the costliest refusal in the run and the best-corroborated venue in the city: six dedicated courts on the Tennis and Pickleball page, and "Pickleball" in the park page's own Features list. The park page also publishes coordinates. They are not used as a substitute for an address that resolves.

## Named by the City with no count

Dual-striped parks, no pickleball number of any kind:

- Cooper Park
- Henry Park
- Roberts Park
- Roper (Max E.) Park
- Seng Park at University Place
- Tyrrell Park
- UPCO Park

Indoor sites, listed with an address and a phone number and no count:

- Air Park Community Center
- Calvert Recreation Center
- Easterday Recreation Center
- Woods Tennis Center

## The nearest miss on lighting

Densmore Park's page states "Lights: MUSCO (2000). Tournament quality" - under the heading
"DENSMORE PARK FIELDS", describing the four ballfields the City rents out. That is lighting on a
ballfield, not on a pickleball court, and no Lincoln venue publishes a lighting answer.

_No imported row was overwritten._
