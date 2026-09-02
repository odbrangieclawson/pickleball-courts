# City triage and verification work queue

Generated from `data.csv`. Read-only.

## The headline answers

**How many cities could I publish today?**

# 0

Not one. Rule 8 requires 3+ **verified** venues and Rule 12 keeps every
row `pending` until it has a verified address, a verified court count, a
`source_url` and a `date_checked`. No row in this dataset has a
qualifying source or any date at all, so no row is verified, so no city,
county or filter page can lawfully exist.

**How many cities are gated ONLY by missing provenance?**

# 1,475

Out of 6,585 cities present in the data,
**1,475** have 3 or more rows that already pass I1, I3 and I4 in full.
Those cities need nothing except a real source and a check date attached
to their rows.

If every one of those rows were verified, it would unlock **12,786 city, filter and venue pages**
from **8,458 row verifications**.

On top of that, **961 county pages** clear the 3-venue
threshold, out of 1,604 counties holding at least one ready venue.

**Total addressable pages: 13,747.**



## Dataset-wide gate pass rates

| gate | rows passing | rate |
| --- | ---: | ---: |
| I1 Identity | 17,368 | 96.3% |
| I2 Provenance | **0** | **0.0%** |
| I3 Consistency | 13,680 | 75.8% |
| I4 Vocabulary (structural) | 18,037 | 100.0% |
| I1 + I3 + I4 together | 13,184 | 73.1% |
| **All four gates** | **0** | **0.0%** |

I4 passes broadly because the mapper refuses to write free text into a
controlled field — it nulls it instead. That makes a structural I4 pass
nearly free and nearly meaningless. Coverage is the real measure:

| controlled field | rows with a value | coverage |
| --- | ---: | ---: |
| `surface` | 3,961 | 22.0% |
| `venue_type` | 7,857 | 43.6% |
| `fee_type` | 7,747 | 43.0% |
| `access_type` | 17,916 | 99.3% |
| `play_format` | 0 | 0.0% |

## City triage table

Sorted by pages unlocked. Full table in `reports/city-triage.json` and
`reports/city-triage.csv`.

| # | city | rows | I1 | I3 | I4 | ready | pages | filters |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | Seattle, WA | 63 | 63 | 53 | 63 | 53 | 59 | indoor outdoor free public lights |
| 2 | Jacksonville, FL | 55 | 54 | 53 | 55 | 52 | 58 | indoor outdoor free public lights |
| 3 | Sacramento, CA | 55 | 51 | 55 | 55 | 51 | 56 | indoor outdoor free public |
| 4 | Lincoln, NE | 51 | 51 | 49 | 51 | 49 | 55 | indoor outdoor free public lights |
| 5 | Honolulu, HI | 43 | 43 | 42 | 43 | 42 | 48 | indoor outdoor free public lights |
| 6 | Wichita, KS | 46 | 43 | 43 | 46 | 40 | 45 | indoor outdoor public lights |
| 7 | Houston, TX | 54 | 51 | 42 | 54 | 39 | 45 | indoor outdoor free public lights |
| 8 | San Diego, CA | 39 | 39 | 37 | 39 | 37 | 43 | indoor outdoor free public lights |
| 9 | San Francisco, CA | 39 | 39 | 37 | 39 | 37 | 43 | indoor outdoor free public lights |
| 10 | Washington, DC | 36 | 36 | 36 | 36 | 36 | 42 | indoor outdoor free public lights |
| 11 | Charlotte, NC | 50 | 48 | 37 | 50 | 35 | 41 | indoor outdoor free public lights |
| 12 | Tucson, AZ | 37 | 36 | 35 | 37 | 34 | 40 | indoor outdoor free public lights |
| 13 | Omaha, NE | 41 | 39 | 36 | 41 | 34 | 40 | indoor outdoor free public lights |
| 14 | Las Vegas, NV | 41 | 40 | 35 | 41 | 34 | 40 | indoor outdoor free public lights |
| 15 | Boise, ID | 36 | 35 | 35 | 36 | 34 | 38 | indoor outdoor public |
| 16 | Denver, CO | 45 | 43 | 35 | 45 | 33 | 38 | indoor outdoor public lights |
| 17 | Portland, OR | 51 | 51 | 33 | 51 | 33 | 38 | indoor outdoor public lights |
| 18 | Austin, TX | 45 | 41 | 33 | 45 | 32 | 38 | indoor outdoor free public lights |
| 19 | Naples, FL | 38 | 37 | 33 | 38 | 32 | 37 | indoor outdoor public lights |
| 20 | Madison, WI | 37 | 36 | 33 | 37 | 32 | 37 | indoor outdoor public lights |
| 21 | Colorado Springs, CO | 34 | 32 | 33 | 34 | 31 | 37 | indoor outdoor free public lights |
| 22 | Dallas, TX | 43 | 41 | 33 | 43 | 31 | 37 | indoor outdoor free public lights |
| 23 | Knoxville, TN | 34 | 33 | 30 | 34 | 29 | 35 | indoor outdoor free public lights |
| 24 | Phoenix, AZ | 31 | 31 | 28 | 31 | 28 | 34 | indoor outdoor free public lights |
| 25 | Spokane, WA | 30 | 30 | 28 | 30 | 28 | 34 | indoor outdoor free public lights |
| 26 | Mesa, AZ | 32 | 32 | 29 | 32 | 29 | 33 | outdoor public lights |
| 27 | Indianapolis, IN | 46 | 46 | 27 | 46 | 27 | 32 | indoor outdoor free public |
| 28 | San Antonio, TX | 29 | 29 | 24 | 29 | 24 | 30 | indoor outdoor free public lights |
| 29 | Marietta, GA | 24 | 24 | 24 | 24 | 24 | 28 | indoor outdoor public |
| 30 | St. Louis, MO | 30 | 30 | 22 | 30 | 22 | 28 | indoor outdoor free public lights |
| 31 | Alexandria, VA | 31 | 30 | 23 | 31 | 22 | 28 | indoor outdoor free public lights |
| 32 | Lewes, DE | 22 | 22 | 22 | 22 | 22 | 26 | indoor outdoor public |
| 33 | Des Moines, IA | 25 | 24 | 23 | 25 | 22 | 26 | indoor outdoor public |
| 34 | Frederick, MD | 24 | 24 | 22 | 24 | 22 | 26 | indoor outdoor public |
| 35 | Atlanta, GA | 55 | 52 | 24 | 55 | 21 | 26 | indoor outdoor public lights |
| 36 | Fort Worth, TX | 28 | 28 | 21 | 28 | 21 | 26 | indoor outdoor public lights |
| 37 | St. Petersburg, FL | 22 | 21 | 21 | 22 | 20 | 26 | indoor outdoor free public lights |
| 38 | Raleigh, NC | 24 | 24 | 20 | 24 | 20 | 26 | indoor outdoor free public lights |
| 39 | Melbourne, FL | 20 | 20 | 20 | 20 | 20 | 25 | indoor outdoor public lights |
| 40 | Reno, NV | 20 | 20 | 20 | 20 | 20 | 25 | indoor outdoor public lights |
| 41 | Elk Grove, CA | 21 | 21 | 19 | 21 | 19 | 25 | indoor outdoor free public lights |
| 42 | Chicago, IL | 22 | 21 | 20 | 22 | 19 | 25 | indoor outdoor free public lights |
| 43 | Springfield, MO | 19 | 19 | 19 | 19 | 19 | 25 | indoor outdoor free public lights |
| 44 | Pittsburgh, PA | 19 | 19 | 19 | 19 | 19 | 25 | indoor outdoor free public lights |
| 45 | Virginia Beach, VA | 23 | 23 | 19 | 23 | 19 | 25 | indoor outdoor free public lights |
| 46 | Palm Desert, CA | 20 | 19 | 19 | 20 | 19 | 24 | outdoor free public lights |
| 47 | Tulsa, OK | 20 | 20 | 19 | 20 | 19 | 24 | indoor outdoor public lights |
| 48 | Asheville, NC | 18 | 18 | 18 | 18 | 18 | 24 | indoor outdoor free public lights |
| 49 | Albuquerque, NM | 21 | 20 | 19 | 21 | 18 | 24 | indoor outdoor free public lights |
| 50 | San Jose, CA | 22 | 22 | 19 | 22 | 19 | 23 | outdoor free public |
| 51 | Anchorage, AK | 23 | 19 | 22 | 23 | 18 | 23 | indoor outdoor free public |
| 52 | Ocala, FL | 19 | 19 | 18 | 19 | 18 | 23 | indoor outdoor public lights |
| 53 | Nashville, TN | 28 | 28 | 18 | 28 | 18 | 23 | indoor outdoor public lights |
| 54 | Tampa, FL | 17 | 17 | 17 | 17 | 17 | 23 | indoor outdoor free public lights |
| 55 | Fort Wayne, IN | 26 | 23 | 20 | 26 | 17 | 23 | indoor outdoor free public lights |
| 56 | Wilmington, DE | 19 | 19 | 18 | 19 | 18 | 22 | indoor outdoor public |
| 57 | Boston, MA | 21 | 21 | 18 | 21 | 18 | 22 | indoor outdoor public |
| 58 | Bradenton, FL | 19 | 18 | 18 | 19 | 17 | 22 | indoor outdoor public lights |
| 59 | Orlando, FL | 23 | 23 | 17 | 23 | 17 | 22 | indoor outdoor public lights |
| 60 | Philadelphia, PA | 20 | 20 | 17 | 20 | 17 | 22 | indoor outdoor public lights |

*Showing 60 of 6,585 cities.*

## Verification work queue — the Phase 3 to 7 set

The metros where attaching provenance unlocks the most pages. Capped at
100 by the sequencing rule: verify and publish 50-100 metros to a
complete standard, prove the template ranks, and only then release more.

Queue length: **100** metros.
Rows to verify across the queue: **2,183**.
Pages unlocked if all are verified: **2,709**.

| rank | metro | rows to verify | pages unlocked | pages per row |
| ---: | --- | ---: | ---: | ---: |
| 1 | Seattle, WA | 53 | 59 | 1.113 |
| 2 | Jacksonville, FL | 52 | 58 | 1.115 |
| 3 | Sacramento, CA | 51 | 56 | 1.098 |
| 4 | Lincoln, NE | 49 | 55 | 1.122 |
| 5 | Honolulu, HI | 42 | 48 | 1.143 |
| 6 | Houston, TX | 39 | 45 | 1.154 |
| 7 | Wichita, KS | 40 | 45 | 1.125 |
| 8 | San Diego, CA | 37 | 43 | 1.162 |
| 9 | San Francisco, CA | 37 | 43 | 1.162 |
| 10 | Washington, DC | 36 | 42 | 1.167 |
| 11 | Charlotte, NC | 35 | 41 | 1.171 |
| 12 | Tucson, AZ | 34 | 40 | 1.176 |
| 13 | Omaha, NE | 34 | 40 | 1.176 |
| 14 | Las Vegas, NV | 34 | 40 | 1.176 |
| 15 | Austin, TX | 32 | 38 | 1.188 |
| 16 | Denver, CO | 33 | 38 | 1.152 |
| 17 | Portland, OR | 33 | 38 | 1.152 |
| 18 | Boise, ID | 34 | 38 | 1.118 |
| 19 | Colorado Springs, CO | 31 | 37 | 1.194 |
| 20 | Dallas, TX | 31 | 37 | 1.194 |
| 21 | Naples, FL | 32 | 37 | 1.156 |
| 22 | Madison, WI | 32 | 37 | 1.156 |
| 23 | Knoxville, TN | 29 | 35 | 1.207 |
| 24 | Phoenix, AZ | 28 | 34 | 1.214 |
| 25 | Spokane, WA | 28 | 34 | 1.214 |
| 26 | Mesa, AZ | 29 | 33 | 1.138 |
| 27 | Indianapolis, IN | 27 | 32 | 1.185 |
| 28 | San Antonio, TX | 24 | 30 | 1.25 |
| 29 | St. Louis, MO | 22 | 28 | 1.273 |
| 30 | Alexandria, VA | 22 | 28 | 1.273 |
| 31 | Marietta, GA | 24 | 28 | 1.167 |
| 32 | St. Petersburg, FL | 20 | 26 | 1.3 |
| 33 | Raleigh, NC | 20 | 26 | 1.3 |
| 34 | Atlanta, GA | 21 | 26 | 1.238 |
| 35 | Fort Worth, TX | 21 | 26 | 1.238 |
| 36 | Lewes, DE | 22 | 26 | 1.182 |
| 37 | Des Moines, IA | 22 | 26 | 1.182 |
| 38 | Frederick, MD | 22 | 26 | 1.182 |
| 39 | Elk Grove, CA | 19 | 25 | 1.316 |
| 40 | Chicago, IL | 19 | 25 | 1.316 |
| 41 | Springfield, MO | 19 | 25 | 1.316 |
| 42 | Pittsburgh, PA | 19 | 25 | 1.316 |
| 43 | Virginia Beach, VA | 19 | 25 | 1.316 |
| 44 | Melbourne, FL | 20 | 25 | 1.25 |
| 45 | Reno, NV | 20 | 25 | 1.25 |
| 46 | Asheville, NC | 18 | 24 | 1.333 |
| 47 | Albuquerque, NM | 18 | 24 | 1.333 |
| 48 | Palm Desert, CA | 19 | 24 | 1.263 |
| 49 | Tulsa, OK | 19 | 24 | 1.263 |
| 50 | Tampa, FL | 17 | 23 | 1.353 |
| 51 | Fort Wayne, IN | 17 | 23 | 1.353 |
| 52 | Anchorage, AK | 18 | 23 | 1.278 |
| 53 | Ocala, FL | 18 | 23 | 1.278 |
| 54 | Nashville, TN | 18 | 23 | 1.278 |
| 55 | San Jose, CA | 19 | 23 | 1.211 |
| 56 | Scottsdale, AZ | 16 | 22 | 1.375 |
| 57 | Lexington, KY | 16 | 22 | 1.375 |
| 58 | Louisville, KY | 16 | 22 | 1.375 |
| 59 | Bradenton, FL | 17 | 22 | 1.294 |
| 60 | Orlando, FL | 17 | 22 | 1.294 |
| 61 | Philadelphia, PA | 17 | 22 | 1.294 |
| 62 | Vancouver, WA | 17 | 22 | 1.294 |
| 63 | Wilmington, DE | 18 | 22 | 1.222 |
| 64 | Boston, MA | 18 | 22 | 1.222 |
| 65 | Charleston, SC | 15 | 21 | 1.4 |
| 66 | Carmel, IN | 16 | 21 | 1.313 |
| 67 | Rochester, NY | 16 | 21 | 1.313 |
| 68 | Columbus, OH | 16 | 21 | 1.313 |
| 69 | Aurora, CO | 17 | 21 | 1.235 |
| 70 | Fort Collins, CO | 15 | 20 | 1.333 |
| 71 | Gainesville, FL | 15 | 20 | 1.333 |
| 72 | Baton Rouge, LA | 15 | 20 | 1.333 |
| 73 | Rockville, MD | 15 | 20 | 1.333 |
| 74 | Myrtle Beach, SC | 15 | 20 | 1.333 |
| 75 | Boynton Beach, FL | 16 | 20 | 1.25 |
| 76 | Fort Myers, FL | 16 | 20 | 1.25 |
| 77 | Miami, FL | 17 | 20 | 1.176 |
| 78 | Greensboro, NC | 13 | 19 | 1.462 |
| 79 | Medford, OR | 13 | 19 | 1.462 |
| 80 | El Paso, TX | 13 | 19 | 1.462 |
| 81 | Henderson, NV | 14 | 19 | 1.357 |
| 82 | New York, NY | 14 | 19 | 1.357 |
| 83 | Klamath Falls, OR | 14 | 19 | 1.357 |
| 84 | The Woodlands, TX | 14 | 19 | 1.357 |
| 85 | Orem, UT | 14 | 19 | 1.357 |
| 86 | Huntsville, AL | 15 | 19 | 1.267 |
| 87 | Peoria, AZ | 15 | 19 | 1.267 |
| 88 | Canton, OH | 12 | 18 | 1.5 |
| 89 | Plano, TX | 12 | 18 | 1.5 |
| 90 | Redmond, WA | 12 | 18 | 1.5 |
| 91 | Newark, DE | 13 | 18 | 1.385 |
| 92 | Tallahassee, FL | 13 | 18 | 1.385 |
| 93 | Poughkeepsie, NY | 13 | 18 | 1.385 |
| 94 | Arlington, TX | 13 | 18 | 1.385 |
| 95 | Bakersfield, CA | 12 | 17 | 1.417 |
| 96 | Overland Park, KS | 12 | 17 | 1.417 |
| 97 | Silver Spring, MD | 12 | 17 | 1.417 |
| 98 | Santa Fe, NM | 12 | 17 | 1.417 |
| 99 | Salem, OR | 12 | 17 | 1.417 |
| 100 | Salt Lake City, UT | 12 | 17 | 1.417 |
