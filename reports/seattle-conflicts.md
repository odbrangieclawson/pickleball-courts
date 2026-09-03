# Seattle verification — what the municipal source changed

Run 2026-09-03. 24 venues, tier 2, verified_by = municipal_source.

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
| `seattle-discovery-park-tennis-and-pickleball-courts` | street_address | "3801 Discovery Park Blvd." | "3801 Discovery Park Blvd" | overridden |
| `seattle-beacon-hill-playground-tennis-courts-seattle-wa` | venue_type | "community_center" | "public_park" | overridden |
| `seattle-observatory-courts-queen-anne-seattle-wa` | total_courts | 4 | 2 | overridden |
| `seattle-observatory-courts-queen-anne-seattle-wa` | outdoor_courts | 4 | 2 | overridden |
| `seattle-observatory-courts-queen-anne-seattle-wa` | venue_type | "community_center" | "public_park" | overridden |
| `seattle-observatory-courts-queen-anne-seattle-wa` | street_address | "1405 Warren Ave. N" | "1405 Warren Ave N" | overridden |
| `bitter-lake-pickleball-and-tennis-courts` | total_courts | 11 | 8 | overridden |
| `bitter-lake-pickleball-and-tennis-courts` | indoor_courts | 3 | 0 | overridden |
| `bitter-lake-pickleball-and-tennis-courts` | street_address | "130th Ave NW and Fremont" | "13035 Linden Ave N" | overridden |
| `seattle-georgetown-playfield-tennis-and-pickleball-courts` | street_address | "750 S Homer St." | "750 S Homer St" | overridden |
| `seattle-dearborn-park-seattle-wa` | total_courts | 2 | 4 | overridden |
| `seattle-dearborn-park-seattle-wa` | outdoor_courts | 2 | 4 | overridden |
| `seattle-south-park-playground-tennis-and-pickleball-courts` | total_courts | 2 | 1 | overridden |
| `seattle-south-park-playground-tennis-and-pickleball-courts` | outdoor_courts | 2 | 1 | overridden |
| `seattle-south-park-playground-tennis-and-pickleball-courts` | street_address | "8319 8th Ave S" | "738 S Sullivan St" | overridden |
| `seattle-gilman-playground-pickleball-and-tennis-courts` | venue_type | "dedicated_pickleball_facility" | "public_park" | overridden |
| `delridge-pickleball-and-tennis-courts` | total_courts | 7 | 4 | overridden |
| `delridge-pickleball-and-tennis-courts` | indoor_courts | 3 | 0 | overridden |
| `delridge-pickleball-and-tennis-courts` | street_address | "4501 Delridge Way, SW" | "4458 Delridge Way SW" | overridden |
| `seattle-kinnear-park-queen-anne-seattle-wa` | total_courts | 3 | 1 | overridden |
| `seattle-kinnear-park-queen-anne-seattle-wa` | outdoor_courts | 3 | 1 | overridden |
| `seattle-kinnear-park-queen-anne-seattle-wa` | street_address | "899 W Olympic Pl." | "899 W Olumpic Pl" | overridden |
| `seattle-rainier-beach-playfield-seattle-wa` | street_address | "4550 S Henderson St" | "4707 S Cloverdale St" | overridden |
| `seattle-soundview-playfield-tennis-and-pickleball-courts` | street_address | "1590 NW 90th St." | "1590 NW 90th St" | overridden |
| `seattle-lakeridge-playfield-pickleball-and-badminton-courts` | street_address | "10145 Rainier Ave S." | "10145 Rainier Ave S" | overridden |
| `seattle-mount-baker-pickleball-and-tennis-courts-seattle-wa` | venue_type | "dedicated_pickleball_facility" | "public_park" | overridden |
| `seattle-mount-baker-pickleball-and-tennis-courts-seattle-wa` | street_address | "Lake Park Dr S" | "2521 Lake Park Dr S" | overridden |

**38 values changed** across 24 venues.
