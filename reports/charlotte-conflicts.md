# Charlotte verification - counts read from enumerated court numbers

Run 2026-09-03. 5 venues published, 2 excluded.

Mecklenburg County does not publish a court count. It names individual
numbered courts, split between reservable and open play. The count for each
park is the union of those numbers, and the run refuses to publish a park
whose numbers leave a gap or repeat across the two lists.

| venue | courts | numbers | the county's own lines |
| --- | --- | --- | --- |
| `clarks-creek-park` | 8 | 1-8 | "Clarks Creek Park: Courts 1-5"<br>"Clarks Creek Park: Courts 6-8" |
| `clanton-park` | 6 | 1-6 | "Clanton Park: Courts 1-4"<br>"Clanton Park: Courts 5&6" |
| `freedom-park` | 6 | 11-16 | "Freedom Park: Courts 11, 12, 14, 15"<br>"Freedom Park: Courts 13&16" |
| `martin-luther-king-jr-park` | 6 | 1-6 | "MLK Park: Courts 2,3,5,6"<br>"MLK Park: Courts 1&4" |
| `colonel-francis-j-beatty-park` | 3 | 1-3 | "Colonel Francis J. Beatty Park: Courts 2&3"<br>"Colonel Francis J. Beatty Park: Court 1" |

**29 courts across 5 parks.**

## Listed by the county, not published

| venue | courts | why not |
| --- | --- | --- |
| Latta Park | 6 | Under "Hybrid Courts", not "Pickleball Courts". The county does not say what a hybrid court is. |
| Tuckaseegee Park | 6 | Same. |

## Municipality was checked, not assumed

Colonel Francis J. Beatty Park carries postcode 28105, a Matthews mailing
ZIP, while the City of Charlotte parks layer labels its CITY as Charlotte.
The Census geocoder places the point inside the incorporated place of
Charlotte, in Mecklenburg County. All five venues resolve the same way.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- |
| `clanton-park` | street_address | "1520 Clanton Road" | "1520 Clanton Rd" | overridden |
| `clanton-park` | postal_code | "28208" | "28217" | overridden |
