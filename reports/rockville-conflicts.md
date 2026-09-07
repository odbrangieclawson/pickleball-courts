# Rockville verification - one table, fourteen rows, twelve venues

Run 2026-09-07. 12 venues published, 46 courts (12 dedicated, 31 on tennis-court lines, 3 unsplit), 4 venues lit. 2 table rows refused; 3 community centres named without a count.

Rockville is the first city in Maryland on this site and the first in Montgomery County. Every count is a cell of
the City's own table under "Outdoor Pickleball Courts", every lighting answer is that table's Lighted column, and every address is
the "Address" block of the park's place page.

| venue | courts | dedicated / striped | lit | nets | address | what the City writes |
| --- | ---: | --- | --- | --- | --- | --- |
| `broome-athletic-park` | 4 | 4 / 0 | yes | not stated | 751 Twinbrook Parkway (20851) | "4 Dedicated Pickleball Courts" |
| `calvin-park` | 2 | 0 / 2 | no (stated) | not provided | 1248 Gladstone Drive (20851) | "2 Pickleball Courts" "(pickleball lines on 1 tennis court; bring your own net)" |
| `dogwood-park` | 5 | 0 / 5 | yes | not stated | 800 Monroe St. (20850) | "1 Pickleball Court" "(pickleball lines on 1 tennis court; use tennis net)" "4 Pickleball Courts" "(pickleball lines on 2 tennis courts; bring your own net)" |
| `fallsgrove-park` | 4 | 0 / 4 | no (stated) | not provided | 700 Fallsgrove Drive (20850) | "4 Pickleball Courts" "(pickleball lines on 2 tennis courts; bring your own net)" |
| `hillcrest-park` | 2 | 0 / 2 | no (stated) | not provided | 1150 Crawford Drive (20851) | "2 Pickleball Courts" "(pickleball lines on 1 tennis court; bring your own net)" |
| `isreal-park` | 4 | 2 / 2 | no (stated) | not provided | 357 Frederick Avenue (20850) | "2 Dedicated Pickleball Courts" "2 Pickleball Courts" "(pickleball lines on 1 tennis court; bring your own net)" |
| `mattie-j-t-stepanek-park` | 4 | 4 / 0 | yes | not stated | 1800 Piccard Drive (20850) | "4 Dedicated Pickleball Courts" |
| `north-farm-park` | 4 | 0 / 4 | no (stated) | not provided | 601 Farm Pond Lane (20852) | "4 Pickleball Courts" "(pickleball lines on 2 tennis courts; bring your own net)" |
| `potomac-woods-park` | 4 | 0 / 4 | no (stated) | not provided | 2276 Dunster Lane (20854) | "4 Pickleball Courts" "(pickleball lines on 2 tennis courts; bring your own net)" |
| `rockcrest-park` | 3 | unsplit | no (stated) | not provided | 1331 Broadwood Drive (20851) | "3 Pickleball Courts" "(bring your own net)" |
| `rockville-civic-center-park` | 4 | 0 / 4 | no (stated) | not provided | 603 Edmonston Drive (20851) | "4 Pickleball Courts" "(pickleball lines on 2 tennis courts; bring your own net)" |
| `welsh-park` | 6 | 2 / 4 | yes | not provided | 344 Martins Lane (20850) | "2 Dedicated Pickleball Courts" "4 Pickleball Courts" "(pickleball lines on 2 tennis courts; bring your own net)" |

## Two count lines in one row

Dogwood (1 + 4), Isreal (2 dedicated + 2) and Welsh (2 dedicated + 4) each print two count lines in one cell.
They sum into one venue, as Mount Pleasant's Park West and Henderson's Silver Springs do, and both lines are
quoted in the evidence. Dogwood's two lines disagree on nets - "use tennis net" and "bring your own net" - so
nets_provided stays null there.

## Postcodes the City prints and the resolver does not

Dogwood Park: the City prints 20852, the Census address file returns 20850 for "800 Monroe St.". Rockcrest Park: the
City prints 20850, the Census returns 20851 for "1331 Broadwood Drive". Rockville Civic
Center Park: the City prints 20850, the Census returns 20851 for "603 Edmonston Drive". All three resolved as written,
same house number, street and direction, so this is Mesa's Chaparral Park and not Foster Park: the Census value
publishes and the disagreement is stated on the venue page. The run throws if the resolver ever agrees.

## Refused

**Twinbrook Park** - "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net), Lighted Yes"

1. The City's place page puts the park at "12920 Twinbrook Parkway", and neither the Census address file nor OpenStreetMap has a record of that house number. Foster Park's rule: a count-bearing address that does not resolve as the operator writes it is not published.
2. The run throws if the address ever resolves, so the venue is re-read and published rather than left refused by habit.

**Glenora Park** - "4 Pickleball Courts (pickleball lines on 2 tennis courts; bring your own net), Lighted No"

1. The City's place page gives the address as "Dundee Road and Wootton Parkway", an intersection with no house number. Import Gate I1 needs a house number to resolve, and an intersection is the shape of the held Tom Brown Park row in Tallahassee.
2. The run throws if the City ever prints a house number for the park.

**Lincoln Park Community Center, Thomas Farm Community Center, Twinbrook Community Recreation Center** - "offer open gym schedules during drop-in hours featuring pickleball and many other sports. No requirement to sign up, just show up and play!"

1. Named on the City's pickleball page as offering open gym schedules featuring pickleball, with no court count. Named, not counted; a venue needs a stated count to exist here.

## Imported rows that stay pending

- `king-farm` - "Pleasant Drive , Mattie Stepanek Park", 4 courts, fee "free". A second record of Mattie J.T. Stepanek
  Park with no house number and a price the City does not state. The `king-farm-mattie-j-t-stepanek-park` row at
  1800 Piccard Dr is the one matched.
- `north-farm-courts` (imported as north-farm-courts-rockville-md) - "916 Farm Haven Dr", 4 courts. Not the City's
  North Farm Park at 601 Farm Pond Lane; the City's park is minted.
- The commercial and club rows (Dill Dinkers, Pickleball Climb, Old Farm, Bender JCC) and the community-centre rows
  (Lincoln Park, Thomas Farm, Twinbrook, North Potomac, Dacek) are untouched; the City names three of the centres
  for drop-in gym pickleball and counts none of them.

## What Rockville does not say

- **price**, anywhere; and not the word "free".
- **surface.**
- **indoor.** Every table row is outdoor by the heading; the centres named for gym pickleball carry no count.
- **nets**, at the two dedicated-only rows (Broome, Stepanek), and at Dogwood where the two lines differ.
- **whether Rockcrest's three are dedicated or striped** - the one row with neither word.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `broome-athletic-park` | street_address | "751 Twinbrook Pkwy" | "751 Twinbrook Parkway" | overridden |
| `broome-athletic-park` | hours_of_operation | "Contact facility" | "Dawn to dusk; lighted courts close at 10 p.m." | overridden |
| `broome-athletic-park` | pricing_notes | "Public" | "The City states no price and does not write the word \"free\". Its rule for every outdoor court: \"Courts are open from dawn to dusk and are available on a first-come, first-served basis. City recreation programs have priority over the use of the courts, so some may be reserved for class use and closed to the public.\"" | overridden |
| `dogwood-park` | total_courts | 4 | 5 | overridden |
| `dogwood-park` | outdoor_courts | 4 | 5 | overridden |
| `dogwood-park` | street_address | "800 Monroe St" | "800 Monroe St." | overridden |
| `dogwood-park` | hours_of_operation | "Contact facility" | "Dawn to dusk; lighted courts close at 10 p.m." | overridden |
| `dogwood-park` | pricing_notes | "Public" | "The City states no price and does not write the word \"free\". Its rule for every outdoor court: \"Courts are open from dawn to dusk and are available on a first-come, first-served basis. City recreation programs have priority over the use of the courts, so some may be reserved for class use and closed to the public.\"" | overridden |
| `dogwood-park` | postal_code | "20852" | "20850" | overridden |
| `mattie-j-t-stepanek-park` | name | "King Farm - Mattie J.T. Stepanek Park" | "Mattie J.T. Stepanek Park" | overridden |
| `mattie-j-t-stepanek-park` | street_address | "1800 Piccard Dr" | "1800 Piccard Drive" | overridden |
| `mattie-j-t-stepanek-park` | hours_of_operation | "Contact facility" | "Dawn to dusk; lighted courts close at 10 p.m." | overridden |
| `mattie-j-t-stepanek-park` | pricing_notes | "Public" | "The City states no price and does not write the word \"free\". Its rule for every outdoor court: \"Courts are open from dawn to dusk and are available on a first-come, first-served basis. City recreation programs have priority over the use of the courts, so some may be reserved for class use and closed to the public.\"" | overridden |
| `welsh-park` | hours_of_operation | "Contact facility" | "Dawn to dusk; lighted courts close at 10 p.m." | overridden |
| `welsh-park` | pricing_notes | "Public" | "The City states no price and does not write the word \"free\". Its rule for every outdoor court: \"Courts are open from dawn to dusk and are available on a first-come, first-served basis. City recreation programs have priority over the use of the courts, so some may be reserved for class use and closed to the public.\"" | overridden |
