# Vancouver verification - one stated negative, and one source that contradicts itself

Run 2026-09-03. 3 venues published, 14 courts (4 outdoor, 10 indoor). 1 venue excluded.

| venue | courts | where | cost | quoted from the City |
| --- | --- | --- | --- | --- |
| `oakbrook-community-park` | 4 | outdoor | not stated | "Nets and poles are permanently installed. The courts do not have lighting." |
| `firstenburg-community-center` | 6 | indoor | drop_in_fee | "There are six courts open during scheduled play on a wood gymnasium floor." |
| `marshall-community-center` | 4 | indoor | drop_in_fee | "The earlier time slot will use all four courts and provide capacity for up to 24 players with a cooler gym environment during summer mornings." |

## The address conflict

Two City of Vancouver pages disagree about where Fisher Basin Community Park is.

| page | address it gives for Fisher Basin |
| --- | --- |
| pickleball page | `3103 NE 99th Ave.` — which is **Oakbrook Community Park's** address, printed two paragraphs above |
| Fisher Basin park page | `SE 192nd Ave. Vancouver, WA 98607` |

Oakbrook's address is corroborated by its own park page (`3103 NE 99th Ave. Vancouver, WA 98662`)
and matched cleanly by the Census geocoder, so the pickleball page has copied it onto the next entry.
The run asserts both sentences are still present, so if the City fixes the page this report fails
rather than continuing to make the accusation.

## Excluded

**Fisher Basin Community Park** — three independent reasons:

1. The pickleball page states no court count for it — only "shared tennis and pickleball courts".
2. The pickleball page gives its address as "3103 NE 99th Ave.", which is Oakbrook Community Park's address, printed two paragraphs above. The City's own park page for Fisher Basin says "SE 192nd Ave. Vancouver, WA 98607".
3. No published address for it carries a house number, and the Census address geocoder returns no match, so Import Gate I1 could not be satisfied even if a count appeared.

## The first stated negative in the directory

Oakbrook Community Park: "The courts do not have lighting." Every other venue across seven cities
has `light` as null, because no operator had said either way. Unknown is not unlit — and now, for
exactly one venue, we can say unlit and mean it.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `firstenburg-community-center` | street_address | "700 NE 136th Avenue, Vancouver, WA 98684" | "700 NE 136th Ave" | overridden |
| `firstenburg-community-center` | pricing_notes | "Members: free. Daily drop-in (ActiveNet account required first). Family Pickleball Night: members free / residents $7 /" | "Free for community center members. Visitors must pay a daily drop-in fee, which the City does not publish an amount for on this page." | overridden |
