# CI gate run

```

=== IMPORT GATES — census over every imported row ===

rows examined:            18,188
rows passing all four:    282

gate  what it checks                                        failing
----  ----------------------------------------------------  -------
I1    identity: slug shape, name, city, state, address           715
I2    provenance: source_url, date_checked, verified_by        17906
I3    consistency: court arithmetic, county, court count        4381
I4    vocabulary: controlled values in filtered fields             0

I2 dominates and that is the known state of the project, not a
regression: no imported row carries provenance until someone verifies
it. These are reported, not enforced. What IS enforced is below.

rows marked published while failing a gate (bypass): 0

=== PAGE GATES — every page in the sitemap ===

page type   pages  pass   G1    G2    G3    G4    G5    G6
---------   -----  ----   ---   ---   ---   ---   ---   ---
state           5     5     5     5     5     5     5     5
county         26    26    26    26    26    26    26    26
city           35    35    35    35    35    35    35    35
filter         38    38    38    38    38    38    38    38
venue         275   275   275   275   275   275   275   275

published pages passing all six: 379/379
```
