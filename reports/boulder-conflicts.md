# Boulder verification - one table, free in a sentence, and indoor courts at drop-in times

Run 2026-09-07. 5 venues published, 29 courts (20 outdoor, 9 indoor). 2 venues refused.

Boulder is the first city in Colorado on this site and the first in Boulder County.

| venue | courts | out | in | table row | address |
| --- | ---: | ---: | ---: | --- | --- |
| `north-boulder-rec-center` | 7 | 4 | 3 | "4 pickleball / 4 tennis / Rolling / North Boulder Recreation Center" | 3170 Broadway, 80304 |
| `east-boulder-recreation-center` | 5 | 2 | 3 | "2 pickleball / Rolling / East Boulder Community Center" | 5660 Sioux Dr., 80303 |
| `south-boulder-recreation-center` | 11 | 8 | 3 | "8 pickleball / 4 tennis / Rolling / South Boulder Recreation Center" | 1360 Gillaspie, 80305 |
| `chautauqua-park` | 2 | 2 | - | "2 pickleball / 1 tennis / Rolling / Chautauqua Park" | 900 Baseline Rd, 80302 |
| `foothills-community-park` | 4 | 4 | - | "4 pickleball / Rolling / Foothills Community Park" | 800 Cherry Ave, 80304 |

## South Boulder: eight on the table, six in the drop-in line

The Racket Sports table reads "8 pickleball / 4 tennis"; the pickleball page's outdoor drop-in schedule reads
"Monday through Sunday: 8:30 to 11:30 am on 6 outdoor courts". Eight is the inventory and publishes; six is what the
City sets aside for the morning session. Both lines are asserted, and the venue page prints both.

## Published as closed

South Boulder Recreation Center: "Aug. 17 - tentatively scheduled to reopen Sept. 11: All SBRC Outdoor Racket Courts closed for court resurfacing and restriping." The run was made 2026-09-07; the notice is asserted and the build fails when the City removes it.

## Refused

**Tom Watson Park**

1. The City's Racket Sports page lists Tom Watson Park under "Additional Tennis Courts" with the figure 4, which is a count of tennis courts. It appears nowhere in the pickleball table and the City states no pickleball count for it anywhere on the pages read. The imported dataset carries twelve pickleball courts for it; an imported number is not a stated one.

**East Boulder Community Park**

1. Appears on the Racket Sports page only as a lighting note - "East Boulder Community Park Court Lights" - and as a project link, "East Boulder Community Park - Racket Courts". No court count is stated. It is a separate site from the East Boulder Community Center, which publishes.

## What Boulder does not say

- **lighting.** "Lights are not guaranteed for use of courts after sunset" is a rule, not a per-venue answer. Null everywhere.
- **surface.**
- **nets**, except at Foothills, where "Nets are not available onsite" is stated. The table's "Rolling" column is a label.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `north-boulder-rec-center` | name | "North Boulder Rec Center" | "North Boulder Recreation Center" | overridden |
| `north-boulder-rec-center` | total_courts | 3 | 7 | overridden |
| `north-boulder-rec-center` | outdoor_courts | 0 | 4 | overridden |
| `north-boulder-rec-center` | street_address | "3170 Broadway St. , Forest" | "3170 Broadway" | overridden |
| `north-boulder-rec-center` | fee_type | "drop_in_fee" | "free" | overridden |
| `north-boulder-rec-center` | pricing_notes | "Silver Sneakers Offered, Drop- In,seniors $5.75, Adult $7.50" | "Outdoor courts are free and first come; reserving one costs $10 per hour. Indoor drop-in is included with the recreation centre daily entry fee or pass." | overridden |
| `north-boulder-rec-center` | hours_of_operation | "Monday, Wed., Friday 8:30 - 10:30" | "Recreation centre: Monday-Friday 5:45 am-9:00 pm, Saturday and Sunday 6:45 am-6:00 pm. Indoor pickleball drop-in: Monday, Wednesday, Friday 7:30-10:30 am. Outdoor drop-in: Tuesday and Thursday 7:30-10:30 am, Wednesday and Friday 6-9 pm." | overridden |
| `north-boulder-rec-center` | court_availability | "Can be busy during peak hours" | "Seven pickleball courts in two places at one address: four outdoor courts on tennis courts with pickleball lines, and three indoor courts in the gymnasium at scheduled drop-in times. The four outdoor courts are the City's table figure - \"4 pickleball / 4 tennis\" - and the City calls them outdoor in its drop-in schedule: \"Tuesdays and Thursdays: 7:30 to 10:30 am on 4 outdoor courts\" and \"Wednesdays and Fridays: 6 to 9 pm on 4 outdoor courts\". Outside those windows the courts are first come and free, or reservable at $10 an hour. Indoors, \"Monday, Wednesday, Friday: 7:30 to 10:30 am on 3 indoor courts\", included with the centre's daily entry fee or pass, and the City says nets are not available outside the listed hours. The centre also has \"Two platform tennis courts with pickleball lines\" for overflow, which are not counted here. Lighting: the City says only that lights are not guaranteed after sunset and that complimentary light timers sit near Tennis Court 1, so no lighting answer is published." | overridden |
| `north-boulder-rec-center` | postal_code | "80302" | "80304" | overridden |
| `east-boulder-recreation-center` | name | "East Boulder Recreation Center" | "East Boulder Community Center" | overridden |
| `east-boulder-recreation-center` | total_courts | 3 | 5 | overridden |
| `east-boulder-recreation-center` | outdoor_courts | 0 | 2 | overridden |
| `east-boulder-recreation-center` | street_address | "5660 Sioux Dr" | "5660 Sioux Dr." | overridden |
| `east-boulder-recreation-center` | fee_type | "drop_in_fee" | "free" | overridden |
| `east-boulder-recreation-center` | pricing_notes | "Drop-in available" | "Outdoor courts are free and first come; reserving one costs $10 per hour. Indoor drop-in is included with the centre daily entry fee or pass." | overridden |
| `east-boulder-recreation-center` | hours_of_operation | "Monday: 6 AM to 9 PM; Tuesday: 6 AM to 9 PM; Wednesday: 6 AM to 9 PM; Thursday: 6 AM to 9 PM; Friday: 6 AM to 9 PM; Saturday: 8 AM to 4 PM; Sunday: 8 AM to 4 PM" | "Community centre: Monday-Friday 5:45 am-9:30 pm, Saturday and Sunday 7:45 am-4:00 pm. Indoor pickleball drop-in: Monday 1-3 pm and 6-8 pm, Sunday 2-4 pm." | overridden |
| `south-boulder-recreation-center` | total_courts | 5 | 11 | overridden |
| `south-boulder-recreation-center` | outdoor_courts | 2 | 8 | overridden |
| `south-boulder-recreation-center` | street_address | "1360 Gillaspie , Emerson" | "1360 Gillaspie" | overridden |
| `south-boulder-recreation-center` | fee_type | "drop_in_fee" | "free" | overridden |
| `south-boulder-recreation-center` | pricing_notes | "Silver Sneakers Offered & Adult $8.25, Seniors $5.75" | "Outdoor courts are free and first come; reserving one costs $10 per hour. Indoor drop-in is included with the recreation centre daily entry fee or pass." | overridden |
| `south-boulder-recreation-center` | hours_of_operation | "Tuesdays &amp; Thursdays 1:30 To 3:30; Sat 12 - 2: Sunday 11 - 1:00" | "Recreation centre: Monday-Friday 5:45 am-9:00 pm, Saturday and Sunday 8:45 am-4:00 pm. Outdoor pickleball drop-in: daily 8:30-11:30 am. Indoor drop-in: Sunday 9-11 am, Tuesday and Thursday 1:30-3:30 pm, and none from June through October." | overridden |
| `south-boulder-recreation-center` | court_availability | "Can be busy during peak hours" | "Eleven pickleball courts, the largest published set in Boulder: eight outdoor courts on tennis courts with pickleball lines - the City's table reads \"8 pickleball / 4 tennis\" - and three indoor courts in the gymnasium at drop-in times. The City's drop-in schedule says \"Monday through Sunday: 8:30 to 11:30 am on 6 outdoor courts\", six rather than eight, and the two figures are printed here rather than reconciled: the table is the inventory and the drop-in line is what the City sets aside for the morning session. Indoors, \"Sunday: 9 to 11 am on 3 indoor courts\" and \"Tuesday, Thursday: 1:30 to 3:30 pm on 3 indoor courts\", with the City's own footnote that \"There is no indoor Pickleball at South Boulder Recreation Center from June through October\". When this run was made the outdoor courts were shut: \"Aug. 17 - tentatively scheduled to reopen Sept. 11: All SBRC Outdoor Racket Courts closed for court resurfacing and restriping.\" That notice is published as the City printed it, and the build fails the day the City takes it down." | overridden |
| `south-boulder-recreation-center` | postal_code | "80303" | "80305" | overridden |
| `chautauqua-park` | pricing_notes | "Public" | "Free and first come; reserving a court costs $10 per hour. Paid parking is in effect at and near the park on summer weekends and holidays, Memorial Day weekend to Labor Day." | overridden |
| `chautauqua-park` | hours_of_operation | "Contact facility" | "Park hours 5:00 am-11:00 pm daily." | overridden |
