# Henderson snapshots

Three text snapshots of cityofhenderson.com, read in a browser on
2026-09-07:

- `pickleball.txt` — the City's Pickleball page, whose "Court Locations"
  section is five small tables of facility name and "NUMBER OF COURTS".
  Each table is placed between `=== TABLE` markers, one facility per line.
- `park-locations.txt` — the entries from the four-page "Park Locations
  and Features" directory for the parks named on the Pickleball page, with
  the address block exactly as the directory prints it.
- `recreation-centers.txt` — the facility-directory pages for the three
  recreation centers the Pickleball page counts (Black Mountain, Downtown,
  Silver Springs), between `=== FACILITY` markers.

They are text snapshots rather than HTML ones, like Cary's, Wichita's and
Spokane's, because cityofhenderson.com answers HTTP 403 to every scripted
request — a bare curl and the full browser header set in
`scripts/verify/fetch/lincoln.sh` — on 2026-09-07. The pages load normally
in a browser. The re-check for Henderson is therefore a browser read: open
each page, and compare against these files. `scripts/verify/apply-henderson-parks.mjs`
asserts every quoted line against them.

The header lines and the `=== TABLE` / `=== PAGE` / `=== FACILITY` markers
are ours; everything else is the page's own text. Site navigation was
omitted.
