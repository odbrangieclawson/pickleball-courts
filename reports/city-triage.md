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

# 1,797

Out of 6,585 cities present in the data,
**1,797** have 3 or more rows that already pass I1, I3-minus-county
and I4. Those cities need nothing except a real source and a check date
attached to their rows.

If every one of those rows were verified, it would unlock **15,652 pages**
from **10,399 row verifications**.

That figure excludes county pages entirely, because `county` cannot be
derived yet — see `reports/county-status.md`.

## Dataset-wide gate pass rates

| gate | rows passing | rate |
| --- | ---: | ---: |
| I1 Identity | 17,368 | 96.3% |
| I2 Provenance | **0** | **0.0%** |
| I3 Consistency (minus county) | 16,900 | 93.7% |
| I4 Vocabulary (structural) | 18,037 | 100.0% |
| I1 + I3 + I4 together | 16,272 | 90.2% |
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
| 1 | Jacksonville, FL | 55 | 54 | 54 | 55 | 53 | 59 | indoor outdoor free public lights |
| 2 | Seattle, WA | 63 | 63 | 53 | 63 | 53 | 59 | indoor outdoor free public lights |
| 3 | Sacramento, CA | 55 | 51 | 55 | 55 | 51 | 56 | indoor outdoor free public |
| 4 | Lincoln, NE | 51 | 51 | 49 | 51 | 49 | 55 | indoor outdoor free public lights |
| 5 | Atlanta, GA | 55 | 52 | 49 | 55 | 46 | 52 | indoor outdoor free public lights |
| 6 | Charlotte, NC | 50 | 48 | 47 | 50 | 45 | 51 | indoor outdoor free public lights |
| 7 | Indianapolis, IN | 46 | 46 | 44 | 46 | 44 | 50 | indoor outdoor free public lights |
| 8 | Honolulu, HI | 43 | 43 | 43 | 43 | 43 | 49 | indoor outdoor free public lights |
| 9 | Wichita, KS | 46 | 43 | 46 | 46 | 43 | 48 | indoor outdoor public lights |
| 10 | Portland, OR | 51 | 51 | 42 | 51 | 42 | 48 | indoor outdoor free public lights |
| 11 | Houston, TX | 54 | 51 | 44 | 54 | 41 | 47 | indoor outdoor free public lights |
| 12 | San Francisco, CA | 39 | 39 | 39 | 39 | 39 | 45 | indoor outdoor free public lights |
| 13 | Denver, CO | 45 | 43 | 41 | 45 | 39 | 45 | indoor outdoor free public lights |
| 14 | Omaha, NE | 41 | 39 | 40 | 41 | 38 | 44 | indoor outdoor free public lights |
| 15 | San Diego, CA | 39 | 39 | 37 | 39 | 37 | 43 | indoor outdoor free public lights |
| 16 | Washington, DC | 36 | 36 | 36 | 36 | 36 | 42 | indoor outdoor free public lights |
| 17 | The Villages, FL | 39 | 39 | 38 | 39 | 38 | 41 | outdoor public |
| 18 | Tucson, AZ | 37 | 36 | 36 | 37 | 35 | 41 | indoor outdoor free public lights |
| 19 | Naples, FL | 38 | 37 | 36 | 38 | 35 | 40 | indoor outdoor public lights |
| 20 | Las Vegas, NV | 41 | 40 | 35 | 41 | 34 | 40 | indoor outdoor free public lights |
| 21 | Austin, TX | 45 | 41 | 36 | 45 | 34 | 40 | indoor outdoor free public lights |
| 22 | Boise, ID | 36 | 35 | 36 | 36 | 35 | 39 | indoor outdoor public |
| 23 | Madison, WI | 37 | 36 | 34 | 37 | 33 | 38 | indoor outdoor public lights |
| 24 | Knoxville, TN | 34 | 33 | 33 | 34 | 32 | 38 | indoor outdoor free public lights |
| 25 | Dallas, TX | 43 | 41 | 34 | 43 | 32 | 38 | indoor outdoor free public lights |
| 26 | Colorado Springs, CO | 34 | 32 | 33 | 34 | 31 | 37 | indoor outdoor free public lights |
| 27 | Alexandria, VA | 31 | 30 | 31 | 31 | 30 | 36 | indoor outdoor free public lights |
| 28 | Spokane, WA | 30 | 30 | 29 | 30 | 29 | 35 | indoor outdoor free public lights |
| 29 | Mesa, AZ | 32 | 32 | 30 | 32 | 30 | 34 | outdoor public lights |
| 30 | Phoenix, AZ | 31 | 31 | 28 | 31 | 28 | 34 | indoor outdoor free public lights |
| 31 | St. Louis, MO | 30 | 30 | 28 | 30 | 28 | 34 | indoor outdoor free public lights |
| 32 | Roanoke, VA | 28 | 28 | 28 | 28 | 28 | 34 | indoor outdoor free public lights |
| 33 | Aurora, CO | 28 | 27 | 27 | 28 | 26 | 30 | indoor outdoor public |
| 34 | Fort Worth, TX | 28 | 28 | 25 | 28 | 25 | 30 | indoor outdoor public lights |
| 35 | Louisville, KY | 31 | 30 | 25 | 31 | 24 | 30 | indoor outdoor free public lights |
| 36 | San Antonio, TX | 29 | 29 | 24 | 29 | 24 | 30 | indoor outdoor free public lights |
| 37 | Charlottesville, VA | 25 | 24 | 24 | 25 | 24 | 29 | indoor outdoor public lights |
| 38 | Fort Wayne, IN | 26 | 23 | 26 | 26 | 23 | 29 | indoor outdoor free public lights |
| 39 | Marietta, GA | 24 | 24 | 24 | 24 | 24 | 28 | indoor outdoor public |
| 40 | Des Moines, IA | 25 | 24 | 25 | 25 | 24 | 28 | indoor outdoor public |
| 41 | Nashville, TN | 28 | 28 | 23 | 28 | 23 | 28 | indoor outdoor public lights |
| 42 | Appleton, WI | 25 | 24 | 24 | 25 | 23 | 28 | indoor outdoor public lights |
| 43 | Virginia Beach, VA | 23 | 23 | 22 | 23 | 22 | 28 | indoor outdoor free public lights |
| 44 | Raleigh, NC | 24 | 24 | 21 | 24 | 21 | 27 | indoor outdoor free public lights |
| 45 | Richmond, VA | 23 | 23 | 21 | 23 | 21 | 27 | indoor outdoor free public lights |
| 46 | Lewes, DE | 22 | 22 | 22 | 22 | 22 | 26 | indoor outdoor public |
| 47 | Frederick, MD | 24 | 24 | 22 | 24 | 22 | 26 | indoor outdoor public |
| 48 | St. Petersburg, FL | 22 | 21 | 21 | 22 | 20 | 26 | indoor outdoor free public lights |
| 49 | Chicago, IL | 22 | 21 | 21 | 22 | 20 | 26 | indoor outdoor free public lights |
| 50 | Melbourne, FL | 20 | 20 | 20 | 20 | 20 | 25 | indoor outdoor public lights |
| 51 | Reno, NV | 20 | 20 | 20 | 20 | 20 | 25 | indoor outdoor public lights |
| 52 | Tulsa, OK | 20 | 20 | 20 | 20 | 20 | 25 | indoor outdoor public lights |
| 53 | Elk Grove, CA | 21 | 21 | 19 | 21 | 19 | 25 | indoor outdoor free public lights |
| 54 | Springfield, MO | 19 | 19 | 19 | 19 | 19 | 25 | indoor outdoor free public lights |
| 55 | Pittsburgh, PA | 19 | 19 | 19 | 19 | 19 | 25 | indoor outdoor free public lights |
| 56 | Palm Desert, CA | 20 | 19 | 19 | 20 | 19 | 24 | outdoor free public lights |
| 57 | Orlando, FL | 23 | 23 | 19 | 23 | 19 | 24 | indoor outdoor public lights |
| 58 | Philadelphia, PA | 20 | 20 | 19 | 20 | 19 | 24 | indoor outdoor public lights |
| 59 | Lexington, KY | 22 | 21 | 19 | 22 | 18 | 24 | indoor outdoor free public lights |
| 60 | Asheville, NC | 18 | 18 | 18 | 18 | 18 | 24 | indoor outdoor free public lights |

*Showing 60 of 6,585 cities.*

## Verification work queue — the Phase 3 to 7 set

The metros where attaching provenance unlocks the most pages. Capped at
100 by the sequencing rule: verify and publish 50-100 metros to a
complete standard, prove the template ranks, and only then release more.

Queue length: **100** metros.
Rows to verify across the queue: **2,452**.
Pages unlocked if all are verified: **2,983**.

| rank | metro | rows to verify | pages unlocked | pages per row |
| ---: | --- | ---: | ---: | ---: |
| 1 | Jacksonville, FL | 53 | 59 | 1.113 |
| 2 | Seattle, WA | 53 | 59 | 1.113 |
| 3 | Sacramento, CA | 51 | 56 | 1.098 |
| 4 | Lincoln, NE | 49 | 55 | 1.122 |
| 5 | Atlanta, GA | 46 | 52 | 1.13 |
| 6 | Charlotte, NC | 45 | 51 | 1.133 |
| 7 | Indianapolis, IN | 44 | 50 | 1.136 |
| 8 | Honolulu, HI | 43 | 49 | 1.14 |
| 9 | Portland, OR | 42 | 48 | 1.143 |
| 10 | Wichita, KS | 43 | 48 | 1.116 |
| 11 | Houston, TX | 41 | 47 | 1.146 |
| 12 | San Francisco, CA | 39 | 45 | 1.154 |
| 13 | Denver, CO | 39 | 45 | 1.154 |
| 14 | Omaha, NE | 38 | 44 | 1.158 |
| 15 | San Diego, CA | 37 | 43 | 1.162 |
| 16 | Washington, DC | 36 | 42 | 1.167 |
| 17 | Tucson, AZ | 35 | 41 | 1.171 |
| 18 | The Villages, FL | 38 | 41 | 1.079 |
| 19 | Las Vegas, NV | 34 | 40 | 1.176 |
| 20 | Austin, TX | 34 | 40 | 1.176 |
| 21 | Naples, FL | 35 | 40 | 1.143 |
| 22 | Boise, ID | 35 | 39 | 1.114 |
| 23 | Knoxville, TN | 32 | 38 | 1.188 |
| 24 | Dallas, TX | 32 | 38 | 1.188 |
| 25 | Madison, WI | 33 | 38 | 1.152 |
| 26 | Colorado Springs, CO | 31 | 37 | 1.194 |
| 27 | Alexandria, VA | 30 | 36 | 1.2 |
| 28 | Spokane, WA | 29 | 35 | 1.207 |
| 29 | Phoenix, AZ | 28 | 34 | 1.214 |
| 30 | St. Louis, MO | 28 | 34 | 1.214 |
| 31 | Roanoke, VA | 28 | 34 | 1.214 |
| 32 | Mesa, AZ | 30 | 34 | 1.133 |
| 33 | Louisville, KY | 24 | 30 | 1.25 |
| 34 | San Antonio, TX | 24 | 30 | 1.25 |
| 35 | Fort Worth, TX | 25 | 30 | 1.2 |
| 36 | Aurora, CO | 26 | 30 | 1.154 |
| 37 | Fort Wayne, IN | 23 | 29 | 1.261 |
| 38 | Charlottesville, VA | 24 | 29 | 1.208 |
| 39 | Virginia Beach, VA | 22 | 28 | 1.273 |
| 40 | Nashville, TN | 23 | 28 | 1.217 |
| 41 | Appleton, WI | 23 | 28 | 1.217 |
| 42 | Marietta, GA | 24 | 28 | 1.167 |
| 43 | Des Moines, IA | 24 | 28 | 1.167 |
| 44 | Raleigh, NC | 21 | 27 | 1.286 |
| 45 | Richmond, VA | 21 | 27 | 1.286 |
| 46 | St. Petersburg, FL | 20 | 26 | 1.3 |
| 47 | Chicago, IL | 20 | 26 | 1.3 |
| 48 | Lewes, DE | 22 | 26 | 1.182 |
| 49 | Frederick, MD | 22 | 26 | 1.182 |
| 50 | Elk Grove, CA | 19 | 25 | 1.316 |
| 51 | Springfield, MO | 19 | 25 | 1.316 |
| 52 | Pittsburgh, PA | 19 | 25 | 1.316 |
| 53 | Melbourne, FL | 20 | 25 | 1.25 |
| 54 | Reno, NV | 20 | 25 | 1.25 |
| 55 | Tulsa, OK | 20 | 25 | 1.25 |
| 56 | Lexington, KY | 18 | 24 | 1.333 |
| 57 | Asheville, NC | 18 | 24 | 1.333 |
| 58 | Albuquerque, NM | 18 | 24 | 1.333 |
| 59 | Palm Desert, CA | 19 | 24 | 1.263 |
| 60 | Orlando, FL | 19 | 24 | 1.263 |
| 61 | Philadelphia, PA | 19 | 24 | 1.263 |
| 62 | Tampa, FL | 17 | 23 | 1.353 |
| 63 | Cincinnati, OH | 17 | 23 | 1.353 |
| 64 | Anchorage, AK | 18 | 23 | 1.278 |
| 65 | Ocala, FL | 18 | 23 | 1.278 |
| 66 | Columbus, OH | 18 | 23 | 1.278 |
| 67 | Vancouver, WA | 18 | 23 | 1.278 |
| 68 | San Jose, CA | 19 | 23 | 1.211 |
| 69 | Scottsdale, AZ | 16 | 22 | 1.375 |
| 70 | Charleston, SC | 16 | 22 | 1.375 |
| 71 | Plano, TX | 16 | 22 | 1.375 |
| 72 | Bradenton, FL | 17 | 22 | 1.294 |
| 73 | Rochester, NY | 17 | 22 | 1.294 |
| 74 | Salem, OR | 17 | 22 | 1.294 |
| 75 | Wilmington, DE | 18 | 22 | 1.222 |
| 76 | Boston, MA | 18 | 22 | 1.222 |
| 77 | Sarasota, FL | 15 | 21 | 1.4 |
| 78 | Cary, NC | 15 | 21 | 1.4 |
| 79 | Tacoma, WA | 15 | 21 | 1.4 |
| 80 | Fort Collins, CO | 16 | 21 | 1.313 |
| 81 | Carmel, IN | 16 | 21 | 1.313 |
| 82 | Rockville, MD | 16 | 21 | 1.313 |
| 83 | Silver Spring, MD | 16 | 21 | 1.313 |
| 84 | Henderson, NV | 16 | 21 | 1.313 |
| 85 | Bellingham, WA | 16 | 21 | 1.313 |
| 86 | Gainesville, FL | 15 | 20 | 1.333 |
| 87 | Baton Rouge, LA | 15 | 20 | 1.333 |
| 88 | New York, NY | 15 | 20 | 1.333 |
| 89 | Myrtle Beach, SC | 15 | 20 | 1.333 |
| 90 | Huntsville, AL | 16 | 20 | 1.25 |
| 91 | Boynton Beach, FL | 16 | 20 | 1.25 |
| 92 | Fort Myers, FL | 16 | 20 | 1.25 |
| 93 | Nampa, ID | 16 | 20 | 1.25 |
| 94 | Minneapolis, MN | 16 | 20 | 1.25 |
| 95 | Miami, FL | 17 | 20 | 1.176 |
| 96 | Greensboro, NC | 13 | 19 | 1.462 |
| 97 | Medford, OR | 13 | 19 | 1.462 |
| 98 | El Paso, TX | 13 | 19 | 1.462 |
| 99 | Littleton, CO | 14 | 19 | 1.357 |
| 100 | Cedar Rapids, IA | 14 | 19 | 1.357 |
