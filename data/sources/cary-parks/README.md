# Cary, NC source snapshots

These are text snapshots, not raw HTML, and that is deliberate.

carync.gov returns HTTP 403 to every scripted fetch we tried — curl and a
plain HTTP client, with and without a full set of browser headers. The pages
are public and load normally in a browser; the block is on non-browser user
agents. So the pages were read in a real browser and the extracted text is
committed here verbatim, with the URL and the retrieval date at the top of
each file.

That is weaker than the byte-for-byte JSON snapshots under data/sources/ for
Seattle and Raleigh, and it is recorded as such rather than glossed over:
a reader can re-open the URL and compare the prose, but cannot diff bytes.
Every fact published from these files quotes the sentence it came from, so
the claim and its wording travel together.

Retrieved 2026-09-03.
