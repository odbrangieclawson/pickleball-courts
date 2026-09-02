/*
  PREVIEW ONLY. Renders a city page from UNVERIFIED imported rows so the
  template can be judged on real content.

  This script lives in scripts/, never in app/, so Next.js never builds it
  and nothing it produces can be deployed. Output goes to reports/.
  The page it writes carries noindex and a banner, and the gate report
  underneath still says NOT PUBLISHABLE.
*/
import {writeFileSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from './lib/load-csv.mjs'
import {mapRow} from './import/mapper.mjs'
import {getCounts} from '../lib/data/counts.mjs'
import {renderCityPage} from '../lib/page/city-page.mjs'
import {checkPageGates, formatGateReport} from '../lib/page/gates.mjs'
import {countWords} from '../lib/page/words.mjs'
import {findTemplatedSentences} from '../lib/page/editorial.mjs'
import {slugifyCounty} from './lib/us-geo.mjs'

const city = process.argv[2] ?? 'Seattle'
const state = process.argv[3] ?? 'WA'
const STATE_NAMES = {WA: 'Washington', FL: 'Florida', TX: 'Texas', CA: 'California'}

const all = loadRows().map(r => mapRow(r).venue)
const county = JSON.parse(readFileSync(join(REPO_ROOT, 'reports', 'county-per-row.json'), 'utf8'))
all.forEach((v, i) => { v.county = county[i].needs_review ? null : county[i].county })

const inCity = all.filter(v => v.city === city && v.state === state)

/*
  The preview predicate. Named, explicit, and it forces every Count to carry
  preview=true and an "UNVERIFIED PREVIEW" basis string.
*/
const counts = getCounts({type: 'city', city, state}, all, {
  predicate: () => true,
  basisLabel: 'ALL imported rows, none verified, sourced only from a competitor directory',
})

const r = renderCityPage({
  city, state, stateName: STATE_NAMES[state] ?? state,
  citySlug: city.toLowerCase().replace(/\s+/g, '-'),
  county: inCity[0]?.county ?? null,
  countySlug: inCity[0]?.county ? slugifyCounty(inCity[0].county) : null,
  counts, venues: inCity, editorial: null, faqs: null,
  preview: true,
})

const out = join(REPO_ROOT, 'reports', `preview-${city.toLowerCase()}-${state.toLowerCase()}.html`)
writeFileSync(out, `<!doctype html><html lang="en-US"><head><meta charset="utf-8"><title>${r.title}</title><meta name="description" content="${r.meta}"></head><body>${r.html}</body></html>`)

console.log(`\n=== PREVIEW: ${city}, ${state} ===`)
console.log(`rows rendered: ${inCity.length} (all unverified)`)
console.log(`written to: reports/${out.split(/[\/]/).pop()}\n`)
console.log(`TITLE (${r.title.length} chars): ${r.title}`)
console.log(`META  (${r.meta.length} chars): ${r.meta}\n`)
console.log(`word count: ${countWords(r.html)} (band 1,200-2,000)`)
console.log(`filters that would qualify: ${Object.entries(r.filters).map(([k, n]) => `${k}=${n}`).join(', ') || 'none'}\n`)

console.log(formatGateReport(checkPageGates({
  pageType: 'city', counts, html: r.html, editorial: null, schema: [r.graph], venues: inCity,
})))

const text = r.html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
const templated = findTemplatedSentences(text, r.dataValues).filter(s => s.templated)
console.log(`\n--- sentences that read as templated (${templated.length}) ---`)
templated.slice(0, 8).forEach(s => console.log(`  [${s.residueWords} authored words] ${s.sentence.slice(0, 120)}`))
