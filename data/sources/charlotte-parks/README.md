# Charlotte / Mecklenburg County source snapshots

Two sources, one of them a text snapshot for the usual reason.

`mecknc-courts.txt` is extracted page text. parkandrec.mecknc.gov returns
HTTP 403 to scripted fetches, and so does the county's GIS server at
meckgis.mecklenburgcountync.gov. The page is public and loads normally in a
browser, so it was read in one and committed verbatim with URL and retrieval
date at the head of the file. Same treatment as Cary and Apex.

`charlotte-parks-opendata.json` is a genuine machine-readable snapshot,
trimmed from the 376-park City of Charlotte Open Data parks layer to the
seven parks the pickleball page names. That layer is reachable without a
browser and supplies the address, postcode and coordinates for each park.

## The counts are enumerated, not stated and not derived

Mecklenburg does not print "Clarks Creek Park: 8 courts". It lists individual
numbered courts, split between reservable and open play:

    Clarks Creek Park: Courts 1-5   (reservable)
    Clarks Creek Park: Courts 6-8   (open play)

A park's count is the number of distinct court numbers the county names
there. That is reading a list of identified courts, which is a different act
from Sacramento's withdrawn derivation — there we counted anonymous map
points and guessed what each one meant; here the operator names court 1,
court 2, court 3 and so on.

The internal check is that every park's numbers form exactly one complete
consecutive run, with no gaps and no number appearing in both lists:

    Clarks Creek  1-5 + 6-8        = 1-8    8 courts
    Clanton       1-4 + 5&6        = 1-6    6 courts
    Freedom       11,12,14,15 + 13,16 = 11-16  6 courts
    MLK           2,3,5,6 + 1&4    = 1-6    6 courts
    Beatty        2&3 + 1          = 1-3    3 courts

Freedom Park is the one worth looking at twice: its pickleball courts are
numbered 11 to 16 because courts 1 to 10 at that park are tennis, listed
separately on the same page. The two interleaved lists still reconstruct a
complete 11-16 with nothing missing and nothing counted twice.

The verification run asserts every one of those lines is still present in the
snapshot before it publishes the number derived from it, and re-derives the
count from the text rather than from a number typed into the script.

Retrieved 2026-09-03.
