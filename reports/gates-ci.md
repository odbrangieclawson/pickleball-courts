# CI gate run

```

=== IMPORT GATES — census over every imported row ===

SKIPPED — data.csv is not present, so NO ROW WAS EXAMINED.

That is expected: the file is gitignored on purpose and CI never has
it. It is said plainly because a silent skip reads as a pass, and a
green tick meaning "nothing was checked" is the exact failure this
project already fixed once in Gate 6.

This census reports on the staging pile. It gates nothing. The page
gates below gate everything, and they ran.

=== PAGE GATES — every page in the sitemap ===

page type   pages  pass   G1    G2    G3    G4    G5    G6
---------   -----  ----   ---   ---   ---   ---   ---   ---
county          1     1     1     1     1     1     1     1
city            1     1     1     1     1     1     1     1
filter          2     2     2     2     2     2     2     2
venue          24    24    24    24    24    24    24    24

published pages passing all six: 28/28
```
