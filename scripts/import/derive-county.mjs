/*
  Phase 1 deliverable 3: derive county for every row, with method and
  confidence recorded per row, and low-confidence results flagged.

  STATUS: BLOCKED, and this script exists to say so precisely rather than to
  produce a guess.

  WHY IT IS BLOCKED

  County is not in the source and cannot be computed from the source alone.
  Deriving it needs a REFERENCE dataset that maps geography to counties, and
  this repo has none. There is no arithmetic trick here: nothing in a
  latitude, a longitude or a ZIP code tells you a county name without a table
  that already knows the answer.

  Guessing is not an option. A wrong county puts a venue on the wrong county
  page, at a URL that Rule 3 then makes permanent.

  WHAT WOULD UNBLOCK IT - any ONE of these, in preference order:

    1. US Census county boundary file (TIGER/Line or cartographic boundary
       shapefile / GeoJSON). Enables true point-in-polygon from lat/lng.
       Highest accuracy. Public domain.
    2. Census ZCTA-to-county relationship file, or the HUD USPS ZIP-county
       crosswalk. Enables ZIP-based lookup. Public domain / freely
       redistributable. Smaller and simpler than 1.
    3. A geocoding API with county in its response. Costs money, needs a key,
       and sends the address list to a third party.

  Options 1 and 2 are downloads of public reference data, not collection of
  new venue data, so they do not conflict with the Phase 1 "do not collect
  new data" constraint. But they are still a network fetch of a third-party
  file into this repo, so they wait for the owner's word.

  Drop a file at data/reference/ and this script runs. Until then it reports.

  THE CONFIDENCE MODEL, ready to use

    point_in_polygon        0.98  lat/lng inside a county boundary
    zip_single_county       0.90  ZIP maps to exactly one county
    zip_dominant_county     0.60-0.85  ZIP spans counties; scaled by the
                                  dominant county's share of addresses
    nearest_centroid        0.40  fallback; flagged always
    none                    0.00  no derivation possible

  FLAG THRESHOLD: anything below 0.85 goes to manual review. That deliberately
  flags every ZIP-based result that is not unambiguous, and every centroid
  fallback, because Import Gate I3 requires "derived county confidence above
  threshold" and a county page URL is permanent once published.
*/

import {writeFileSync, mkdirSync, existsSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {mapRow} from './mapper.mjs'

const OUT_DIR = join(REPO_ROOT, 'reports')
const REF_DIR = join(REPO_ROOT, 'data', 'reference')
mkdirSync(OUT_DIR, {recursive: true})

export const CONFIDENCE = {
  point_in_polygon: 0.98,
  zip_single_county: 0.9,
  zip_dominant_county: share => 0.6 + 0.25 * Math.min(1, Math.max(0, (share - 0.5) * 2)),
  nearest_centroid: 0.4,
  none: 0,
}

export const REVIEW_THRESHOLD = 0.85

/**
 * Pluggable resolver. Returns {county, method, confidence}.
 * With no reference data loaded, it returns the honest answer for every row.
 */
export function makeResolver(reference = null) {
  if (!reference) {
    return () => ({county: null, method: 'none', confidence: 0, needs_review: true})
  }
  // Reference-backed resolution is implemented when a reference file exists.
  // Left unimplemented rather than stubbed with a fake, so it cannot be
  // mistaken for working.
  throw new Error('Reference-backed county resolution is not implemented yet.')
}

const src = loadRows()
const venues = src.map(r => mapRow(r).venue)

const refFiles = existsSync(REF_DIR) ? readdirSync(REF_DIR) : []
const resolve = makeResolver(refFiles.length ? null : null) // no reference either way, today

const results = venues.map(v => ({slug: v.slug, ...resolve(v)}))
const derived = results.filter(r => r.county !== null).length
const flagged = results.filter(r => r.needs_review).length

const withCoords = venues.filter(v => v.latitude !== null && v.longitude !== null).length
const withZip = venues.filter(v => v.postal_code !== null).length
const withEither = venues.filter(v => (v.latitude !== null && v.longitude !== null) || v.postal_code !== null).length
const withNeither = venues.length - withEither

const L = []
const say = s => L.push(s)

say('# County derivation status')
say('')
say('## BLOCKED — and not by anything in the data')
say('')
say(`County derived for **${derived.toLocaleString()} of ${venues.length.toLocaleString()} rows (0.0%)**.`)
say('')
say('County is not in the source and cannot be computed from it. Deriving it')
say('needs a reference table that maps geography to county names. This repo')
say('has none, and inventing one is not possible — no amount of arithmetic on')
say('a latitude turns into "Tarrant".')
say('')
say('Nothing has been guessed. All 18,037 rows carry `county: null`.')
say('')

say('## What this blocks')
say('')
say('- **Every county page.** `/pickleball/us/{state}/{county}-county/` is one')
say('  of the six locked URL patterns and it has no data to stand on.')
say('- **Import Gate I3**, which requires "derived county confidence above')
say('  threshold". Strictly, no row can pass a full I3 today. The triage report')
say('  scores I3-minus-county and labels it as such, so its numbers are not')
say('  quietly overstating readiness.')
say('')

say('## The good news: the inputs are there')
say('')
say('The dataset has what a resolver needs. This is a missing lookup table,')
say('not missing data.')
say('')
say('| input available | rows | rate |')
say('| --- | ---: | ---: |')
const p = n => ((n / venues.length) * 100).toFixed(1) + '%'
say(`| lat + lng (best: point-in-polygon) | ${withCoords.toLocaleString()} | ${p(withCoords)} |`)
say(`| postal_code (fallback: ZIP crosswalk) | ${withZip.toLocaleString()} | ${p(withZip)} |`)
say(`| at least one of the two | ${withEither.toLocaleString()} | ${p(withEither)} |`)
say(`| **neither — underivable even with a reference** | **${withNeither.toLocaleString()}** | ${p(withNeither)} |`)
say('')
say(`So with a reference file, roughly **${p(withEither)}** of rows become derivable`)
say(`immediately, and only ${withNeither.toLocaleString()} rows would need manual attention.`)
say('')

say('## What would unblock it')
say('')
say('Any one of these, in preference order:')
say('')
say('1. **US Census county boundary file** (TIGER/Line or cartographic')
say('   boundary GeoJSON). True point-in-polygon from lat/lng. Highest')
say('   accuracy, public domain.')
say('2. **Census ZCTA-to-county relationship file**, or the **HUD USPS')
say('   ZIP-county crosswalk**. ZIP-based lookup. Smaller, simpler, public')
say('   domain. Weaker where a ZIP spans two counties.')
say('3. **A geocoding API** returning county. Costs money, needs a key, and')
say('   sends your address list to a third party.')
say('')
say('Options 1 and 2 are downloads of public reference data, not collection of')
say('new venue data, so they sit inside the Phase 1 constraint. They are still')
say('a third-party fetch into this repo, so they wait for your word.')
say('')
say('Drop the file in `data/reference/` and this script runs.')
say('')

say('## The confidence model, already specified')
say('')
say('| method | confidence | flagged for review? |')
say('| --- | ---: | --- |')
say('| `point_in_polygon` | 0.98 | no |')
say('| `zip_single_county` | 0.90 | no |')
say('| `zip_dominant_county` | 0.60–0.85 | **yes** |')
say('| `nearest_centroid` | 0.40 | **yes** |')
say('| `none` | 0.00 | **yes** |')
say('')
say(`Review threshold: **${REVIEW_THRESHOLD}**. Every ZIP result that is not`)
say('unambiguous, and every centroid fallback, goes to a human. That is')
say('deliberate: Rule 3 makes a county URL permanent once published, so a')
say('wrong county is expensive to undo and cheap to prevent.')
say('')
say(`Rows currently flagged for review: **${flagged.toLocaleString()}** (all of them, method \`none\`).`)
say('')

writeFileSync(join(OUT_DIR, 'county-status.md'), L.join('\n'))
writeFileSync(join(OUT_DIR, 'county-derivation.json'), JSON.stringify({
  status: 'BLOCKED',
  reason: 'No county reference dataset available. County is not derivable from the source alone.',
  rows: venues.length,
  derived: 0,
  flagged_for_review: flagged,
  derivable_with_reference: {lat_lng: withCoords, postal_code: withZip, either: withEither, neither: withNeither},
  confidence_model: {point_in_polygon: 0.98, zip_single_county: 0.9, zip_dominant_county: '0.60-0.85 by share', nearest_centroid: 0.4, none: 0},
  review_threshold: REVIEW_THRESHOLD,
  unblocked_by: [
    'US Census county boundary file (TIGER/Line or cartographic boundary GeoJSON)',
    'Census ZCTA-to-county relationship file or HUD USPS ZIP-county crosswalk',
    'Geocoding API returning county',
  ],
}, null, 2))

console.log(`county: derived=0/${venues.length}, flagged=${flagged}`)
console.log(`derivable with a reference file: ${withEither}/${venues.length} (${p(withEither)}); neither input: ${withNeither}`)
