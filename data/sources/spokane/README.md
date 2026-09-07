# Spokane snapshots

`fields-and-sports.txt` is the text of
https://my.spokanecity.org/recreation/facilities/fields-and-sports/ as read
in a browser on 2026-09-07, with the collapsed "Tennis and Pickleball
Courts" section captured from the rendered DOM and placed between
`=== SECTION` markers.

It is a text snapshot rather than an HTML one, like Cary's and Wichita's,
because my.spokanecity.org answers every scripted request — a bare curl,
the full browser header set in `scripts/verify/fetch/lincoln.sh`, and the
web fetcher — with a 302 into a "Checking Your Browser" interstitial. It did
so on 2026-09-04 (recorded in PHASES.md as the most valuable page in
Washington the project could not read) and again on 2026-09-07. The page
loads normally in a browser. The re-check for Spokane is therefore a
browser read: open the page, expand "Tennis and Pickleball Courts", and
compare against this file. `scripts/verify/apply-spokane-parks.mjs`
asserts every quoted line against this file.

The header lines and the `=== SECTION` markers are ours; everything else
is the page's own text. Site navigation was omitted.
