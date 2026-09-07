# Albuquerque verification - one table, and an older one hidden in a comment

Run 2026-09-07. 13 venues published, 86 courts (21 stated lit). 3 venues refused.

Albuquerque is the first city in New Mexico on this site and the first in Bernalillo County.

| venue | courts | kind | lit | what the City writes | address |
| --- | ---: | --- | --- | --- | --- |
| `manzano-mesa-park` | 33 | Pickleball Complex | yes (21 of 33) | "33 Courts (21 Lighted)" | 501 Elizabeth SE |
| `villela-park` | 6 | Pickleball Complex | not stated | "6 Courts" | 4800 Cherokee NE |
| `sierra-vista-tennis-complex` | 6 | Tennis/Pickleball Courts | not stated | "2 Courts and 4 Lined Courts" | 5001 Montano Rd. NW |
| `hoffman-park` | 2 | Tennis Courts with Pickleball Lines | not stated | "2 Pickleball Courts" | 2480 Mesa Linda NE |
| `rinconada-park` | 2 | Tennis Courts with Pickleball Lines | not stated | "2 Pickleball Courts" | 3125 Painted Rock NW |
| `montgomery-park` | 6 | Tennis Courts with Pickleball Lines | not stated | "6 Pickleball Courts" | 5510 Ponderosa NE |
| `columbus-park` | 4 | Tennis Courts with Pickleball Lines | not stated | "4 Pickleball Courts" | 5301 Guadalupe Trail NW |
| `eagle-ranch-park` | 4 | Tennis Courts with Pickleball Lines | not stated | "4 Pickleball Courts" | 3500 1/2 Congress NW |
| `loma-del-norte-park` | 4 | Tennis Courts with Pickleball Lines | not stated | "4 Pickleball Courts" | 7511 Burke NE |
| `lynnewood-park` | 4 | Tennis Courts with Pickleball Lines | not stated | "4 Pickleball Courts" | 2721 Marie Park NE |
| `lauren-c-bolles` | 8 | Tennis Courts with Pickleball Lines | not stated | "8 Pickleball Courts" | 13121 Skyview NE |
| `quintessence-park` | 4 | Tennis Courts with Pickleball Lines | not stated | "4 Pickleball Courts" | 9801 Quintessence NE |
| `wells-park` | 3 | not stated | not stated | "3 Pickleball Courts" | 500 Mountain NW |

## The older lists are inside an HTML comment

The page source carries two further tables - "Locations: Pickleball Complexes" and "Locations: Tennis Courts
Lined for Pickleball" - inside one `<!-- -->` comment. They give Manzano Mesa "18 Courts (6 Lighted)" against the
visible "33 Courts (21 Lighted)", Eagle Ranch 2 against 4, Montgomery 4 against 6, Ventana Ranch "8 Lighted" against
12, and they name Barelas, Los Altos and Zuni Parks, which the visible table does not. A browser renders none of it.
The two-records rule that refused Irvine's Los Olivos needs two published statements; a comment is not one. The run
asserts the residue is still present and still hidden, so if the City ever uncomments it the build fails and the
city is re-read under that rule. "Players need to bring pickleball nets." is also inside the comment, so
`nets_provided` stays null.

## Refused

**Pat Hurley Park** - "Pat Hurley Park 3828 Rincon Rd NW Tennis/Pickleball Courts 4 Courts and 4 Lined Courts"

1. Neither address resolver finds "3828 Rincon Rd NW": the US Census address file returns no match and OpenStreetMap returns nothing at house-number level. Import Gate I1 requires a street address that resolves.
2. The City states eight courts ("4 Courts and 4 Lined Courts", "4 dedicated and 4 blended lines") and hours of 6 a.m. to 10 p.m. daily for it - more than it states for most venues that do publish. It fails on its address alone.

**Alamosa Park** - "Alamosa Park 1100 Bataan SW Tennis Courts with Pickleball Lines 8 Lighted Pickleball Courts"

1. Neither address resolver finds "1100 Bataan SW". Import Gate I1.
2. Eight lighted lined courts, one of only three lighting statements the City makes. It fails on its address alone.

**Ventana Ranch Park** - "Ventana Ranch Park 10000 Universe NW Tennis Courts with Pickleball Lines 12 Lighted Pickleball Courts"

1. Neither address resolver finds "10000 Universe NW". Import Gate I1. The imported dataset carries this park with no house number at all ("Universe Blvd, Nw, Universe And Paradise Blvd."), and the commented-out older list on the City's own page also gives it without one.
2. Twelve lighted lined courts, the largest lined set the City lists and the most expensive refusal in the city. It fails on its address alone.

## What Albuquerque does not say

- **indoor or outdoor**, about any venue. Null everywhere.
- **price.** "first come, first serve" is a play format; the Sierra Vista phone reservation carries no price.
- **surface.**
- **lighting**, at every published venue but Manzano Mesa.
- **nets**, on the visible page.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `manzano-mesa-park` | name | "Manzano Mesa Park Pickleball Courts" | "Manzano Mesa Pickleball Complex" | overridden |
| `manzano-mesa-park` | total_courts | 18 | 33 | overridden |
| `manzano-mesa-park` | street_address | "501 Elizabeth St. Se , Southern" | "501 Elizabeth SE" | overridden |
| `manzano-mesa-park` | hours_of_operation | "Free Pickleball Courts Open From 6am To 10 Pm. Scheduled Activities At Abqpickleball.com" | "6 a.m. to 10 p.m. daily" | overridden |
| `villela-park` | name | "Villela Park Pickleball Courts" | "Villela Pickleball Courts" | overridden |
| `villela-park` | street_address | "4800 Cherokee Drive Ne , Monroe St" | "4800 Cherokee NE" | overridden |
| `villela-park` | court_availability | "Generally available" | "Six dedicated pickleball courts at the second of the City's \"two dedicated pickleball complexes\", in the north-east of the city. The table reads \"Pickleball Complex / 6 Courts\". Open 6 a.m. to 10 p.m. daily in the City's sentence, which spells the name \"Villella\" where the table has \"Villela\". First come, first served, with play limited to an hour and a half when others are waiting. Lighting is not stated for these courts; the City marks it in the description cell where it applies and this cell carries no such mark. Price, surface, nets and indoor/outdoor are not stated." | overridden |
| `villela-park` | hours_of_operation | "no set schedule, open public courts" | "6 a.m. to 10 p.m. daily" | overridden |
