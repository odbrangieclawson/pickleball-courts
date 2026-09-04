/*
  Phase 1B: generate the per-metro verification packets and the completeness
  dashboard.

  Reads the work queue produced in Phase 1 and, for each metro, writes:
    verification/<metro>-plan.md        the prioritised source ladder
    verification/<metro>-worksheet.csv  one row per venue per field
  plus, across all metros:
    reports/completeness.md / .json     deliverable 5

  THE HARD RULE, enforced in code, not prose:
  a metro is not done until 3 or more venues pass ALL FOUR import gates.
  metroStatus() returns 'blocked' until that is true, and there is no
  partial-publish state for it to return instead.
*/

import {writeFileSync, mkdirSync, existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {mapRow} from '../import/mapper.mjs'
import {isOutsideState, zipDisagreesWithState} from '../lib/us-geo.mjs'
import {passesI2} from './provenance.mjs'
import {ladderFor, orderVenues, writeWorksheet} from './source-ladder.mjs'
import {loadVerifiedOverlay, applyVerifiedOverlay} from '../../lib/data/verified.mjs'

const OUT_REPORTS = join(REPO_ROOT, 'reports')
const OUT_VERIFY = join(REPO_ROOT, 'verification')
mkdirSync(OUT_REPORTS, {recursive: true})
mkdirSync(OUT_VERIFY, {recursive: true})

const METRO_LIMIT = Number(process.env.METRO_LIMIT ?? 100)

const src = loadRows()
/*
  THE OVERLAY IS APPLIED HERE, AND WAS NOT UNTIL 2026-09-04.

  This dashboard reads data.csv, and data.csv is the record of what ARRIVED.
  Verified facts live in an overlay under data/verified/ and are laid over
  those rows everywhere else in the project — so for eight published cities
  this report was reading the pre-verification version of rows that had been
  verified, and reporting them as blocked on provenance they now carry.

  The number it printed was "Metros ready to publish: 0 of 100", on the day
  the site published thirty-nine venues in Washington alone. PHASES.md calls
  this dashboard "the one to watch", which is precisely why a stale zero here
  is worse than no dashboard: it is a green light pointing the wrong way.
*/
const imported = src.map(r => mapRow(r).venue)

/*
  ORDER MATTERS HERE, AND GETTING IT WRONG IS SILENT.

  The Phase 1 county derivation is indexed by CSV ROW POSITION — county[i]
  belongs to imported[i] and to nothing else. The overlay does not preserve
  that indexing: applyVerifiedOverlay() APPENDS the venues that were minted
  from a source rather than matched to a row, so its output is longer than
  data.csv (18,080 against 18,037 today).

  The first version of this fix applied the overlay first and then compared
  lengths, which no longer matched, so the guard fell through to "no county
  derived for any row" and every venue in the country failed Import Gate I3.
  The dashboard still printed a number. It was just a different wrong number
  than before.

  So: derive county onto the imported rows while the indexes still line up,
  THEN lay the verified facts over them.
*/
const countyPath = join(OUT_REPORTS, 'county-per-row.json')
const county = existsSync(countyPath) ? JSON.parse(readFileSync(countyPath, 'utf8')) : null
if (county && county.length === imported.length) {
  imported.forEach((v, i) => {
    v.county = county[i].needs_review ? null : county[i].county
    v._county_ok = !county[i].needs_review && county[i].county !== null
  })
} else {
  imported.forEach(v => { v._county_ok = false })
}

const {byKey: verifiedByKey} = loadVerifiedOverlay(REPO_ROOT)
const venues = applyVerifiedOverlay(imported, verifiedByKey).venues

/*
  A county from a verify run beats the derivation, and a minted venue has no
  derivation at all. Both came from the Census geocoder matching a street
  address; the Phase 1 backfill is a ZCTA lookup with a confidence score and
  a 16.7% review rate. Where a row carries a source, its county is verified.
*/
for (const v of venues) {
  if (v.county && v.source_url) v._county_ok = true
  else if (v._county_ok === undefined) v._county_ok = false
}

const slugCounts = new Map()
for (const v of venues) slugCounts.set(v.slug, (slugCounts.get(v.slug) ?? 0) + 1)

/* ---- the four gates, each returning its reasons ---- */

export function gateI1(v) {
  const p = []
  if (!v.slug) p.push('no slug')
  else if (slugCounts.get(v.slug) > 1) p.push('slug is not unique')
  else if (/-\d+$/.test(v.slug)) p.push('slug has a numeric suffix (Rule 10)')
  if (!v.name) p.push('no name')
  if (!v.city) p.push('no city')
  if (!v.state) p.push('no state')
  if (!v.street_address) p.push('no street_address')
  // "street_address resolves" needs a geocoder and is NOT checked here.
  return {pass: p.length === 0, problems: p, unchecked: ['street_address resolves (needs a geocoder)']}
}

export function gateI3(v) {
  const p = []
  if (v.total_courts !== null && v.indoor_courts !== null && v.outdoor_courts !== null
      && v.total_courts !== v.indoor_courts + v.outdoor_courts) {
    p.push(`total_courts ${v.total_courts} != indoor ${v.indoor_courts} + outdoor ${v.outdoor_courts}`)
  }
  if (v.latitude === null || v.longitude === null) p.push('missing lat/lng')
  else if (isOutsideState(v.state, v.latitude, v.longitude) === true) p.push('lat/lng outside the stated state')
  if (v.postal_code === null) p.push('no postal_code')
  else if (zipDisagreesWithState(v.state, v.postal_code) === true) p.push('postal_code disagrees with state')
  if (!v._county_ok) p.push('county not derived above confidence threshold')
  return {pass: p.length === 0, problems: p}
}

export function gateI4(v) {
  const p = []
  const sets = {
    fee_type: ['free', 'donation', 'permit_required', 'drop_in_fee', 'reservation_fee', 'membership_required'],
    surface: ['asphalt', 'concrete', 'acrylic', 'cushioned_acrylic', 'modular_tile', 'wood', 'synthetic_indoor', 'clay', 'grass'],
    venue_type: ['public_park', 'community_center', 'dedicated_pickleball_facility', 'racquet_club', 'fitness_center', 'school', 'nonprofit_recreation', 'faith_facility', 'residential_community', 'resort_hotel', 'entertainment_venue'],
  }
  for (const [f, allowed] of Object.entries(sets)) {
    if (v[f] !== null && !allowed.includes(v[f])) p.push(`${f} "${v[f]}" is not in the controlled set`)
  }
  if (v.play_format !== null && !Array.isArray(v.play_format)) p.push('play_format is not an array')
  return {pass: p.length === 0, problems: p}
}

export function gateI2(v) {
  const r = passesI2(v)
  return {pass: r.pass, problems: r.problems}
}

export function gateAll(v) {
  const g = {I1: gateI1(v), I2: gateI2(v), I3: gateI3(v), I4: gateI4(v)}
  return {...g, allPass: g.I1.pass && g.I2.pass && g.I3.pass && g.I4.pass}
}

/** THE HARD RULE. No partial state exists. */
export function metroStatus(verifiedCount) {
  return verifiedCount >= 3
    ? {status: 'ready', publishable: true}
    : {status: 'blocked', publishable: false, reason: `${verifiedCount} venue(s) pass all four gates, needs 3`}
}

/* ---- build ---- */

const queuePath = join(OUT_REPORTS, 'city-triage.json')
if (!existsSync(queuePath)) {
  console.error('FAIL: reports/city-triage.json missing. Run `npm run import:triage` first.')
  process.exit(1)
}
const triage = JSON.parse(readFileSync(queuePath, 'utf8'))
const queue = triage.work_queue.slice(0, METRO_LIMIT)

const byCity = new Map()
for (const v of venues) {
  const k = `${v.city}, ${v.state}`
  if (!byCity.has(k)) byCity.set(k, [])
  byCity.get(k).push(v)
}

const dash = []
let generated = 0

for (const metro of queue) {
  const key = `${metro.city}, ${metro.state}`
  const all = byCity.get(key) ?? []
  const ordered = orderVenues(all)
  const ladder = ladderFor(metro)
  writeWorksheet(OUT_VERIFY, metro, ordered, ladder)
  generated++

  const gated = all.map(v => ({v, g: gateAll(v)}))
  const verified = gated.filter(x => x.g.allPass).length
  const status = metroStatus(verified)

  const blockedBy = {I1: 0, I2: 0, I3: 0, I4: 0}
  const reasons = new Map()
  for (const {g} of gated) {
    for (const k of ['I1', 'I2', 'I3', 'I4']) {
      if (!g[k].pass) {
        blockedBy[k]++
        for (const p of g[k].problems) reasons.set(`${k}: ${p}`, (reasons.get(`${k}: ${p}`) ?? 0) + 1)
      }
    }
  }

  dash.push({
    metro: key, city: metro.city, state: metro.state,
    venues: all.length,
    passing_all_four: verified,
    blocked_by: blockedBy,
    status: status.status,
    publishable: status.publishable,
    reason: status.reason ?? null,
    pages_when_ready: metro.pages_unlocked,
    top_reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => `${r} (${n})`),
  })
}

/* ---- deliverable 5: the dashboard ---- */

const L = []
const say = s => L.push(s)
const totalVenues = dash.reduce((a, m) => a + m.venues, 0)
const ready = dash.filter(m => m.publishable)

say('# Completeness dashboard')
say('')
say(`${dash.length} metros in the verification queue, ${totalVenues.toLocaleString()} venues.`)
say('')
say('## The hard rule')
say('')
say('> A metro is not done until it has at least 3 venues passing all four import')
say('> gates. A partially verified metro does not publish partially — it waits.')
say('')
say(`**Metros ready to publish: ${ready.length} of ${dash.length}.**`)
say('')
if (!ready.length) {
  say('None, and the reason is the same for every metro: **Import Gate I2**. No')
  say('venue anywhere in the dataset has a qualifying `source_url` or any')
  say('`date_checked`. Until source attachment work happens, every metro sits at')
  say('0 of 3 regardless of how clean its other fields are.')
  say('')
  say('This dashboard exists to be re-run as that work lands. The number above is')
  say('the one to watch.')
  say('')
}

/*
  THE QUEUE IS NOT THE SITE.

  This dashboard walks the top 100 metros of the Phase 1 work queue, which is
  ordered by how many pages a metro would unlock. Cities have been published
  by finding a municipal source, not by working down that list, so the two
  sets overlap without matching — and a reader comparing "5 of 100 ready"
  against eight published cities deserves to be told why rather than left to
  wonder which number is broken.
*/
const publishedCities = new Set(
  [...verifiedByKey.values()]
    .map(e => `${e.identity?.city}, ${e.identity?.state}`)
    .filter(k => !k.includes('undefined')))
const inQueue = [...publishedCities].filter(c => dash.some(m => m.metro === c))
const outsideQueue = [...publishedCities].filter(c => !inQueue.includes(c)).sort()

say(`**Published on the site: ${publishedCities.size} cities.** ${inQueue.length} of them are in`)
say(`this queue${outsideQueue.length ? ` and ${outsideQueue.length} are not — ${outsideQueue.join(', ')}` : ''}.`)
say('')
say('The queue is ordered by how many pages a metro would unlock, and cities are')
say('published by finding an operator that states its court counts. Those are')
say('different orderings and they are meant to be: a city with forty rows and no')
say('municipal source is worth less than a city with four rows and a page that')
say('states them. A metro can also read "ready" here on three verified venues')
say('while most of its rows stay unverified — the three are what the threshold')
say('asks for, not the whole city.')
say('')

say('## Per metro')
say('')
say('| # | metro | venues | pass 4/4 | I1 ✗ | I2 ✗ | I3 ✗ | I4 ✗ | status | pages when ready |')
say('| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |')
dash.forEach((m, i) => {
  say(`| ${i + 1} | ${m.metro} | ${m.venues} | ${m.passing_all_four} | ${m.blocked_by.I1} | ${m.blocked_by.I2} | ${m.blocked_by.I3} | ${m.blocked_by.I4} | ${m.publishable ? '**ready**' : 'blocked'} | ${m.pages_when_ready} |`)
})
say('')
say('## What is actually blocking, across the queue')
say('')
const agg = new Map()
for (const m of dash) for (const r of m.top_reasons) {
  const bare = r.replace(/\s\(\d+\)$/, '')
  const n = Number(r.match(/\((\d+)\)$/)?.[1] ?? 0)
  agg.set(bare, (agg.get(bare) ?? 0) + n)
}
say('| blocker | venue-occurrences |')
say('| --- | ---: |')
for (const [r, n] of [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  say(`| ${r.replace(/\|/g, '\\|')} | ${n.toLocaleString()} |`)
}
say('')
say('## Not checked here')
say('')
say('- **`street_address` resolves** (part of I1) needs a geocoder. Reported as')
say('  unchecked rather than assumed to pass.')
say('- **`source_url` reachability** (part of I2) needs a network call, and belongs')
say('  in the fetch step where a dead link stops the extraction.')
say('')

writeFileSync(join(OUT_REPORTS, 'completeness.md'), L.join('\n'))
writeFileSync(join(OUT_REPORTS, 'completeness.json'), JSON.stringify({
  metros: dash.length, venues: totalVenues, ready: ready.length, metro_detail: dash,
}, null, 2))

console.log(`packets written: ${generated} metros -> verification/`)
console.log(`metros ready (3+ passing all four gates): ${ready.length}/${dash.length}`)
console.log(`venues in queue: ${totalVenues}`)
