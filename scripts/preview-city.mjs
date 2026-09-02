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

/*
  Preview chrome only: enough typography to read the page in a browser.
  This is NOT a design decision - O12 (CSS and design system) is still open
  and deliberately unmade. None of this ships with the template; it lives in
  the preview wrapper and nowhere else.
*/
const PREVIEW_CSS = `
  body{max-width:44rem;margin:0 auto;padding:2rem 1.25rem 6rem;
       font:16px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a}
  h1{font-size:1.9rem;line-height:1.2;margin:.6em 0 .3em}
  h2{font-size:1.3rem;margin:2em 0 .4em;border-top:1px solid #e5e5e5;padding-top:1em}
  h3{font-size:1.05rem;margin:1.4em 0 .2em}
  p{margin:.6em 0}
  a{color:#0b5fa5}
  nav[aria-label=Breadcrumb] ol{list-style:none;display:flex;flex-wrap:wrap;gap:.5rem;
       padding:0;margin:0;font-size:.85rem;color:#666}
  nav[aria-label=Breadcrumb] li+li::before{content:"› ";color:#aaa}
  .preview-banner{background:#fff4f4;border:2px solid #c0392b;color:#7b241c;
       padding:1rem;border-radius:6px;margin:0 0 1.5rem;font-size:.9rem}
  .trust{background:#f4f8fb;border-left:4px solid #0b5fa5;padding:.9rem 1.1rem;margin:1.2rem 0}
  .venues{list-style:none;padding:0}
  .venues>li{border-bottom:1px solid #eee;padding:.9rem 0}
  .venues h3{margin:0 0 .2em}
  .tier{font-size:.75rem;background:#eee;border-radius:3px;padding:.15em .5em}
  .tier-9{background:#fdecea;color:#a5372b}
  .unverified{color:#a5372b}
  .slot-empty{background:#fffbe6;border:1px dashed #d6b656;padding:.8rem 1rem;margin:1rem 0}
  table{border-collapse:collapse;width:100%;font-size:.85rem;margin-top:.5rem}
  th,td{text-align:left;border-bottom:1px solid #eee;padding:.4rem .5rem;vertical-align:top}
  th{background:#fafafa}
`

const out = join(REPO_ROOT, 'reports', `preview-${city.toLowerCase()}-${state.toLowerCase()}.html`)
writeFileSync(out, `<!doctype html><html lang="en-US"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<title>${r.title}</title><meta name="description" content="${r.meta}">` +
  `<style>${PREVIEW_CSS}</style></head><body>${r.html}</body></html>`)

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
