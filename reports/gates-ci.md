# CI gate run

```

=== IMPORT GATES — census over every imported row ===

rows examined:            18,091
rows passing all four:    119

gate  what it checks                                        failing
----  ----------------------------------------------------  -------
I1    identity: slug shape, name, city, state, address           717
I2    provenance: source_url, date_checked, verified_by        17972
I3    consistency: court arithmetic, county, court count        4387
I4    vocabulary: controlled values in filtered fields             0

I2 dominates and that is the known state of the project, not a
regression: no imported row carries provenance until someone verifies
it. These are reported, not enforced. What IS enforced is below.

rows marked published while failing a gate (bypass): 0

=== PAGE GATES — every page in the sitemap ===

page type   pages  pass   G1    G2    G3    G4    G5    G6
---------   -----  ----   ---   ---   ---   ---   ---   ---
state           2     2     2     2     2     2     2     2
county          8     8     8     8     8     8     8     8
city           11    11    11    11    11    11    11    11
filter         18    18    18    18    18    18    18    18
venue         119   119   119   119   119   119   119   119

published pages passing all six: 158/158
```
