# Wichita snapshots

`pickleball.txt` is the text of https://www.wichita.gov/717/Pickleball as read
in a browser on 2026-09-07, with the three tabs of its "Pickleball Court
Locations" section opened in turn and captured after the page text.

It is a text snapshot rather than an HTML one, like Cary's, because
wichita.gov (a CivicPlus site) answers HTTP 403 to every scripted request —
a bare curl, a full browser header set (`scripts/verify/fetch/lincoln.sh`)
and the web fetcher — and did so on 2026-09-04 and again on 2026-09-07. The
page loads normally in a browser, and this project does not publish from a
page it cannot re-check, so the re-check for Wichita is the same as the
first read: open the page in a browser, open each tab, and compare against
this file. `scripts/verify/apply-wichita-parks.mjs` asserts every quoted
fact against this file exactly as the HTML-based runs assert against theirs.

The header lines (URL, TITLE, PUBLISHER, RETRIEVED, METHOD) and the
`=== TAB: ... ===` markers are ours; everything between them is the page's
own text. Site navigation was omitted and is listed at the foot of the file.
