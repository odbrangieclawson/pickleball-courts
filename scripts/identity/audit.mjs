#!/usr/bin/env node
/*
  The identity pass.

  WHY THIS IS SEPARATE FROM VERIFICATION

  Verification answers "is this fact true, and who says so". Identity answers
  "which venue is this, and what is its URL". A source can settle the first
  and has nothing to say about the second, so no amount of provenance work
  fixes a colliding slug or a row filed under the wrong state.

  It is also the one job with a deadline that is not negotiable. decisions.md
  §3 makes every URL permanent at launch: after that a slug change is a 301
  maintained forever. Nothing is published yet, so every slug in here is
  still free. That window closes once, and never reopens.

  MEASURED REASON TO DO IDENTITY AND NOT FIELDS

  Across the 20 Seattle venues matched to a municipal source, 66 of 231
  non-null imported field values survived verification - 29%. The other 71%
  were overwritten or cleared. Enriching fact fields is filling in values a
  source will destroy. Identity is what survives, because nothing else
  supplies it.

  ============================================================
  WHAT IT DOES, AND WHAT IT REFUSES TO DO
  ============================================================

  FIXES, because the answer is derivable with no new information:

    Numeric suffixes. 628 slugs end in a row id - martz-field-2,
    fairview-recreation-center-5632. They exist because the source used ONE
    FLAT global slug namespace, so two Fairview Recreation Centers in
    different states had to fight over one name. This project's URLs are
    hierarchical: /pickleball/us/{state}/{city}/{venue}/. Anchorage and
    Stockbridge already differ two segments earlier. The suffix is answering
    a question this URL pattern does not ask, so it comes off - but only
    where doing so collides with nothing in the same city.

  REFUSES, because guessing would write a permanent mistake:

    In-city collisions. Strip the suffixes and 190 rows still land on the
    same slug inside the same city. They are two records of one park, or two
    parks with one name, and the difference matters: merging two real venues
    loses one forever, while splitting one venue into two publishes a park
    twice and double-counts its courts. Bakersfield's Beale Park appears at
    500 Oleander Ave and 1904 Palm Street, 40 metres apart, 6 courts each -
    almost certainly one park. Aurora's Highland Hollow Park appears twice
    with 2 courts and 4 courts, 5 km apart - almost certainly not. No rule
    separates those two cases. They go to a review queue.

    Geography contradictions. Where the coordinates fall outside the stated
    state, the row genuinely does not know where it is: Guerneville and
    Orangevale are California towns filed under Arizona, and "Cole Park,
    Bellevue IA" sits at Seattle's coordinates. A wrong state is a wrong city
    page is a wrong permanent URL, so these are held back.

    A disagreeing ZIP is NOT automatically one of these - see the note above
    geoProblem(). Coordinates settle it where they exist, and most of the
    340 ZIP mismatches turn out to be a bad field on a row whose location is
    not in doubt.

  QUARANTINE COSTS NOTHING TODAY. Every one of these rows is already
  status=pending with no source. Holding them back removes nothing from the
  site; it stops them entering a verification queue and hardening into a URL
  before anyone notices they are wrong.
*/

import {writeFileSync, mkdirSync, readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {mapRow} from '../import/mapper.mjs'
import {isOutsideState, zipDisagreesWithState, haversineKm} from '../lib/us-geo.mjs'
import {canonicalise} from './slug-normalise.mjs'
import {loadVerifiedOverlay, overlayKey} from '../../lib/data/verified.mjs'

const NUMERIC_SUFFIX = /-\d+$/

const citySlug = c => String(c ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const cityKey = v => `${String(v.state).toUpperCase()}/${citySlug(v.city)}`

const rows = loadRows().map(r => mapRow(r).venue)

/*
  ============================================================
  RESOLVED COLLISIONS
  ============================================================

  This file used to say in-city collisions "go to a review queue", and the
  queue — reports/identity-duplicates.csv — had nowhere to send an answer
  back to. So an answer could be found and could not be applied.

  Bellevue found one. The City states three pickleball courts at Hillaire
  Park, 15803 NE 6th St, and two imported rows claim the slug hillaire-park:
  the one at that address, and one whose street_address is "East Lake Hills"
  — a neighbourhood, not an address — sitting 4.7 km away. Both were held, so
  a venue with a municipal source and a geocoded address could not publish
  because an unsourced row shares its name.

  That is the quarantine doing the wrong thing for the right reason. It
  exists to stop a GUESS hardening into a permanent URL, and this is not a
  guess: the City's own park index lists Hillaire Park exactly once.

  data/identity/resolutions.json is where such an answer is recorded, with a
  basis and the source that states it. It is deliberately narrow — it settles
  only the collisions it names, one at a time, and every other colliding row
  in the dataset stays held.

  A STALE RESOLUTION IS AN ERROR. If a resolution names a slug that is not in
  the collision it claims to settle, or leaves a member of that collision
  unaccounted for, this script throws. The alternative — ignoring it quietly
  — would let a resolution written against last month's data keep publishing
  a row nobody has looked at since.
*/
const resolutions = (() => {
  const p = join(REPO_ROOT, 'data/identity/resolutions.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')).resolutions ?? {}) : {}
})()
const resolutionsUsed = new Set()

/*
  Names a source has stated. Where one exists it is a better identity than
  anything derivable from the import, so the slug is built from it.
*/
const overlay = loadVerifiedOverlay(REPO_ROOT)
/*
  City-scoped, like every other overlay lookup: a bare slug is not unique
  nationally, and reading a Sacramento name onto an Oregon row would build
  the wrong canonical slug — permanently, since §3 freezes URLs at launch.
*/
const verifiedName = v => overlay.byKey.get(overlayKey(v.state, v.city, v.slug))?.patch?.name ?? null

/* ---------------------------------------------------------------- */
/* 1. Candidate slug.                                                */
/* ---------------------------------------------------------------- */

for (const v of rows) {
  const {slug, steps} = canonicalise(v, verifiedName(v))
  v._candidate = slug
  v._steps = steps
  v._hadSuffix = NUMERIC_SUFFIX.test(String(v.slug ?? ''))
  v._changed = slug !== v.slug
}

/* Group by city + candidate slug. A group of one is safe to rename. */
const groups = new Map()
for (const v of rows) {
  const k = `${cityKey(v)}/${v._candidate}`
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(v)
}

/* ---------------------------------------------------------------- */
/* 2. Geography contradictions.                                      */
/* ---------------------------------------------------------------- */

/*
  A geography problem is a doubt about WHERE THE VENUE IS, not a bad value in
  a field. The difference decides whether a row is held back.

  The first version of this check quarantined any row whose ZIP did not
  belong to its state, and it immediately caught a verified Seattle venue:
  Lakeridge Playfield, postal_code "10145". That is not a ZIP at all — it is
  the street number out of "10145 Rainier Ave S", leaked into the postal
  field by the import. The coordinates put it in Seattle, correctly.

  So the rule is now: coordinates decide. They are the strongest locator in
  the row, and where they confirm the state a bad ZIP is a field-quality
  problem for the quality report, not a reason to hold a venue back. A row is
  held only when its location is genuinely in doubt — coordinates outside the
  state, or a disagreeing ZIP with no coordinates to settle it.
*/
const ZIP_SHAPE = /^\d{5}(-\d{4})?$/

const geoProblem = v => {
  const st = String(v.state).toUpperCase()
  const hasCoords = v.latitude !== null && v.longitude !== null
  const coordsOutside = isOutsideState(st, v.latitude, v.longitude)

  if (coordsOutside === true) {
    return {hold: true, detail: `coordinates ${v.latitude},${v.longitude} fall outside ${st}`}
  }
  if (zipDisagreesWithState(st, v.postal_code) === true) {
    if (hasCoords && coordsOutside === false) {
      /* Coordinates confirm the state. The ZIP is simply wrong. */
      return {
        hold: false,
        detail: ZIP_SHAPE.test(String(v.postal_code ?? '')) && !String(v.street_address ?? '').startsWith(String(v.postal_code))
          ? `postal code ${v.postal_code} does not belong to ${st}, but coordinates confirm the state`
          : `postal_code "${v.postal_code}" is not a ZIP — it repeats the street number from "${v.street_address}"`,
      }
    }
    return {hold: true, detail: `postal code ${v.postal_code} does not belong to ${st} and there are no coordinates to settle it`}
  }
  return null
}

/* ---------------------------------------------------------------- */
/* 3. Decide, per row.                                               */
/* ---------------------------------------------------------------- */

const registry = {}     // slug -> canonical slug + basis
const quarantine = {}   // slug -> reason
const dupRows = []
/* Location fields that are wrong but do not put the venue itself in doubt. */
const badField = []

for (const [key, members] of groups) {
  const collision = members.length > 1

  if (collision) {
    /* Two or more rows want one URL inside one city. Neither publishes,
       unless data/identity/resolutions.json says which one should. */
    const resolved = resolutions[key]
    if (resolved) {
      resolutionsUsed.add(key)
      const slugs = new Set(members.map(m => m.slug))
      const named = [resolved.keep, ...(resolved.hold ?? [])]
      for (const s of named) {
        if (!slugs.has(s)) {
          throw new Error(
            `data/identity/resolutions.json: the resolution for "${key}" names "${s}", ` +
            'which is not one of the rows colliding there. The data has moved under it; re-read the collision.')
        }
      }
      for (const m of members) {
        if (!named.includes(m.slug)) {
          throw new Error(
            `data/identity/resolutions.json: the resolution for "${key}" accounts for ${named.length} rows, ` +
            `but "${m.slug}" also claims that slug and the resolution does not mention it. ` +
            'Every member of a collision must be either kept or held.')
        }
      }
      if (!resolved.basis) {
        throw new Error(`data/identity/resolutions.json: the resolution for "${key}" has no basis. A resolution is a citation, not an opinion.`)
      }

      for (const m of members) {
        if (m.slug === resolved.keep) {
          /* The kept row takes the contested slug and carries why. */
          if (m.slug !== m._candidate) {
            registry[m.slug] = {
              canonical: m._candidate,
              basis: `${m._steps.join('; ')}; collision resolved: ${resolved.basis}`,
            }
          }
          continue
        }
        quarantine[m.slug] = {
          reason: 'in_city_slug_collision_resolved_against',
          detail: `"${resolved.keep}" keeps the slug "${m._candidate}" in ${key.split('/').slice(0, 2).join('/')}. ${resolved.basis}`,
          wanted_slug: m._candidate,
          peers: members.filter(x => x.slug !== m.slug).map(x => x.slug),
          resolved_on: resolved.decided_on ?? null,
          source_url: resolved.source_url ?? null,
        }
      }
      continue
    }

    const coords = members.filter(m => m.latitude !== null && m.longitude !== null)
    let apartKm = null
    if (coords.length > 1) {
      apartKm = haversineKm(coords[0].latitude, coords[0].longitude, coords[1].latitude, coords[1].longitude)
    }
    for (const m of members) {
      quarantine[m.slug] = {
        reason: 'in_city_slug_collision',
        detail: `${members.length} rows in ${key.split('/').slice(0, 2).join('/')} claim the slug "${m._candidate}"`,
        wanted_slug: m._candidate,
        peers: members.filter(x => x.slug !== m.slug).map(x => x.slug),
      }
      dupRows.push({
        city_key: key,
        wanted_slug: m._candidate,
        slug: m.slug,
        name: m.name,
        street_address: m.street_address,
        total_courts: m.total_courts,
        latitude: m.latitude,
        longitude: m.longitude,
        km_apart: apartKm === null ? '' : apartKm.toFixed(3),
      })
    }
    continue
  }

  const v = members[0]
  const geo = geoProblem(v)
  if (geo?.hold) {
    quarantine[v.slug] = {reason: 'geography_contradiction', detail: geo.detail}
    continue
  }
  if (geo) badField.push({slug: v.slug, city: v.city, state: v.state, detail: geo.detail})

  if (v._changed) {
    registry[v.slug] = {
      canonical: v._candidate,
      basis: v._steps.join('; '),
    }
  }
}

/* Rows that are fine but sit in a city where something else collided:
   they keep their own slug and are unaffected. Nothing to record. */

/*
  A resolution for a collision that no longer exists is not harmless. It
  means the data changed and nobody re-read the decision, and the next
  collision in that city would be settled by reasoning written about rows
  that have since moved.
*/
for (const key of Object.keys(resolutions)) {
  if (!resolutionsUsed.has(key)) {
    throw new Error(
      `data/identity/resolutions.json: the resolution for "${key}" settles a collision that no longer exists. ` +
      'Either the rows changed or the key is wrong; re-read it rather than leaving it in place.')
  }
}

/* ---------------------------------------------------------------- */
/* 3b. City names that look like misspellings of a bigger neighbour.  */
/* ---------------------------------------------------------------- */

function editDistance1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false
  const d = []
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i]
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = i === 0 ? j : Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return d[a.length][b.length] === 1
}

const cityCounts = new Map()
for (const v of rows) {
  const st = String(v.state).toUpperCase()
  const c = citySlug(v.city)
  if (!cityCounts.has(st)) cityCounts.set(st, new Map())
  const m = cityCounts.get(st)
  m.set(c, (m.get(c) ?? 0) + 1)
}

const cityVariants = []
for (const [st, m] of cityCounts) {
  const list = [...m.entries()].sort((a, b) => b[1] - a[1])
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const [keep, keepN] = list[i]
      const [suspect, suspectN] = list[j]
      if (keep.length < 4 || suspect.length < 4) continue
      /* A big city beside a one-or-two-row near-twin in the same state. */
      if (suspectN <= 3 && keepN >= 5 * Math.max(suspectN, 1) && editDistance1(keep, suspect)) {
        cityVariants.push({st, keep, keepN, suspect, suspectN})
      }
    }
  }
}
cityVariants.sort((a, b) => b.keepN - a.keepN)

/* ---------------------------------------------------------------- */
/* 4. Write.                                                         */
/* ---------------------------------------------------------------- */

mkdirSync(join(REPO_ROOT, 'data/identity'), {recursive: true})

writeFileSync(join(REPO_ROOT, 'data/identity/slugs.json'), JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  note: 'Canonical slug per imported slug. Only rows whose slug changes appear here.',
  renames: registry,
}, null, 2) + '\n')

writeFileSync(join(REPO_ROOT, 'data/identity/quarantine.json'), JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  note: 'Rows held back from publication on identity grounds. Not a data-quality opinion — an unresolved question about which venue this is or where it is.',
  rows: quarantine,
}, null, 2) + '\n')

const csvEsc = s => {
  const t = s === null || s === undefined ? '' : String(s)
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}
const dupHeader = ['city_key', 'wanted_slug', 'slug', 'name', 'street_address', 'total_courts', 'latitude', 'longitude', 'km_apart']
dupRows.sort((a, b) => a.city_key.localeCompare(b.city_key) || a.slug.localeCompare(b.slug))
writeFileSync(join(REPO_ROOT, 'reports/identity-duplicates.csv'),
  [dupHeader.join(','), ...dupRows.map(r => dupHeader.map(h => csvEsc(r[h])).join(','))].join('\n') + '\n')

const renamed = Object.keys(registry).length
const quarantined = Object.keys(quarantine).length
const collisionRows = Object.values(quarantine).filter(q => q.reason === 'in_city_slug_collision').length
const geoRows = Object.values(quarantine).filter(q => q.reason === 'geography_contradiction').length
const suffixTotal = rows.filter(v => v._hadSuffix).length
/*
  Counted separately from `renamed`, which counts every rename for any
  reason. This line used to print `renamed` and so reported 8,298 suffixes
  fixed out of 628 — a number that could not be true and was on the report
  for weeks. A count must be of the thing its label names.
*/
const suffixFixed = rows.filter(v => v._hadSuffix && !NUMERIC_SUFFIX.test(v._candidate)).length
const suffixKept = suffixTotal - suffixFixed

/* How many of the collision pairs are probably the same place? Proximity is
   evidence, not proof, so it is reported as a hint for the reviewer. */
const badFieldN = badField.length
const near = dupRows.filter(r => r.km_apart !== '' && Number(r.km_apart) < 0.25).length
const far = dupRows.filter(r => r.km_apart !== '' && Number(r.km_apart) >= 2).length

const md = `# Identity audit

Run ${new Date().toISOString().slice(0, 10)} over ${rows.length.toLocaleString('en-US')} imported rows.

Identity is which venue a row is and what its URL will be. No source settles
it, so verification never fixes any of it — and \`decisions.md\` §3 makes
every URL permanent at launch. Nothing is published yet, so all of this is
still free to change. That is why it goes first.

## Headline

| | rows |
| --- | ---: |
| Slugs carrying a numeric row-id suffix | ${suffixTotal} |
| **Renamed automatically** | **${renamed}** |
| Held back — two rows want one URL in one city | ${collisionRows} |
| Held back — state, coordinates and postal code disagree | ${geoRows} |
| **Total held back** | **${quarantined}** |

## Numeric suffixes: ${suffixTotal} in, ${suffixFixed} stripped, ${suffixKept} kept

The source used one flat global slug namespace, so two venues with the same
name anywhere in the country had to fight over one string. Three separate
Fairview Recreation Centers — Stockbridge GA, Anchorage AK, Fairview TN —
became \`fairview-recreation-center\`, \`-5632\` and \`-10139\`.

This project's URLs are hierarchical:

    /pickleball/us/ak/anchorage/fairview-recreation-center/
    /pickleball/us/ga/stockbridge/fairview-recreation-center/

Those differ two segments before the venue slug. The suffix answers a
question this URL pattern does not ask, so it comes off wherever nothing in
the same city claims the same slug. Rule 10 is satisfied by the hierarchy
rather than by inventing a disambiguator.

## Held back: ${collisionRows} rows still collide inside one city

Strip the suffixes and these rows still land on the same slug in the same
city. Each pair is either one park recorded twice or two parks sharing a
name, and the two cases need opposite treatment:

- merge two real venues → one disappears from the directory
- split one venue in two → the park publishes twice and its courts are
  counted twice, which is exactly the CourtSource failure this project
  exists to beat

Proximity is a hint, not an answer. ${near} of these rows sit within 250 m of
their twin, which usually means one park recorded twice. ${far} sit 2 km or
more apart, which usually means two different places.

Worked example, both real:

    Beale Park, Bakersfield CA     500 Oleander Ave / 1904 Palm Street
                                   6 courts each, 40 m apart  → likely ONE park

    Highland Hollow Park, Aurora   1400 S Uravan St / 1358 S. Uravan St
                                   2 courts vs 4 courts, 5 km apart → likely TWO

No rule separates those. Review queue: \`reports/identity-duplicates.csv\`,
sorted by city so a reviewer sees both members of a pair together.

## Held back: ${geoRows} rows whose location contradicts itself

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
doubt. ${badFieldN} rows fall in that category — worth fixing, not worth
holding a venue back for.

## Misspelled city names — reported, not corrected

Normalising the slugs surfaced something the slug column was hiding. One
Seattle row has the city spelled **"Seatlle"**, so its city prefix did not
match and would not strip. Left alone it would also have built its own
phantom city page at \`/pickleball/us/wa/seatlle/\`.

Eleven single-row cities look like misspellings of a much larger city in the
same state:

${cityVariants.map(s => `- \`${s.st}\` **${s.suspect}** (${s.suspectN} row) beside **${s.keep}** (${s.keepN} rows)`).join('\n')}

**None of these is corrected automatically, because at least four are real
places.** Bolton MA is a town near Boston, Aston PA is not Easton, Loleta CA
is not Goleta, Mayville NY is not Sayville. An edit distance of one is a
hint, not evidence, and silently merging a real town into its larger
neighbour would move venues to a city they are not in.

They are also not quarantined, because they cannot do any harm: every one is
a single-row city, and Rule 8 requires three verified venues before a city
page exists at all. The 3-venue threshold already prevents a phantom city
from publishing. They are listed here so that whoever verifies that metro
checks the spelling first.

## What holding back actually costs

Nothing, today. Every quarantined row is already \`status=pending\` with no
qualifying source, so none of them could publish anyway. The quarantine does
one thing: it keeps them out of a verification queue, so nobody spends an
afternoon sourcing a venue that turns out to be a duplicate or to be in a
different state.

## What this pass deliberately did not touch

**${rows.filter(v => /^[a-z]{2,}-/.test(v.slug ?? '') === false).length === 0 ? 'City-prefixed slugs' : 'City-prefixed slugs'}.** Many imported names stamp the
city onto a description — "Seattle - Miller Playfield Pickleball Courts
(Capitol Hill)" — and the slugs inherit it, giving URLs like
\`/pickleball/us/wa/seattle/seattle-miller-playfield-pickleball-courts-capitol-hill/\`
with the city twice. Verification already replaces the display NAME from the
municipal source, so the pages read correctly while the URLs do not. Fixing
that changes live demo URLs and is a judgement call about house style, so it
is left as a decision rather than made silently. It is also governed by §3,
so it has the same deadline as everything else here.

**Encoding artefacts.** Names and addresses carry mojibake — "Discovery Park?
Tennis and Pickleball Courts", "3801 \\ufffd 7th St". These are display
fields that verification overwrites from the source, so repairing them by
hand would be work destroyed on contact with a real source.
`

writeFileSync(join(REPO_ROOT, 'reports/identity.md'), md)

console.log(`\nIdentity audit — ${rows.length.toLocaleString('en-US')} rows`)
console.log(`  numeric suffixes found      ${suffixTotal} (${suffixFixed} stripped, ${suffixKept} kept as part of a name)`)
console.log(`  renamed automatically       ${renamed}`)
console.log(`  held back (slug collision)  ${collisionRows}`)
console.log(`  held back (geography)       ${geoRows}`)
console.log(`  held back total             ${quarantined}`)
console.log(`\nWrote data/identity/slugs.json, data/identity/quarantine.json`)
console.log(`      reports/identity.md, reports/identity-duplicates.csv\n`)
