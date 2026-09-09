# Structured data validation

```

=== STRUCTURED DATA VALIDATION ===
Local validator over the built JSON-LD. Not Google Rich Results — that
needs a public URL and this build is noindex on example.invalid.

page type   pages   clean   nodes emitted
---------   -----   -----   -------------
home            1       1   WebSite, BreadcrumbList
editorial       6       6   BreadcrumbList, FAQPage
state           5       5   BreadcrumbList, Dataset, FAQPage
county         26      26   BreadcrumbList, FAQPage, ItemList
city           35      35   BreadcrumbList, FAQPage, ItemList
filter         38      38   BreadcrumbList, FAQPage, ItemList
venue         275     275   BreadcrumbList, SportsActivityLocation, FAQPage

=== NEGATIVE TEST: AggregateRating ===
  venue pages checked:            275
  AggregateRating nodes emitted:  0
  first-party ratings in dataset: 0 (rating and user_rating are QUARANTINED, decisions.md O2)
  PASS — no venue emits AggregateRating, and none has first-party ratings to justify one.

SCHEMA VALIDATION CLEAN

```
