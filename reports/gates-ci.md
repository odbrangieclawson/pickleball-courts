# CI gate run

```

=== IMPORT GATES — census over every imported row ===

rows examined:            18,054
rows passing all four:    43

gate  what it checks                                        failing
----  ----------------------------------------------------  -------
I1    identity: slug shape, name, city, state, address           719
I2    provenance: source_url, date_checked, verified_by        18011
I3    consistency: court arithmetic, county, court count        4395
I4    vocabulary: controlled values in filtered fields             0

I2 dominates and that is the known state of the project, not a
regression: no imported row carries provenance until someone verifies
it. These are reported, not enforced. What IS enforced is below.

rows marked published while failing a gate (bypass): 0

=== PAGE GATES — every page in the sitemap ===

page type   pages  pass   G1    G2    G3    G4    G5    G6
---------   -----  ----   ---   ---   ---   ---   ---   ---
county          2     2     2     2     2     2     2     2
city            4     4     4     4     4     4     4     4
filter          7     7     7     7     7     7     7     7
venue          43    43    43    43    43    43    43    43

published pages passing all six: 56/56
```
