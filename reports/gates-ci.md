# CI gate run

```

=== IMPORT GATES — census over every imported row ===

rows examined:            18,062
rows passing all four:    62

gate  what it checks                                        failing
----  ----------------------------------------------------  -------
I1    identity: slug shape, name, city, state, address           719
I2    provenance: source_url, date_checked, verified_by        18000
I3    consistency: court arithmetic, county, court count        4393
I4    vocabulary: controlled values in filtered fields             0

I2 dominates and that is the known state of the project, not a
regression: no imported row carries provenance until someone verifies
it. These are reported, not enforced. What IS enforced is below.

rows marked published while failing a gate (bypass): 0

=== PAGE GATES — every page in the sitemap ===

page type   pages  pass   G1    G2    G3    G4    G5    G6
---------   -----  ----   ---   ---   ---   ---   ---   ---
state           1     1     1     1     1     1     1     1
county          5     5     5     5     5     5     5     5
city            7     7     7     7     7     7     7     7
filter         10    10    10    10    10    10    10    10
venue          62    62    62    62    62    62    62    62

published pages passing all six: 85/85
```
