# Seattle verification — what the municipal source changed

Run 2026-09-03. 5 venues, tier 2, verified_by = municipal_source.

Policy: the municipal source wins. The imported rows carry no qualifying
source at all — their `source_url` points at CourtSource, a competitor
directory, which Import Gate I2 rejects by name. So every disagreement
below is a sourced value replacing an unsourced one.

| venue | field | imported | municipal | outcome |
| --- | --- | --- | --- | --- |
| `seattle-miller-playfield-pickleball-courts-capitol-hill` | total_courts | 4 | 5 | overridden |
| `seattle-miller-playfield-pickleball-courts-capitol-hill` | outdoor_courts | 4 | 5 | overridden |
| `seattle-miller-playfield-pickleball-courts-capitol-hill` | street_address | "330 19th Ave E, Seattle, WA 98112" | "330 19th Ave E" | overridden |
| `seattle-alki-playground-pickleball-and-tennis-courts` | venue_type | "dedicated_pickleball_facility" | "public_park" | overridden |
| `green-lake-pickleball-courts-seattle` | total_courts | 4 | 8 | overridden |
| `green-lake-pickleball-courts-seattle` | indoor_courts | 2 | 0 | overridden |
| `green-lake-pickleball-courts-seattle` | outdoor_courts | 2 | 8 | overridden |
| `green-lake-pickleball-courts-seattle` | street_address | "7201 Green Lake Avenue North" | "7201 E Green Lake Dr N" | overridden |
| `seattle-laurelhurst-pickleball-court-seattle-wa` | light | true | false | overridden |
| `seattle-laurelhurst-pickleball-court-seattle-wa` | venue_type | "dedicated_pickleball_facility" | "public_park" | overridden |
| `seattle-laurelhurst-pickleball-court-seattle-wa` | street_address | "4339 NE 43rd St" | "4544 NE 41st St" | overridden |

**11 values changed** across 5 venues.
