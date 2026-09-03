# Structured data validation

```

=== STRUCTURED DATA VALIDATION ===
Local validator over the built JSON-LD. Not Google Rich Results — that
needs a public URL and this build is noindex on example.invalid.

page type   pages   clean   nodes emitted
---------   -----   -----   -------------
home            1       1   WebSite, BreadcrumbList
editorial       1       1   BreadcrumbList
state           1       1   BreadcrumbList, Dataset, FAQPage
county          4       4   BreadcrumbList, FAQPage, ItemList
city            6       6   BreadcrumbList, FAQPage, ItemList
filter         10      10   BreadcrumbList, FAQPage, ItemList
venue          59      59   BreadcrumbList, SportsActivityLocation, FAQPage

=== NEGATIVE TEST: AggregateRating ===
  venue pages checked:            59
  AggregateRating nodes emitted:  0
  first-party ratings in dataset: 0 (rating and user_rating are QUARANTINED, decisions.md O2)
  PASS — no venue emits AggregateRating, and none has first-party ratings to justify one.

SCHEMA VALIDATION CLEAN

```
