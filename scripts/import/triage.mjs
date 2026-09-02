/*
  Phase 1 deliverables 5 and 6: city-level triage table and verification work
  queue.

  HOW THE GATES ARE SCORED HERE

  I1 Identity   slug present, unique across the dataset, no numeric suffix
                (Rule 10); name, city, state present; street_address present.
                "street_address RESOLVES" is NOT checked - that needs a
                geocoder. Reported as a known gap, not silently passed.

  I2 Provenance NOT SCORED PER ROW because it fails for every row: the only
                source_url points to a competitor and no row has a
                date_checked. It is the universal blocker, so the useful
                question is what would pass if provenance were attached.

  I3 Consistency  total = indoor + outdoor where all three present;
                lat/lng present and inside the state box; postal present and
                agreeing with state. County confidence is a REQUIRED part of
                I3 that cannot be scored - see derive-county.mjs. So an I3
                pass here is I3-minus-county, and is labelled as such.

  I4 Vocabulary  structural pass: no free text leaked into a controlled
                field. The mapper nulls anything unmappable, so this passes
                broadly and is nearly meaningless on its own. What matters is
                COVERAGE, scored separately: does the row actually hold the
                controlled values the filter pages need.
*/

import {writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from '../lib/load-csv.mjs'
import {mapRow} from './mapper.mjs'
import {isOutsideState, zipDisagreesWithState} from '../lib/us-geo.mjs'

const OUT_DIR = join(REPO_ROOT, 'reports')
mkdirSync(OUT_DIR, {recursive: true})

const src = loadRows()
const venues = src.map(r => mapRow(r).venue)

// Slug uniqueness is a dataset-wide property, computed once.
const slugCounts = new Map()
for (const v of venues) slugCounts.set(v.slug, (slugCounts.get(v.slug) ?? 0) + 1)

const gateI1 = v =>
  !!v.slug &&
  slugCounts.get(v.slug) === 1 &&
  !/-\d+$/.test(v.slug) &&
  !!v.name && !!v.city && !!v.state && !!v.street_address

const gateI3 = v => {
  if (v.total_courts !== null && v.indoor_courts !== null && v.outdoor_courts !== null) {
    if (v.total_courts !== v.indoor_courts + v.outdoor_courts) return false
  }
  if (v.latitude === null || v.longitude === null) return false
  if (isOutsideState(v.state, v.latitude, v.longitude) === true) return false
  if (v.postal_code === null) return false
  if (zipDisagreesWithState(v.state, v.postal_code) === true) return false
  return true
}

// Structural I4: nothing unmappable survived into a controlled field.
const gateI4 = v =>
  (v.surface === null || typeof v.surface === 'string') &&
  (v.venue_type === null || typeof v.venue_type === 'string') &&
  (v.fee_type === null || typeof v.fee_type === 'string')

const cityKey = v => `${v.city}, ${v.state}`

const cities = new Map()
for (const v of venues) {
  const k = cityKey(v)
  if (!cities.has(k)) {
    cities.set(k, {city: v.city, state: v.state, rows: [], i1: 0, i3: 0, i4: 0, ready: []})
  }
  const c = cities.get(k)
  c.rows.push(v)
  const p1 = gateI1(v), p3 = gateI3(v), p4 = gateI4(v)
  if (p1) c.i1++
  if (p3) c.i3++
  if (p4) c.i4++
  if (p1 && p3 && p4) c.ready.push(v)
}

/* Pages a city would unlock, if provenance were attached to its ready rows. */
const pagesFor = c => {
  const r = c.ready
  if (r.length < 3) return {city: 0, filters: 0, venues: 0, total: 0, filterNames: []}
  const f = []
  if (r.filter(v => v.indoor_courts !== null && v.indoor_courts >= 1).length >= 3) f.push('indoor')
  if (r.filter(v => v.outdoor_courts !== null && v.outdoor_courts >= 1).length >= 3) f.push('outdoor')
  if (r.filter(v => v.fee_type === 'free').length >= 3) f.push('free')
  if (r.filter(v => v.access_type === 'public').length >= 3) f.push('public')
  if (r.filter(v => v.light === true).length >= 3) f.push('lights')
  return {city: 1, filters: f.length, venues: r.length, total: 1 + f.length + r.length, filterNames: f}
}

const table = [...cities.values()].map(c => {
  const p = pagesFor(c)
  return {
    city: c.city,
    state: c.state,
    total_rows: c.rows.length,
    pass_i1: c.i1,
    pass_i3: c.i3,
    pass_i4: c.i4,
    ready: c.ready.length,
    meets_threshold: c.ready.length >= 3,
    pages_unlocked: p.total,
    filters: p.filterNames,
    // Effort = rows that would need a real source attached.
    effort_rows: c.ready.length,
    efficiency: c.ready.length ? +(p.total / c.ready.length).toFixed(3) : 0,
  }
})

table.sort((a, b) => b.pages_unlocked - a.pages_unlocked || b.ready - a.ready)

const totalCities = table.length
const eligible = table.filter(t => t.meets_threshold)
const totalPagesIfVerified = eligible.reduce((a, t) => a + t.pages_unlocked, 0)
const totalEffort = eligible.reduce((a, t) => a + t.effort_rows, 0)

/* Work queue: the metros where the least attachment work unlocks the most
   pages. Ranked by pages first (they must be worth doing at all), then by
   efficiency, then capped at 100 per the sequencing rule. */
const queue = eligible
  .slice()
  .sort((a, b) => b.pages_unlocked - a.pages_unlocked || b.efficiency - a.efficiency)
  .slice(0, 100)

const L = []
const say = s => L.push(s)

say('# City triage and verification work queue')
say('')
say('Generated from `data.csv`. Read-only.')
say('')
say('## The headline answers')
say('')
say('**How many cities could I publish today?**')
say('')
say('# 0')
say('')
say('Not one. Rule 8 requires 3+ **verified** venues and Rule 12 keeps every')
say('row `pending` until it has a verified address, a verified court count, a')
say('`source_url` and a `date_checked`. No row in this dataset has a')
say('qualifying source or any date at all, so no row is verified, so no city,')
say('county or filter page can lawfully exist.')
say('')
say('**How many cities are gated ONLY by missing provenance?**')
say('')
say(`# ${eligible.length.toLocaleString()}`)
say('')
say(`Out of ${totalCities.toLocaleString()} cities present in the data,`)
say(`**${eligible.length.toLocaleString()}** have 3 or more rows that already pass I1, I3-minus-county`)
say('and I4. Those cities need nothing except a real source and a check date')
say('attached to their rows.')
say('')
say(`If every one of those rows were verified, it would unlock **${totalPagesIfVerified.toLocaleString()} pages**`)
say(`from **${totalEffort.toLocaleString()} row verifications**.`)
say('')
say('That figure excludes county pages entirely, because `county` cannot be')
say('derived yet — see `reports/county-status.md`.')
say('')

say('## Dataset-wide gate pass rates')
say('')
const p1 = venues.filter(gateI1).length
const p3 = venues.filter(gateI3).length
const p4 = venues.filter(gateI4).length
const pAll = venues.filter(v => gateI1(v) && gateI3(v) && gateI4(v)).length
const pctN = n => ((n / venues.length) * 100).toFixed(1) + '%'
say('| gate | rows passing | rate |')
say('| --- | ---: | ---: |')
say(`| I1 Identity | ${p1.toLocaleString()} | ${pctN(p1)} |`)
say(`| I2 Provenance | **0** | **0.0%** |`)
say(`| I3 Consistency (minus county) | ${p3.toLocaleString()} | ${pctN(p3)} |`)
say(`| I4 Vocabulary (structural) | ${p4.toLocaleString()} | ${pctN(p4)} |`)
say(`| I1 + I3 + I4 together | ${pAll.toLocaleString()} | ${pctN(pAll)} |`)
say(`| **All four gates** | **0** | **0.0%** |`)
say('')
say('I4 passes broadly because the mapper refuses to write free text into a')
say('controlled field — it nulls it instead. That makes a structural I4 pass')
say('nearly free and nearly meaningless. Coverage is the real measure:')
say('')
const cov = f => venues.filter(v => v[f] !== null).length
say('| controlled field | rows with a value | coverage |')
say('| --- | ---: | ---: |')
for (const f of ['surface', 'venue_type', 'fee_type', 'access_type', 'play_format']) {
  say(`| \`${f}\` | ${cov(f).toLocaleString()} | ${pctN(cov(f))} |`)
}
say('')

say('## City triage table')
say('')
say('Sorted by pages unlocked. Full table in `reports/city-triage.json` and')
say('`reports/city-triage.csv`.')
say('')
say('| # | city | rows | I1 | I3 | I4 | ready | pages | filters |')
say('| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |')
table.slice(0, 60).forEach((t, i) => {
  say(`| ${i + 1} | ${t.city}, ${t.state} | ${t.total_rows} | ${t.pass_i1} | ${t.pass_i3} | ${t.pass_i4} | ${t.ready} | ${t.pages_unlocked} | ${t.filters.join(' ') || '—'} |`)
})
say('')
say(`*Showing 60 of ${totalCities.toLocaleString()} cities.*`)
say('')

say('## Verification work queue — the Phase 3 to 7 set')
say('')
say('The metros where attaching provenance unlocks the most pages. Capped at')
say('100 by the sequencing rule: verify and publish 50-100 metros to a')
say('complete standard, prove the template ranks, and only then release more.')
say('')
say(`Queue length: **${queue.length}** metros.`)
say(`Rows to verify across the queue: **${queue.reduce((a, t) => a + t.effort_rows, 0).toLocaleString()}**.`)
say(`Pages unlocked if all are verified: **${queue.reduce((a, t) => a + t.pages_unlocked, 0).toLocaleString()}**.`)
say('')
say('| rank | metro | rows to verify | pages unlocked | pages per row |')
say('| ---: | --- | ---: | ---: | ---: |')
queue.forEach((t, i) => {
  say(`| ${i + 1} | ${t.city}, ${t.state} | ${t.effort_rows} | ${t.pages_unlocked} | ${t.efficiency} |`)
})
say('')

writeFileSync(join(OUT_DIR, 'city-triage.md'), L.join('\n'))
writeFileSync(join(OUT_DIR, 'city-triage.json'), JSON.stringify({
  generated_from: 'data.csv',
  total_rows: venues.length,
  total_cities: totalCities,
  publishable_today: 0,
  gated_only_by_provenance: eligible.length,
  pages_if_all_verified: totalPagesIfVerified,
  row_verifications_required: totalEffort,
  gate_pass: {i1: p1, i2: 0, i3_minus_county: p3, i4_structural: p4, i1_i3_i4: pAll, all_four: 0},
  cities: table,
  work_queue: queue,
}, null, 2))

const csv = ['city,state,total_rows,pass_i1,pass_i3,pass_i4,ready,meets_threshold,pages_unlocked,filters']
  .concat(table.map(t => [
    JSON.stringify(t.city), t.state, t.total_rows, t.pass_i1, t.pass_i3, t.pass_i4,
    t.ready, t.meets_threshold, t.pages_unlocked, JSON.stringify(t.filters.join(' ')),
  ].join(',')))
writeFileSync(join(OUT_DIR, 'city-triage.csv'), csv.join('\n'))

console.log(`cities=${totalCities} eligible=${eligible.length} pagesIfVerified=${totalPagesIfVerified} effort=${totalEffort}`)
console.log(`gates: I1=${p1} I3=${p3} I4=${p4} I1+I3+I4=${pAll} allFour=0`)
console.log(`queue=${queue.length} metros, ${queue.reduce((a, t) => a + t.effort_rows, 0)} rows, ${queue.reduce((a, t) => a + t.pages_unlocked, 0)} pages`)
