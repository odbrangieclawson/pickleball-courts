# Source snapshots

A snapshot of every dataset a verification run read, committed so that any
published fact can be re-checked without re-fetching a live endpoint that may
have changed underneath it.

`sacramento-park-amenities.arcgis.json` supports no published fact. It is kept
because `reports/sacramento-derivation-falsified.md` argues from its geometry
that this layer cannot yield court counts, and that argument is only checkable
against the data it was made from. Deleting it would leave the report as an
assertion.
