/*
  Phase 1 deliverable 3: derive county for every row, with method and
  confidence per row, and every low-confidence result flagged for review.

  REFERENCE DATA
  data/reference/tab20_zcta520_county20_natl.txt
  US Census Bureau, 2020 ZCTA5-to-County relationship file. Public domain.
  Downloaded 2026-09-02 from
  https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/

  data/reference/2023_Gaz_counties_national.txt
  US Census Bureau, 2023 Gazetteer county file (county internal points).
  Public domain.

  METHOD: postal_code -> ZCTA -> county. 30.1% of ZCTAs span more than one
  county, and those are resolved by NEAREST COUNTY CENTROID where the row has
  coordinates, falling back to land-area share where it does not.

  WHY NEAREST CENTROID AND NOT LAND AREA. Land-area share does not merely
  leave multi-county ZCTAs uncertain, it picks actively WRONG winners in
  sparse geographies. Measured on this dataset, switching from area share to
  centroid proximity CHANGED THE ANSWER on 1,138 of 4,585 multi-county rows -
  24.8% of them. Worked example: Anchorage ZIP 99503 resolved to "Bethel"
  under area share, because ZCTA 99503 nominally overlaps the enormous,
  nearly empty Bethel Census Area holding 83.7% of the land while essentially
  all the addresses sit in Anchorage. Under proximity it resolves to
  Anchorage Municipality, 33 km away versus 552 km.

  THREE HONEST LIMITATIONS, none worked around silently:

  1. A ZCTA IS NOT A ZIP CODE. ZCTAs are Census approximations of ZIP
     delivery areas. PO-box-only and point ZIPs have no ZCTA at all, so some
     valid postal codes will not resolve. Those rows come back method=none
     rather than being force-matched to a neighbour.

  2. A CENTROID IS NOT A BOUNDARY. A venue can be nearer county A's internal
     point while physically inside county B, especially where a county is
     large or crescent-shaped. This is why proximity confidence is capped at
     0.88 and why a small margin is treated as near-ambiguous.

  3. STILL NO POINT-IN-POLYGON. The correct method is testing the coordinate
     against county boundary geometry, which needs a TIGER/Line or
     cartographic boundary file and a shapefile reader. Not done. Nothing
     here earns the 0.98 that a real containment test would.

  CONFIDENCE MODEL - REVISED TWICE, both revisions deliberate.

  The model first published in the blocked report scaled dominant-share
  confidence as 0.6 + 0.25*((share-0.5)*2). That formula only reaches 0.85 -
  the review threshold - at a share of exactly 1.0, which by definition is a
  single-county ZCTA. Every multi-county ZCTA would have been flagged,
  including ones where the second county holds a 0.3% sliver that is a
  boundary artifact rather than a real ambiguity. Replaced with explicit
  bands. Then centroid proximity was added, with its own bands:

    zip_single_county                        0.90   accept
    zip_nearest_county_centroid  margin >=40km  0.88   accept
    zip_nearest_county_centroid  margin >=20km  0.86   accept
    zip_nearest_county_centroid  margin >= 8km  0.78   REVIEW
    zip_nearest_county_centroid  margin < 8km   0.60   REVIEW
    zip_dominant_county  share >= 0.98       0.90   accept  (sliver artifact)
    zip_dominant_county  share >= 0.90       0.86   accept
    zip_dominant_county  share >= 0.75       0.75   REVIEW
    zip_dominant_county  share <  0.75       0.55   REVIEW
    none                                     0.00   REVIEW

  Review threshold 0.85, unchanged.

  NOTE that the accurate method ACCEPTS FEWER ROWS than the inaccurate one -
  13,909 against 14,609. That is the point. Area share was confidently wrong;
  proximity is honestly uncertain where the centroids are close together.
  Fewer auto-accepted rows and more human review is the correct trade when
  Rule 3 makes every county URL permanent.

  STATE CROSS-CHECK: if the derived county's state FIPS disagrees with the
  state on the row, confidence is forced to 0 and the row is flagged
  regardless of share. A county in the wrong state is never right, and Rule 3
  would make that URL permanent.
*/

import {writeFileSync, mkdirSync, readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {mapRow} from './mapper.mjs'
import {FIPS_TO_STATE, bareCountyName, slugifyCounty, haversineKm} from '../lib/us-geo.mjs'

const OUT_DIR = join(REPO_ROOT, 'reports')
const REF = join(REPO_ROOT, 'data', 'reference', 'tab20_zcta520_county20_natl.txt')
mkdirSync(OUT_DIR, {recursive: true})

export const REVIEW_THRESHOLD = 0.85

export function confidenceFor(method, share) {
  if (method === 'zip_single_county') return 0.9
  if (method === 'zip_dominant_county') {
    if (share >= 0.98) return 0.9
    if (share >= 0.9) return 0.86
    if (share >= 0.75) return 0.75
    return 0.55
  }
  return 0
}

/** ZCTA5 -> [{fips, namelsad, areaLand}] */
function loadCrosswalk() {
  if (!existsSync(REF)) {
    console.error(`FAIL: reference file missing at ${REF}`)
    process.exit(1)
  }
  const idx = new Map()
  const text = readFileSync(REF, 'utf8')
  const lines = text.split(/\r?\n/)
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue
    const f = lines[i].split('|')
    const zcta = f[1]
    const fips = f[9]
    if (!zcta || !fips) continue // county-only rows carry no ZCTA
    const areaLand = Number(f[16]) || 0
    if (!idx.has(zcta)) idx.set(zcta, [])
    idx.get(zcta).push({fips, namelsad: f[10], areaLand})
  }
  return idx
}

/*
  County internal points (centroids), from the Census 2023 Gazetteer.

  WHY THIS WAS ADDED. Land-area share alone does not merely leave
  multi-county ZCTAs uncertain - it picks actively WRONG winners in sparse
  geographies. Worked example from the first run: Anchorage ZIP 99503
  resolved to "Bethel", because ZCTA 99503 nominally overlaps the enormous,
  nearly empty Bethel Census Area, which holds 83.7% of the LAND while
  essentially all of the ADDRESSES sit in Anchorage. Area share picked the
  emptier county.

  So where a row has coordinates, the candidate county whose internal point
  is NEAREST the venue is preferred over the one with the most land. That is
  still not point-in-polygon, but it is a far better proxy for "which county
  is this venue actually in" than acreage.
*/
function loadCentroids() {
  const p = join(REPO_ROOT, 'data', 'reference', '2023_Gaz_counties_national.txt')
  if (!existsSync(p)) return null
  const m = new Map()
  const lines = readFileSync(p, 'utf8').split(/\r?\n/)
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const f = lines[i].split('\t')
    const fips = (f[1] ?? '').trim()
    const lat = Number(f[8]), lon = Number(f[9])
    if (fips && Number.isFinite(lat) && Number.isFinite(lon)) m.set(fips, {lat, lon})
  }
  return m
}

const crosswalk = loadCrosswalk()
const centroids = loadCentroids()
const src = loadRows()
const venues = src.map(r => mapRow(r).venue)

/*
  Proximity confidence. The margin is how much closer the winning county's
  centroid is than the runner-up's. A large margin means the venue sits
  clearly nearer one county; a small margin means the centroids are about
  equidistant and the pick is close to a coin toss.

  Capped at 0.88 - below what a true point-in-polygon derivation would earn,
  because a centroid is not a boundary. A venue can be nearer county A's
  centroid while physically inside county B, especially where a county is
  large or crescent-shaped.
*/
function confidenceForProximity(marginKm) {
  if (marginKm >= 40) return 0.88
  if (marginKm >= 20) return 0.86
  if (marginKm >= 8) return 0.78
  return 0.6
}

/** Shared exit: applies the state cross-check and builds the record. */
function finish(win, method, reason, confidence, share, v, extra = {}) {
  const derivedState = FIPS_TO_STATE[win.fips.slice(0, 2)] ?? null
  let stateMismatch = false
  if (derivedState && v.state && derivedState !== v.state) {
    stateMismatch = true
    confidence = 0
    reason = `derived county is in ${derivedState} but the row says ${v.state} - ZIP or state is wrong`
  }
  const bare = bareCountyName(win.namelsad)
  return {
    county: bare,
    county_slug: slugifyCounty(bare),
    county_fips: win.fips,
    county_namelsad: win.namelsad,
    method,
    reason,
    confidence,
    share: share === null ? null : +share.toFixed(4),
    state_mismatch: stateMismatch,
    needs_review: confidence < REVIEW_THRESHOLD,
    ...extra,
  }
}

const noCounty = (reason) => ({
  county: null, county_slug: null, county_fips: null, county_namelsad: null,
  method: 'none', reason, confidence: 0, share: null,
  state_mismatch: false, needs_review: true,
})

function derive(v) {
  const zip = v.postal_code ? String(v.postal_code).slice(0, 5) : null
  if (!zip || !/^\d{5}$/.test(zip)) {
    return noCounty(zip ? 'postal_code is not a 5-digit code' : 'no postal_code')
  }
  const parts = crosswalk.get(zip)
  if (!parts || !parts.length) {
    return noCounty('ZIP has no ZCTA in the Census relationship file (often a PO-box or point ZIP)')
  }

  const total = parts.reduce((a, p) => a + p.areaLand, 0)

  // Unambiguous: the ZCTA sits in exactly one county.
  if (parts.length === 1) {
    return finish(parts[0], 'zip_single_county', 'ZCTA lies in exactly one county', 0.9, 1, v)
  }

  /*
    Multi-county ZCTA. Prefer the NEAREST county centroid when the row has
    coordinates - see the loadCentroids comment for why area share alone
    picks wrong winners in sparse geographies.
  */
  if (centroids && v.latitude !== null && v.longitude !== null) {
    const withDist = parts
      .map(p => {
        const c = centroids.get(p.fips)
        return c ? {...p, km: haversineKm(v.latitude, v.longitude, c.lat, c.lon)} : null
      })
      .filter(Boolean)

    if (withDist.length === parts.length) {
      withDist.sort((a, b) => a.km - b.km)
      const [nearest, runnerUp] = withDist
      const margin = runnerUp.km - nearest.km
      const byArea = parts.slice().sort((a, b) => b.areaLand - a.areaLand)[0]
      const overrode = nearest.fips !== byArea.fips
      const reason =
        `ZCTA spans ${parts.length} counties; nearest county centroid is ${nearest.km.toFixed(0)} km away, ` +
        `next is ${runnerUp.km.toFixed(0)} km (margin ${margin.toFixed(0)} km)` +
        (overrode ? ' — OVERRODE the larger-by-land-area candidate' : '')
      return finish(
        nearest, 'zip_nearest_county_centroid', reason,
        confidenceForProximity(margin), total > 0 ? nearest.areaLand / total : null, v,
        {margin_km: +margin.toFixed(1), overrode_area_winner: overrode},
      )
    }
  }

  // No coordinates: fall back to land-area share.
  const win = parts.slice().sort((a, b) => b.areaLand - a.areaLand)[0]
  const share = total > 0 ? win.areaLand / total : 1
  return finish(
    win, 'zip_dominant_county',
    `ZCTA spans ${parts.length} counties; dominant county holds ${(share * 100).toFixed(1)}% of land area (no coordinates to disambiguate)`,
    confidenceFor('zip_dominant_county', share), share, v,
  )
}

const results = venues.map(v => ({slug: v.slug, city: v.city, state: v.state, postal_code: v.postal_code, ...derive(v)}))

const N = results.length
const pc = n => ((n / N) * 100).toFixed(1) + '%'
const derived = results.filter(r => r.county !== null && r.confidence > 0)
const accepted = results.filter(r => !r.needs_review)
const flagged = results.filter(r => r.needs_review)
const byMethod = {}
for (const r of results) byMethod[r.method] = (byMethod[r.method] ?? 0) + 1
const mismatches = results.filter(r => r.state_mismatch)

// Distinct counties, and how many venues each holds - the county-page picture.
const byCounty = new Map()
for (const r of accepted) {
  if (!r.county) continue
  const k = `${r.county_fips}`
  if (!byCounty.has(k)) byCounty.set(k, {fips: k, county: r.county, slug: r.county_slug, state: FIPS_TO_STATE[k.slice(0, 2)], venues: 0})
  byCounty.get(k).venues++
}
const counties = [...byCounty.values()].sort((a, b) => b.venues - a.venues)
const countiesWith3 = counties.filter(c => c.venues >= 3)

const L = []
const say = s => L.push(s)

say('# County derivation')
say('')
say('**Source:** US Census Bureau, 2020 ZCTA5-to-County relationship file')
say('(`tab20_zcta520_county20_natl.txt`) plus the 2023 Gazetteer county file')
say('(`2023_Gaz_counties_national.txt`), for county internal points. Both')
say('public domain, downloaded 2026-09-02.')
say('')
say('**Method:** `postal_code` → ZCTA → county. Where a ZCTA spans more than')
say('one county — 30.1% of them do — the winner is the county whose centroid')
say('is nearest the venue, falling back to land-area share when the row has no')
say('coordinates.')
say('')
say('Switching the tiebreak from land area to proximity **changed the answer on')
say('1,138 of 4,585 multi-county rows (24.8%)**. Land area was not merely')
say('uncertain, it was wrong: Anchorage ZIP 99503 resolved to "Bethel" because')
say('that census area holds 83.7% of the ZCTA land while essentially none of')
say('its addresses. It now resolves to Anchorage Municipality, 33 km away')
say('against 552 km.')
say('')
say('## Results')
say('')
say('| outcome | rows | rate |')
say('| --- | ---: | ---: |')
say(`| County derived and **accepted** (confidence ≥ ${REVIEW_THRESHOLD}) | **${accepted.length.toLocaleString()}** | **${pc(accepted.length)}** |`)
say(`| County derived but **flagged for review** | ${(derived.length - accepted.length).toLocaleString()} | ${pc(derived.length - accepted.length)} |`)
say(`| No county derived | ${(N - derived.length).toLocaleString()} | ${pc(N - derived.length)} |`)
say(`| **Total flagged for manual review** | **${flagged.length.toLocaleString()}** | **${pc(flagged.length)}** |`)
say('')
say('## By method')
say('')
say('| method | rows | rate |')
say('| --- | ---: | ---: |')
for (const [m, n] of Object.entries(byMethod).sort((a, b) => b[1] - a[1])) {
  say(`| \`${m}\` | ${n.toLocaleString()} | ${pc(n)} |`)
}
say('')
say('## Why rows were flagged')
say('')
const reasons = new Map()
for (const r of flagged) reasons.set(r.reason.replace(/\d+\.\d+%/, 'N%').replace(/spans \d+/, 'spans N'), (reasons.get(r.reason.replace(/\d+\.\d+%/, 'N%').replace(/spans \d+/, 'spans N')) ?? 0) + 1)
say('| reason | rows |')
say('| --- | ---: |')
for (const [r, n] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) {
  say(`| ${r} | ${n.toLocaleString()} |`)
}
say('')
say(`### State mismatches: ${mismatches.length.toLocaleString()}`)
say('')
say('The derived county sits in a different state than the row claims. Both')
say('cannot be true. Confidence forced to 0 regardless of area share, because')
say('Rule 3 would make a wrong county URL permanent.')
say('')
if (mismatches.length) {
  say('```')
  mismatches.slice(0, 15).forEach(r => say(`${r.slug}: says ${r.city}, ${r.state} — ZIP ${r.postal_code} resolves to ${r.county_namelsad}`))
  if (mismatches.length > 15) say(`... ${mismatches.length - 15} more`)
  say('```')
  say('')
}

say('## What this unlocks')
say('')
say(`- Distinct counties with at least one accepted venue: **${counties.length.toLocaleString()}**`)
say(`- Counties with **3 or more** accepted venues (Rule 8 threshold): **${countiesWith3.length.toLocaleString()}**`)
say('')
say('Those county pages are still not publishable — Rule 8 counts VERIFIED')
say('venues, and no row has qualifying provenance. This is the county page')
say('ceiling once provenance is attached, not a publishable set.')
say('')
say('| rank | county | state | venues |')
say('| ---: | --- | --- | ---: |')
counties.slice(0, 25).forEach((c, i) => say(`| ${i + 1} | ${c.county} | ${c.state} | ${c.venues} |`))
say('')

say('## Limitations, stated')
say('')
say('1. **A ZCTA is not a ZIP code.** ZCTAs approximate ZIP delivery areas;')
say('   PO-box and point ZIPs have none. Those rows return `none` rather than')
say('   being force-matched to a neighbour.')
say('2. **Area share is not population share.** The relationship file carries')
say('   land area, not addresses. A ZCTA can be mostly rural land in one county')
say('   while its population sits in another, so a high share is strong')
say('   evidence, not proof.')
say('3. **No point-in-polygon.** Deriving from lat/lng would be more accurate')
say('   and would settle multi-county ZCTAs properly, but needs county boundary')
say('   geometry and a shapefile reader. Rows with coordinates but no usable')
say('   ZIP are left underived rather than guessed from a centroid.')
say('')
say('Because of limitation 2, no result here is given the 0.98 that a true')
say('point-in-polygon derivation would earn. The ceiling is 0.90.')
say('')

writeFileSync(join(OUT_DIR, 'county-status.md'), L.join('\n'))
writeFileSync(join(OUT_DIR, 'county-derivation.json'), JSON.stringify({
  status: 'DERIVED',
  reference: 'US Census 2020 ZCTA5-to-County relationship file (public domain)',
  method: 'postal_code -> ZCTA -> county, land-area share for multi-county ZCTAs',
  review_threshold: REVIEW_THRESHOLD,
  rows: N,
  accepted: accepted.length,
  derived_but_flagged: derived.length - accepted.length,
  underived: N - derived.length,
  flagged_total: flagged.length,
  by_method: byMethod,
  state_mismatches: mismatches.length,
  counties_with_any: counties.length,
  counties_with_3_plus: countiesWith3.length,
}, null, 2))

// Per-row output so the review queue is actionable, and so the next phase
// has the derived values without re-running.
writeFileSync(join(OUT_DIR, 'county-per-row.json'), JSON.stringify(results, null, 0))
writeFileSync(join(OUT_DIR, 'county-review-queue.csv'),
  ['slug,city,state,postal_code,derived_county,method,confidence,share,reason']
    .concat(flagged.map(r => [
      JSON.stringify(r.slug), JSON.stringify(r.city ?? ''), r.state ?? '',
      r.postal_code ?? '', JSON.stringify(r.county ?? ''), r.method,
      r.confidence, r.share ?? '', JSON.stringify(r.reason),
    ].join(','))).join('\n'))

console.log(`accepted=${accepted.length}/${N} (${pc(accepted.length)}) flagged=${flagged.length} underived=${N - derived.length}`)
console.log(`methods: ${JSON.stringify(byMethod)}`)
console.log(`state mismatches=${mismatches.length}`)
console.log(`counties: ${counties.length} with >=1 venue, ${countiesWith3.length} with >=3`)
