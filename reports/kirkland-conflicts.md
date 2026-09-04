# Kirkland verification - a column heading that names the court type

Run 2026-09-04. 3 venues published, 10 courts. 1 venue refused.

Kirkland puts its counts in a table whose column is headed "Number & Type of Courts", so each cell
reads "6 pickleball courts" rather than a bare number that might be counting tennis courts. No other
operator in this directory removes that ambiguity in the heading.

| venue | courts | counted twice? | what the City writes | address |
| --- | ---: | --- | --- | --- |
| `peter-kirk-park` | 6 | yes | "6 pickleball courts" | 202 3rd St |
| `everest-park` | 3 | no - pickleball page only | "3 pickleball courts" | 500 8th St S |
| `feriton-spur-park` | 1 | yes | "1 pickleball court" | 509 6th Street South |

## The newest courts on the site

Peter Kirk Park held six TENNIS courts until 13 April 2026. The City closed them "for conversion to
six dedicated pickleball courts" and reopened them on 2 July 2026 at 3 p.m., two months before this
check. The imported dataset has no row for the park at all, which is the expected consequence of
that history rather than a gap in the import, so the venue is minted from the City's own pages.

The City posts a different rule on each half of the new courts: three are open play (one game to 11,
then rotate) and three are timed (30 minutes, then rotate).

## The City keeps two records and they disagree

The pickleball page's "Where to Play" table is a closed list of three parks. A fourth park page says:

> Van Aalst Park has half-basketball court with lines drawn for pickleball. This multisport court is
> available for drop-in use only. For pickleball use, players must bring their own nets.

That is the third city here whose operator keeps two records of its courts that do not match, after
Saint Paul and Lincoln. Those two were settled by the rule that the record stating a NUMBER
publishes. Neither Kirkland record states one for Van Aalst, so nothing publishes, and the run
asserts both grounds: if the City counts it, or adds it to the table, this build fails.

## Refused

**Van Aalst Park** - 335 13th Avenue

1. The City states no court count. Its page reads "Van Aalst Park has half-basketball court with lines drawn for pickleball", which describes a surface rather than counting courts, and Page Gate 1 requires a stated count.
2. It is also absent from the City's own pickleball page, whose "Where to Play" table is a closed list of three parks. So Kirkland is the third city in this directory whose operator keeps two records of its own courts that do not agree, after Saint Paul and Lincoln. Neither of Kirkland's two records states a number for Van Aalst, so unlike those cities there is nothing here to publish.
3. The park page adds that "For pickleball use, players must bring their own nets", so this is a half-basketball court you may play pickleball on rather than a pickleball court. That is context for the refusal rather than a ground of its own.

## What Kirkland does not say

- **lighting.** Every court closes at dusk, which the City states four times, and Peter Kirk Park's
  page mentions a lighted BASEBALL field in the same breath as the courts. A closing time is not a
  statement about lighting and a lit ballfield is not a lit court, so `light` stays null and Kirkland
  publishes no `/lights/` filter page.
- **any fee for pickleball.** Everest Park's page carries a "Free Play" heading, and that programme
  is field time on grass and synthetic turf. It is not about the courts and is not read as though it
  were, so `fee_type` stays null and there is no `/free/` page for Kirkland.
- **indoor or outdoor**, in those words. The breakdowns stay null, following Mesa.
- **surface**, anywhere in the city.

## The 403 bucket, retested in full

Kirkland was refused on an HTTP 403 during the runs for cities #9 to #12. The whole bucket has now
been retested:

| result | cities |
| --- | --- |
| reachable now | Mesa, Durham, Kirkland, Fort Collins |
| still refusing | Spokane, Greensboro, Redmond, Wichita, Eugene, Olympia, Overland Park, Minneapolis, Tucson |

Spokane is the expensive one: it publishes a court count and a street address for twelve parks, and
it refuses both a bare curl and a full browser header set.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `everest-park` | name | "Everest Park Pickleball Courts" | "Everest Park" | overridden |
| `everest-park` | street_address | "500 8th Street South" | "500 8th St S" | overridden |
| `everest-park` | hours_of_operation | "8am-8pm" | "Open 8 a.m. to dusk, daily." | overridden |
| `everest-park` | parking | "Free parking available" | "There are two parking lots at Everest with space for up to 100 vehicles." | overridden |
| `feriton-spur-park` | name | "Kirkland - Feriton Spur Park" | "Feriton Spur Park" | overridden |
| `feriton-spur-park` | hours_of_operation | "Contact facility" | "Open 8 a.m. to dusk, daily." | overridden |
