# Structured data validation

```

=== STRUCTURED DATA VALIDATION ===
Local validator over the built JSON-LD. Not Google Rich Results — that
needs a public URL and this build is noindex on example.invalid.

page type   pages   clean   nodes emitted
---------   -----   -----   -------------
home            1       1   WebSite, BreadcrumbList
editorial       1       1   BreadcrumbList
state           3       3   BreadcrumbList, Dataset, FAQPage
county         23      23   BreadcrumbList, FAQPage, ItemList
city           30      30   BreadcrumbList, FAQPage, ItemList
filter         36      36   BreadcrumbList, FAQPage, ItemList
venue         241     241   BreadcrumbList, SportsActivityLocation, FAQPage

=== NEGATIVE TEST: AggregateRating ===
  venue pages checked:            241
  AggregateRating nodes emitted:  0
  first-party ratings in dataset: 0 (rating and user_rating are QUARANTINED, decisions.md O2)
  PASS — no venue emits AggregateRating, and none has first-party ratings to justify one.

SCHEMA VALIDATION CLEAN

```
