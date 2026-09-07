# Spokane verification - a page behind a browser check, read in a browser

Run 2026-09-07. 6 venues published, 36 courts (32 striped on tennis courts, 4 dedicated). 1 venue refused.

Spokane is the fifth city in Washington on this site and the first in Spokane County. Its source is a
text snapshot read in a browser, because my.spokanecity.org answers every scripted fetch with a 302 into
a "Checking Your Browser" interstitial; see `data/sources/spokane/README.md`. Every line of all three
lists in the Tennis and Pickleball Courts section is asserted against that file, in order.

| venue | courts | list | what the City writes | tennis line |
| --- | ---: | --- | --- | --- |
| `am-cannon-park` | 2 | striped | "A.M. Cannon Park, 1511 N. Elm St., 2 Courts" | "A.M. Cannon Park, 1511 N. Elm St., 2 Courts" |
| `comstock-park` | 12 | striped | "Comstock Park, 601 W. 29th Ave., 12 Courts" | "Comstock Park, 601 W. 29th Ave., 6 Courts" |
| `mission-park` | 16 | striped | "Mission Park, 1208 E. Mission Ave., 16 Courts" | "Mission Park, 1208 E. Mission Ave., 8 Courts" |
| `peaceful-valley-park` | 2 | striped | "Peaceful Valley Park, 1602 W. Water Ave., 2 Courts" | "Peaceful Valley Park, 1602 W. Water Ave., 1 Court" |
| `corbin-park` | 2 | dedicated | "Corbin Park, 2914 N. West Oval St, 2 Courts" | "Corbin Park, 2914 N. West Oval St, 1 Court" |
| `underhill-park` | 2 | dedicated | "Underhill Park, 2910 E. Hartson Ave., 2 Courts" | - |

## Striped means two numbers, and the pickleball one publishes

Comstock has "6 Courts" on the Tennis Courts list and "12 Courts" on the striped list; Mission has "8"
and "16"; Peaceful Valley "1" and "2"; A.M. Cannon "2" and "2". The pickleball number is the operator's
stated pickleball count and publishes as stated. The tennis number is quoted in each venue's note so a
reader knows the courts are shared with tennis.

## Corbin's tennis court is not a pickleball court

"Corbin Park, 2914 N. West Oval St, 1 Court" is on the Tennis Courts list and "Corbin Park, 2914 N. West
Oval St, 2 Courts" on the Dedicated Pickleball Courts list. Two publishes; the tennis court is a different
sport.

## Nothing is indoor, outdoor, lit, surfaced or priced

The City does not write "outdoor", "lit", a surface or a price anywhere in the section, so every one of
those fields is null on every venue. "Tennis & Pickleball courts are first-come-first-served" publishes
as open play, and the reservation permit as a pricing note without a price. No venue is published as free.

## Refused

**Sky Prairie Park** - "Sky Prairie Park, 8501 N. Nettleton Ct., 2 Courts"

1. The City states two pickleball courts and an address, "Sky Prairie Park, 8501 N. Nettleton Ct., 2 Courts", and the address does not resolve. The Census address geocoder returns no match for 8501 N Nettleton Ct, Spokane, WA, and OpenStreetMap has no house number for it. Import Gate I1 requires an address that resolves as written at house-number level; this project has never published one that does not, and has never taken an address from outside the operator.
2. The count is real and the refusal is on the address alone. This run throws the day either resolver matches it, so the venue cannot stay refused once it is publishable.

## Imported rows left pending

- **Grant Park** (imported as one pickleball court at 1015 South Arthur Street) is on the City's Tennis
  Courts list only, "Grant Park, 1015 S. Arthur St., 2 Courts", and on neither pickleball list. Not published.
- **Sky Prairie Park** (imported as four courts) is refused above; the City says two.
- Schools, clubs, churches and gyms in the imported rows are not on the City's page and stay pending.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `comstock-park` | total_courts | 4 | 12 | overridden |
| `comstock-park` | street_address | "3012 S Howard St" | "601 W 29th Ave" | overridden |
| `comstock-park` | pricing_notes | "Free public play" | "Courts are first-come-first-served. A court can be officially reserved with a reservation permit by online form; the City publishes no price for the permit and does not say the courts are free." | overridden |
| `mission-park` | pricing_notes | "Free public play" | "Courts are first-come-first-served. A court can be officially reserved with a reservation permit by online form; the City publishes no price for the permit and does not say the courts are free." | overridden |
| `peaceful-valley-park` | street_address | "100-198 N Maple St" | "1602 W Water Ave" | overridden |
| `peaceful-valley-park` | pricing_notes | "Free public play" | "Courts are first-come-first-served. A court can be officially reserved with a reservation permit by online form; the City publishes no price for the permit and does not say the courts are free." | overridden |
| `corbin-park` | street_address | "501 West Park Place" | "2914 N West Oval St" | overridden |
| `corbin-park` | pricing_notes | "Public" | "Courts are first-come-first-served. A court can be officially reserved with a reservation permit by online form; the City publishes no price for the permit and does not say the courts are free." | overridden |
| `underhill-park` | pricing_notes | "Public - Dedicated" | "Courts are first-come-first-served. A court can be officially reserved with a reservation permit by online form; the City publishes no price for the permit and does not say the courts are free." | overridden |
