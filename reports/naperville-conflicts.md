# Naperville verification - a park district that states dedicated, lit, nets and a surface, and three addresses that do not resolve

Run 2026-09-07. 3 venues published, 25 courts. 5 venues refused.

Naperville is the first city in Illinois on this site and the first whose operator is a park district: the Naperville
Park District, not the City of Naperville, owns and runs these parks.

| venue | courts | out | lit | nets provided | surface | what the District writes | address |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| `nike-sports-complex` | 12 | 12 | not stated | **no (stated)** | not stated | "Nike Sports Complex has 4 dedicated pickleball courts and there are 8 lit tennis courts lined for pickleball; participants must provide their own nets" | 288 W Diehl Road, 60563 (DuPage County) |
| `ranchview-park` | 9 | 9 | **no (stated)** | not stated | modular_tile | "The tennis courts have striping for a total of 9 pickleball courts." | 1727 Ranchview Drive, 60565 (DuPage County) |
| `ashbury-park` | 4 | 4 | **no (stated)** | yes | not stated | "Ashbury Park has 4 unlit courts using tennis nets" | 1740 Conan Doyle Road, 60564 (Will County) |

## Three addresses, eighteen courts, and Import Gate I1

Neither the US Census address file nor OpenStreetMap resolves "3252 Wolf's Crossing Road", "2807 S Washington Street" or
"3380 Cedar Glade Drive" at house-number level. Wolf's Crossing is printed by the District with the postcode 60543, which is
Oswego's; the park sits at the city's southern edge. Each refusal is asserted against the resolver file, so a venue publishes
the day its address resolves.

## Refused

**Wolf's Crossing Community Park** - "Wolf's Crossing Community Park has 4 dedicated pickleball courts and there are 4 lit tennis courts lined for pickleball; participants must provide their own nets" - 3252 Wolf's Crossing Road

1. Neither address resolver finds "3252 Wolf's Crossing Road": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.
2. Eight courts - "4 dedicated pickleball courts and there are 4 lit tennis courts lined for pickleball" - and the District's page prints the postcode 60543, which is Oswego's rather than Naperville's; the park sits at the city's southern edge. It fails on its address alone.

**DuPage River Sports Complex** - "Dupage River Sports Complex has 4 lit tennis courts lined for pickleball; participants must provide their own nets" - 2807 S Washington Street

1. Neither address resolver finds "2807 S Washington Street", the address the District prints for it. Import Gate I1.
2. Four lit courts on lined tennis courts, with the District's bring-your-own-net note. The imported dataset holds this venue at the same address with eight courts; the District says four, and neither publishes while the address does not resolve.

**Frontier Sports Complex** - "Rothermel Family Pickleball Courts" - 3380 Cedar Glade Drive

1. Neither address resolver finds "3380 Cedar Glade Drive". Import Gate I1.
2. The location page names the "Rothermel Family Pickleball Courts" and states no number; the number - "the six new courts" - is in a District news release dated Tuesday, May 16, 2023. Lincoln's rule would let a record that states a number publish, and a two-year-old release would need saying so on the page; the address failure means that question is not reached.

**Knoch Park** - "Pickleball" - 724 S. West Street

1. The District names Knoch Park on its Park It page as a place with outdoor pickleball courts, and the park's own page lists "Pickleball" among its amenities with no number. A flag is not a number, and Page Gate 1 requires a stated count.

**Fort Hill Activity Center** - "Play pickleball at the Fort Hill Activity Center during an open gym time or register for a pickleball program."

1. Indoor open-gym pickleball: "Play pickleball at the Fort Hill Activity Center during an open gym time or register for a pickleball program." No court count is stated anywhere the District publishes.

## Ranchview's page disagrees with itself about the nets

"Ranchview Park has 6 unlit courts using tennis nets" and, two lines later, "3 courts on the west side use the tennis nets, 6
courts on the east side require patrons to bring their own nets." Both are asserted and `nets_provided` stays null. The count
of nine and the word "unlit" are not in dispute.

## What Naperville does not say

- **lighting on Nike's four dedicated courts.** "8 lit tennis courts lined for pickleball" is stated; the four are not. The
  venue's `light` stays null.
- **fee, hours, play format.** Nothing stated anywhere.
- **indoor.** Fort Hill Activity Center's open-gym pickleball has no count.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `nike-sports-complex` | street_address | "288 W Diehl Rd," | "288 W Diehl Road" | overridden |
