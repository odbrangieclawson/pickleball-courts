# Identity audit

Run 2026-09-03 over 18,037 imported rows.

Identity is which venue a row is and what its URL will be. No source settles
it, so verification never fixes any of it — and `decisions.md` §3 makes
every URL permanent at launch. Nothing is published yet, so all of this is
still free to change. That is why it goes first.

## Headline

| | rows |
| --- | ---: |
| Slugs carrying a numeric row-id suffix | 628 |
| **Renamed automatically** | **549** |
| Held back — two rows want one URL in one city | 172 |
| Held back — state, coordinates and postal code disagree | 31 |
| **Total held back** | **203** |

## Numeric suffixes: 628 in, 549 fixed

The source used one flat global slug namespace, so two venues with the same
name anywhere in the country had to fight over one string. Three separate
Fairview Recreation Centers — Stockbridge GA, Anchorage AK, Fairview TN —
became `fairview-recreation-center`, `-5632` and `-10139`.

This project's URLs are hierarchical:

    /pickleball/us/ak/anchorage/fairview-recreation-center/
    /pickleball/us/ga/stockbridge/fairview-recreation-center/

Those differ two segments before the venue slug. The suffix answers a
question this URL pattern does not ask, so it comes off wherever nothing in
the same city claims the same slug. Rule 10 is satisfied by the hierarchy
rather than by inventing a disambiguator.

## Held back: 172 rows still collide inside one city

Strip the suffixes and these rows still land on the same slug in the same
city. Each pair is either one park recorded twice or two parks sharing a
name, and the two cases need opposite treatment:

- merge two real venues → one disappears from the directory
- split one venue in two → the park publishes twice and its courts are
  counted twice, which is exactly the CourtSource failure this project
  exists to beat

Proximity is a hint, not an answer. 49 of these rows sit within 250 m of
their twin, which usually means one park recorded twice. 62 sit 2 km or
more apart, which usually means two different places.

Worked example, both real:

    Beale Park, Bakersfield CA     500 Oleander Ave / 1904 Palm Street
                                   6 courts each, 40 m apart  → likely ONE park

    Highland Hollow Park, Aurora   1400 S Uravan St / 1358 S. Uravan St
                                   2 courts vs 4 courts, 5 km apart → likely TWO

No rule separates those. Review queue: `reports/identity-duplicates.csv`,
sorted by city so a reviewer sees both members of a pair together.

## Held back: 31 rows whose location contradicts itself

These rows have coordinates that fall outside the state they claim. The row
does not agree with itself about where it is, and nothing available says
which half is right.

- Guerneville and Orangevale are California towns filed under Arizona
- "Cole Park, Bellevue IA" sits at 47.61, -122.19 — Bellevue, Washington
- "Southbridge Racquet Club" has the city "ga"

A wrong state is a wrong city page, which under §3 is a wrong permanent URL.

### The ZIP check, and why it is not this

A first pass held back every row whose ZIP did not belong to its state — 340
of them — and it immediately caught a Seattle venue that was perfectly fine.
Lakeridge Playfield carries a postal_code of "10145", which is not a ZIP at
all: it is the street number out of "10145 Rainier Ave S", leaked into the
postal field by the import. Its coordinates put it in Seattle, correctly.

So coordinates decide. They are the strongest locator on the row, and where
they confirm the state a wrong ZIP is a bad field rather than a venue in
doubt. 337 rows fall in that category — worth fixing, not worth
holding a venue back for.

## What holding back actually costs

Nothing, today. Every quarantined row is already `status=pending` with no
qualifying source, so none of them could publish anyway. The quarantine does
one thing: it keeps them out of a verification queue, so nobody spends an
afternoon sourcing a venue that turns out to be a duplicate or to be in a
different state.

## What this pass deliberately did not touch

**City-prefixed slugs.** Many imported names stamp the
city onto a description — "Seattle - Miller Playfield Pickleball Courts
(Capitol Hill)" — and the slugs inherit it, giving URLs like
`/pickleball/us/wa/seattle/seattle-miller-playfield-pickleball-courts-capitol-hill/`
with the city twice. Verification already replaces the display NAME from the
municipal source, so the pages read correctly while the URLs do not. Fixing
that changes live demo URLs and is a judgement call about house style, so it
is left as a decision rather than made silently. It is also governed by §3,
so it has the same deadline as everything else here.

**Encoding artefacts.** Names and addresses carry mojibake — "Discovery Park?
Tennis and Pickleball Courts", "3801 \ufffd 7th St". These are display
fields that verification overwrites from the source, so repairing them by
hand would be work destroyed on contact with a real source.
