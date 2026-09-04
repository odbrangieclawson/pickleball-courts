# Saint Paul verification - a city with no list, and two records that disagree

Run 2026-09-04. 6 venues published, 13 courts, all outdoor. 2 venues refused.

Saint Paul is the first city in this directory that publishes no list of its pickleball venues.
Its pickleball page links an interactive map and a PDF. The venue set here was assembled from the
City's own pickleball GIS layer for candidate names, then verified one page at a time:

| venue | courts | what the City writes | address |
| --- | ---: | --- | --- |
| `arlington-arkwright-park` | 1 | "1 Pickleball court (striped tennis court)" | 400 Arlington Ave. E. |
| `clayland-park` | 2 | "(2) Pickleball Courts" | 901 Fairview Ave. N. |
| `duluth-and-case-recreation-center` | 2 | "(2) Pickleball Courts" | 1020 Duluth St. |
| `edgcumbe-recreation-center` | 4 | "(4) Pickleball Courts" | 320 Griggs St. S. |
| `homecroft-park` | 2 | "(2) Pickleball Courts" | 1850 Sheridan Ave. |
| `orchard-park` | 2 | "2 Pickleball Courts" | 875 Orchard Ave. |

## The two records disagree, in both directions

In the GIS layer, with no count on the facility page:

- Baker Park
- Carty Park
- Eastview Park
- Hazel Park
- Prosperity Heights Park
- Rice Recreation Center
- Martin Luther King Recreation Center

On the facility pages with a count, absent from the GIS layer:

- Clayland Park (2 courts)
- Edgcumbe Recreation Center (4 courts)

The facility pages decide what publishes here, because they are the ones that state a count. The
layer is one point per court with no address and no number, and counting map points to produce a
court total is the derivation this project falsified for Sacramento and will not repeat.

## Refused

**Assembly Union Park** - "3 pickleball courts"

1. The Census address geocoder returns no match for "875 Mount Curve Boulevard", the address the City prints on the park's own page. Import Gate I1 requires a street address that resolves.
2. This is the most costly exclusion in the run: the City describes these as the first dedicated pickleball courts in the Saint Paul park system, and dedicated courts are rarer in this city than anywhere else published so far.

**Mattocks Park** - "Pickleball (Outdoor)"

1. The City lists "Pickleball (Outdoor)" among the park's amenities and states no number. Page Gate 1 requires a verified court count and there is none to verify.

## Why every court here is outdoor

Not by assumption. Edgcumbe and Duluth and Case are recreation centres whose amenity lists are
split into "Indoor Amenities:" and "Outdoor Amenities:", and at both the pickleball line sits under
Outdoor - which this run checks on every build rather than remembering. The four parks describe
their courts as striping on tennis courts, and the City's pickleball page ties that to outdoor in
as many words.

_No imported row was overwritten._
