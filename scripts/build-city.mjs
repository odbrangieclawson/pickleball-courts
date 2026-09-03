/* Attempts to build one city page and reports the six gates, word count,
   templated sentences and every null field. */
import {writeFileSync, readFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from './lib/load-csv.mjs'
import {mapRow} from './import/mapper.mjs'
import {loadVerifiedOverlay, applyVerifiedOverlay} from '../lib/data/verified.mjs'
import {loadIdentity, applyIdentity} from '../lib/data/identity.mjs'
import {promoteAll} from '../lib/data/promote.mjs'
import {getCounts} from '../lib/data/counts.mjs'
import {checkPageGates, formatGateReport} from '../lib/page/gates.mjs'
import {renderCityPage} from '../lib/page/city-page.mjs'
import {findTemplatedSentences} from '../lib/page/editorial.mjs'
import {countWords} from '../lib/page/words.mjs'
import {slugifyCounty} from './lib/us-geo.mjs'

const city = process.argv[2] ?? 'Seattle'
const state = process.argv[3] ?? 'WA'
const STATE_NAMES = {WA: 'Washington', FL: 'Florida', TX: 'Texas'}

const all = loadRows().map(r => mapRow(r).venue)
const county = JSON.parse(readFileSync(join(REPO_ROOT, 'reports', 'county-per-row.json'), 'utf8'))
all.forEach((v, i) => { v.county = county[i].needs_review ? null : county[i].county })

/* Phase 1B facts, laid over the imported rows before anything is promoted. */
const identity = loadIdentity(REPO_ROOT)
const {venues: identified, renamed: idRenamed, quarantined: idHeld} = applyIdentity(all, identity)
if (idRenamed || idHeld) console.log(`identity: ${idRenamed} slug(s) canonicalised, ${idHeld} row(s) held back`)

const overlay = loadVerifiedOverlay(REPO_ROOT)
const {venues: withFacts, applied, fieldsWritten, fieldsCleared, cleared, skipped} = applyVerifiedOverlay(identified, overlay.bySlug)
if (applied) console.log(`verified overlay: ${fieldsWritten} sourced field(s) across ${applied} venue(s) from ${overlay.files.join(", ")}`)
if (fieldsCleared) console.log(`  ${fieldsCleared} unsourced field(s) cleared to null on those venues (Rule 7): ${[...new Set(cleared.map(c => c.field))].join(", ")}`)
for (const s of skipped) console.log(`  SKIPPED ${s.slug}.${s.field} — ${s.why}`)

const {promoted} = promoteAll(withFacts)
const scope = {type: 'city', city, state}
const counts = getCounts(scope, promoted)
const onPage = promoted.filter(v => v.city === city && v.state === state)
const inCity = all.filter(v => v.city === city && v.state === state)

console.log(`\n=== ${city}, ${state} ===`)
console.log(`rows in dataset: ${inCity.length}`)
console.log(`verified and publishable: ${onPage.length}\n`)

let html = null, title = null, meta = null, graph = []
let rendered = null
try {
  rendered = renderCityPage({
    city, state, stateName: STATE_NAMES[state] ?? state,
    citySlug: city.toLowerCase().replace(/\s+/g, '-'),
    county: onPage[0]?.county ?? null,
    countySlug: onPage[0]?.county ? slugifyCounty(onPage[0].county) : null,
    counts, venues: onPage, editorial: null, faqs: null,
  })
  html = rendered.html; title = rendered.title; meta = rendered.meta; graph = [rendered.graph]
} catch (e) {
  console.log(`RENDER REFUSED: ${e.message}\n`)
}

const gates = checkPageGates({pageType: 'city', counts, html, editorial: null, schema: graph, venues: onPage})
console.log(formatGateReport(gates))

console.log(`\n--- word count ---`)
console.log(html ? `${countWords(html)} words (band 1,200-2,000)` : 'nothing rendered')

console.log(`\n--- null fields across the ${inCity.length} rows for this city ---`)
const nulls = new Map()
for (const v of inCity) {
  for (const [k, val] of Object.entries(v)) {
    if (k.startsWith('_')) continue
    if (val === null || val === undefined) nulls.set(k, (nulls.get(k) ?? 0) + 1)
  }
}
;[...nulls.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) =>
  console.log(`  ${k.padEnd(24)} ${String(n).padStart(4)} of ${inCity.length}`))

if (html) {
  mkdirSync(join(REPO_ROOT, 'reports'), {recursive: true})
  writeFileSync(join(REPO_ROOT, 'reports', `page-${city.toLowerCase()}.html`), html)
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  console.log(`\n--- templated sentences ---`)
  findTemplatedSentences(text, rendered.dataValues).filter(s => s.templated)
    .slice(0, 10).forEach(s => console.log(`  [${s.residueWords} authored words] ${s.sentence.slice(0, 110)}`))
}
