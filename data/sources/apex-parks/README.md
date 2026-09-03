# Apex, NC source snapshots

Text snapshots, not raw HTML, for the same reason as Cary — and a worse
block. carync.gov returns HTTP 403 to scripted fetches; apexnc.org does not
answer them at all, returning a connection failure (curl exit 28, no status
line) with or without a full browser header set. The pages are public and
load normally in a browser.

So they were read in a browser and the extracted text is committed here
verbatim, with the URL and retrieval date at the head of each file.

This is weaker than the byte-exact JSON snapshots under data/sources/ for
Seattle and Raleigh: a reader can re-open the URL and compare the prose, but
cannot diff bytes. The verification run compensates the same way Cary's
does — before publishing any number it asserts that the exact sentence
containing it is still present in the snapshot, so a reworded page fails the
run loudly instead of shipping a stale figure.

Apex is the strongest of the three prose sources, because the town publishes
an actual table: facility, indoor or outdoor, lights, and number of courts,
in one place — and each park's own page repeats its count independently.
Every count below is therefore corroborated twice by the same publisher.

Retrieved 2026-09-03.
