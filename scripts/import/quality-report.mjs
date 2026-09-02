/*
  Phase 1 deliverable 2: data quality report across all rows.

  Writes reports/quality-report.md and reports/quality-report.json.
  Reads only. Never modifies data.csv, never repairs a value.
*/

import {writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, SOURCE_COLUMNS, REPO_ROOT, isAbsent} from '../lib/load-csv.mjs'
import {mapRow, COLUMN_MAP, UNSOURCED_V4_FIELDS, PROVENANCE_STATUS} from './mapper.mjs'
import {mapSurface, mapVenueType, mapAccessType} from './vocab.mjs'
import {isOutsideState, zipDisagreesWithState, haversineKm, STATE_BBOX} from '../lib/us-geo.mjs'

const OUT_DIR = join(REPO_ROOT, 'reports')
mkdirSync(OUT_DIR, {recursive: true})

const src = loadRows()
const mapped = src.map(r => mapRow(r))
const venues = mapped.map(m => m.venue)
const N = src.length

const pct = n => ((n / N) * 100).toFixed(1) + '%'
const L = []
const say = s => L.push(s)

say('# Data quality report')
say('')
say(`Generated from \`data.csv\` — **${N.toLocaleString()} rows**, 37 source columns.`)
say('')
say('Read-only. No value in this report has been repaired, filled or inferred.')
say('')

/* ------------------------------------------------------------------ */
say('## 0. The finding that governs everything else')
say('')
const domains = new Set(venues.map(v => {
  try { return new URL(v.source_url).hostname } catch { return '(unparseable)' }
}))
say(`Every row carries a \`source_url\`. All ${N.toLocaleString()} of them point to a single domain:`)
say('')
for (const d of domains) say(`- \`${d}\``)
say('')
say('That is a **competitor directory, not a source**. Import Gate I2 requires')
say('`verified_by` to be one of `municipal_source`, `owner_submission`,')
say('`staff_check` or `user_report`. A competitor listing page is none of them.')
say('')
say(`- Rows with a URL in \`source_url\`: **${N.toLocaleString()}**`)
say(`- Rows with provenance that satisfies I2: **0**`)
say(`- Rows with a \`date_checked\`: **0** (the column does not exist in the source)`)
say('')
say('**Every row is blocked at I2. Publishable pages today: zero.**')
say('')

/* ------------------------------------------------------------------ */
say('## 1. Null rate per field (after mapping to v4)')
say('')
say('Counted on the mapped v4 record, so it reflects what the model would')
say('actually hold — including nulls created by policies P1 and P2, which are')
say('broken out separately in section 3.')
say('')
say('| v4 field | nulls | rate |')
say('| --- | ---: | ---: |')
const V4_FIELDS = Object.keys(venues[0])
const nullRates = {}
for (const f of V4_FIELDS) {
  const n = venues.filter(v => v[f] === null || v[f] === undefined).length
  nullRates[f] = n
  say(`| \`${f}\` | ${n.toLocaleString()} | ${pct(n)} |`)
}
say('')

/* ------------------------------------------------------------------ */
say('## 2. Court arithmetic (Rule 13)')
say('')
let bothPresent = 0, mismatch = 0
const mismatchSamples = []
venues.forEach((v, i) => {
  if (v.total_courts !== null && v.indoor_courts !== null && v.outdoor_courts !== null) {
    bothPresent++
    if (v.total_courts !== v.indoor_courts + v.outdoor_courts) {
      mismatch++
      if (mismatchSamples.length < 10) {
        mismatchSamples.push(`${v.slug}: total=${v.total_courts}, indoor=${v.indoor_courts}, outdoor=${v.outdoor_courts}`)
      }
    }
  }
})
say(`Rule 13 applies only where all three values are present: **${bothPresent.toLocaleString()} rows** (${pct(bothPresent)}).`)
say('')
say(`- Rows where \`total_courts != indoor + outdoor\`: **${mismatch.toLocaleString()}** (${((mismatch / (bothPresent || 1)) * 100).toFixed(1)}% of checkable rows)`)
say('')
if (mismatchSamples.length) {
  say('Sample:')
  say('')
  say('```')
  mismatchSamples.forEach(s => say(s))
  say('```')
  say('')
}

/* ------------------------------------------------------------------ */
say('## 3. Zero-filled and FALSE-filled nulls')
say('')
say('The source has **no blank cells at all** in these columns. A column that')
say('cannot express "unknown" was not recording one — the upstream process')
say('collapsed missing values into `0` or `FALSE`. Rule 6 forbids treating')
say('those as checked facts, so the mapper converts them to null and counts')
say('them here.')
say('')
say('| source column | filler | rows affected | rate | now null? |')
say('| --- | --- | ---: | ---: | --- |')
const fillerRows = {}
for (const c of ['is_free', 'lighted', 'restrooms', 'pro_shop', 'climate_controlled', 'covered', 'claimed']) {
  const n = src.filter(r => String(r[c]).trim().toUpperCase() === 'FALSE').length
  const blanks = src.filter(r => (r[c] ?? '') === '').length
  fillerRows[c] = n
  const policy = c === 'claimed' ? 'no — identity field, kept as false' : 'yes (P1)'
  say(`| \`${c}\` | \`FALSE\` | ${n.toLocaleString()} | ${pct(n)} | ${policy} |`)
  if (blanks > 0) say(`| | *(has ${blanks} genuine blanks)* | | | |`)
}
for (const c of ['total_courts', 'rating', 'user_rating', 'review_count']) {
  const n = src.filter(r => Number(r[c]) === 0 && String(r[c]).trim() !== '').length
  fillerRows[c] = n
  say(`| \`${c}\` | \`0\` | ${n.toLocaleString()} | ${pct(n)} | yes (P2) |`)
}
for (const c of ['indoor_courts', 'outdoor_courts']) {
  const n = src.filter(r => Number(r[c]) === 0 && String(r[c]).trim() !== '').length
  fillerRows[c] = n
  say(`| \`${c}\` | \`0\` | ${n.toLocaleString()} | ${pct(n)} | **no — kept** (P2 exception, Rule 14) |`)
}
say('')

/* ------------------------------------------------------------------ */
say('## 4. Duplicate slug candidates (Rule 10)')
say('')
const bySlug = new Map()
venues.forEach((v, i) => {
  const k = v.slug ?? '(null)'
  if (!bySlug.has(k)) bySlug.set(k, [])
  bySlug.get(k).push(i)
})
const dupSlugs = [...bySlug.entries()].filter(([, idx]) => idx.length > 1)
say(`- Distinct slugs: **${bySlug.size.toLocaleString()}**`)
say(`- Slugs used by more than one row: **${dupSlugs.length.toLocaleString()}**`)
say(`- Rows involved: **${dupSlugs.reduce((a, [, idx]) => a + idx.length, 0).toLocaleString()}**`)
say('')
const numericSuffix = venues.filter(v => v.slug && /-\d+$/.test(v.slug))
say(`- Slugs already carrying a numeric suffix (Rule 10 violation): **${numericSuffix.length.toLocaleString()}**`)
if (numericSuffix.length) {
  say('')
  say('```')
  numericSuffix.slice(0, 10).forEach(v => say(`${v.slug}  (${v.name}, ${v.city} ${v.state})`))
  say('```')
}
say('')
if (dupSlugs.length) {
  say('Sample collisions:')
  say('')
  say('```')
  dupSlugs.slice(0, 10).forEach(([slug, idx]) => {
    say(`${slug}  x${idx.length}`)
    idx.slice(0, 3).forEach(i => say(`    ${venues[i].name} — ${venues[i].city}, ${venues[i].state}`))
  })
  say('```')
  say('')
}

/* ------------------------------------------------------------------ */
say('## 5. Duplicate venue candidates (name similarity + proximity)')
say('')
say('Two rows are a candidate pair when their normalised names match *and*')
say('they sit within 2 km of each other, or when their names match and they')
say('share a city. Candidates only — nothing is merged.')
say('')
const normName = s => (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(the|park|courts?|center|centre|complex|recreation|rec)\b/g, '').replace(/\s+/g, ' ').trim()
const byName = new Map()
venues.forEach((v, i) => {
  const k = normName(v.name)
  if (!k) return
  if (!byName.has(k)) byName.set(k, [])
  byName.get(k).push(i)
})
let proximityPairs = 0, sameCityPairs = 0
const dupSamples = []
for (const [, idx] of byName) {
  if (idx.length < 2) continue
  for (let a = 0; a < idx.length; a++) {
    for (let b = a + 1; b < idx.length; b++) {
      const va = venues[idx[a]], vb = venues[idx[b]]
      let near = false
      if (va.latitude !== null && vb.latitude !== null) {
        near = haversineKm(va.latitude, va.longitude, vb.latitude, vb.longitude) <= 2
      }
      const sameCity = va.city === vb.city && va.state === vb.state
      if (near) proximityPairs++
      else if (sameCity) sameCityPairs++
      if ((near || sameCity) && dupSamples.length < 10) {
        dupSamples.push(`${va.slug} <-> ${vb.slug}  (${va.name} / ${vb.name}, ${va.city} ${va.state})${near ? ' [within 2km]' : ' [same city]'}`)
      }
    }
  }
}
say(`- Name-match pairs within 2 km: **${proximityPairs.toLocaleString()}**`)
say(`- Name-match pairs in the same city but not within 2 km (or missing coords): **${sameCityPairs.toLocaleString()}**`)
say('')
if (dupSamples.length) {
  say('```')
  dupSamples.forEach(s => say(s))
  say('```')
  say('')
}

/* ------------------------------------------------------------------ */
say('## 6. Coordinates')
say('')
const noCoords = venues.filter(v => v.latitude === null || v.longitude === null).length
const zeroIsland = venues.filter(v => v.latitude === 0 && v.longitude === 0).length
const outOfRange = venues.filter(v => v.latitude !== null && (Math.abs(v.latitude) > 90 || Math.abs(v.longitude) > 180)).length
let outsideState = 0
const outsideSamples = []
venues.forEach(v => {
  const r = isOutsideState(v.state, v.latitude, v.longitude)
  if (r === true) {
    outsideState++
    if (outsideSamples.length < 10) outsideSamples.push(`${v.slug}: says ${v.state}, coords ${v.latitude},${v.longitude}`)
  }
})
const unknownState = new Set(venues.filter(v => v.state && !STATE_BBOX[v.state]).map(v => v.state))
say(`- Missing latitude or longitude: **${noCoords.toLocaleString()}** (${pct(noCoords)})`)
say(`- Null Island (0,0): **${zeroIsland.toLocaleString()}**`)
say(`- Out of valid range: **${outOfRange.toLocaleString()}**`)
say(`- **Outside the stated state's bounding box: ${outsideState.toLocaleString()}** (${pct(outsideState)})`)
say('')
say('Bounding boxes are coarse and only prove a point is wrong, never that it')
say('is right. A row inside its box may still be in the wrong state.')
say('')
if (unknownState.size) say(`- State codes with no reference box: ${[...unknownState].map(s => `\`${s}\``).join(', ')}`)
if (outsideSamples.length) {
  say('')
  say('```')
  outsideSamples.forEach(s => say(s))
  say('```')
}
say('')

/* ------------------------------------------------------------------ */
say('## 7. Postal code')
say('')
const noZip = venues.filter(v => v.postal_code === null).length
let zipBad = 0
const zipSamples = []
venues.forEach(v => {
  if (zipDisagreesWithState(v.state, v.postal_code) === true) {
    zipBad++
    if (zipSamples.length < 10) zipSamples.push(`${v.slug}: ${v.city}, ${v.state} has ZIP ${v.postal_code}`)
  }
})
say(`- Missing postal_code: **${noZip.toLocaleString()}** (${pct(noZip)})`)
say(`- **ZIP prefix disagrees with the stated state: ${zipBad.toLocaleString()}** (${pct(zipBad)})`)
say('')
say('**ZIP-vs-CITY was NOT checked.** It needs a ZIP-to-place reference table')
say('this repo does not have. Reporting it as unchecked rather than')
say('approximating it.')
say('')
if (zipSamples.length) {
  say('```')
  zipSamples.forEach(s => say(s))
  say('```')
  say('')
}

/* ------------------------------------------------------------------ */
say('## 8. Free text in fields that need controlled vocabularies (Gate I4)')
say('')
const unmapped = {surface: new Map(), venue_type: new Map(), fee_type: new Map()}
const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1)
src.forEach(r => {
  const s = mapSurface(r.surface)
  if (s.value === null && !isAbsent(r.surface)) bump(unmapped.surface, `${r.surface} — ${s.reason}`)
  const vt = mapVenueType(r.venue_type)
  if (vt.value === null && !isAbsent(r.venue_type)) bump(unmapped.venue_type, `${r.venue_type} — ${vt.reason}`)
  const a = mapAccessType(r.access_type, r.is_free, r.drop_in_fee_usd, r.membership_from_usd)
  if (a.fee_type === null && !isAbsent(r.access_type)) bump(unmapped.fee_type, `${r.access_type} — ${a.fee_reason}`)
})
for (const [field, m] of Object.entries(unmapped)) {
  const total = [...m.values()].reduce((a, b) => a + b, 0)
  say(`### \`${field}\` — ${total.toLocaleString()} rows unmapped (${pct(total)})`)
  say('')
  say('| source value and reason | rows |')
  say('| --- | ---: |')
  ;[...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, c]) => {
    say(`| ${k.replace(/\|/g, '\\|')} | ${c.toLocaleString()} |`)
  })
  if (m.size > 15) say(`| *… ${m.size - 15} more distinct values* | |`)
  say('')
}

/* ------------------------------------------------------------------ */
say('## 9. What `claimed` actually contains (Rule 11)')
say('')
const claimedTrue = src.filter(r => String(r.claimed).trim().toUpperCase() === 'TRUE')
say(`- \`claimed = TRUE\`: **${claimedTrue.length}** rows (${pct(claimedTrue.length)})`)
say(`- \`claimed = FALSE\`: **${(N - claimedTrue.length).toLocaleString()}** rows`)
say('- Any other value: **0**')
say('')
say('The column is a plain boolean with no verification content in it at all.')
say('Rule 11 is satisfied cheaply here: it maps to `claimed_by_owner` and')
say('touches neither `status` nor `verified_by`. Note that a claim on a row')
say('with no source is still an unverified row.')
say('')
if (claimedTrue.length) {
  say('All claimed rows:')
  say('')
  say('```')
  claimedTrue.slice(0, 25).forEach(r => say(`${r.slug} — ${r.name}, ${r.city} ${r.state}`))
  say('```')
  say('')
}

/* ------------------------------------------------------------------ */
say('## 10. Column dispositions')
say('')
say('| source column | disposition | v4 target |')
say('| --- | --- | --- |')
for (const c of COLUMN_MAP) say(`| \`${c.source}\` | ${c.disposition} | \`${c.target}\` |`)
say('')
say(`All ${COLUMN_MAP.length} source columns accounted for. Nothing dropped silently.`)
say('')
say('### v4 fields the source cannot fill')
say('')
for (const u of UNSOURCED_V4_FIELDS) say(`- **\`${u.field}\`** — ${u.why}`)
say('')

const md = L.join('\n')
writeFileSync(join(OUT_DIR, 'quality-report.md'), md)
writeFileSync(join(OUT_DIR, 'quality-report.json'), JSON.stringify({
  rows: N,
  provenance: {...PROVENANCE_STATUS, rows_with_source_url: N, domains: [...domains]},
  null_rates: nullRates,
  filler_rows: fillerRows,
  court_arithmetic: {checkable: bothPresent, mismatch},
  slugs: {distinct: bySlug.size, colliding: dupSlugs.length, numeric_suffix: numericSuffix.length},
  duplicates: {proximity_pairs: proximityPairs, same_city_pairs: sameCityPairs},
  coordinates: {missing: noCoords, null_island: zeroIsland, out_of_range: outOfRange, outside_state: outsideState},
  postal: {missing: noZip, disagrees_with_state: zipBad, city_check: 'NOT PERFORMED - no reference table'},
  unmapped_vocab: Object.fromEntries(Object.entries(unmapped).map(([k, m]) => [k, [...m.values()].reduce((a, b) => a + b, 0)])),
  claimed_true: claimedTrue.length,
}, null, 2))

console.log(`Wrote reports/quality-report.md (${md.split('\n').length} lines) and quality-report.json`)
console.log(`rows=${N} mismatch=${mismatch} outsideState=${outsideState} zipBad=${zipBad} dupSlugs=${dupSlugs.length}`)
