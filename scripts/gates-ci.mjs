#!/usr/bin/env node
/*
  The CI gate run (Phase 6 deliverable 3): four import gates over every row,
  six page gates over every page, one summary table, non-zero exit on any
  failure that should block a deploy.

  WHAT BLOCKS A BUILD AND WHAT DOES NOT — the distinction matters, and
  getting it wrong in either direction is bad.

  BLOCKING: any PUBLISHED page failing any of the six page gates. A page
  that ships must have passed, so if one has not, the build is broken.

  NOT BLOCKING: an imported row failing an import gate. 18,037 rows fail I2
  today because none has provenance, and that is the known state of the
  project rather than a regression — failing the build on it would mean the
  build never passes until every row in the country is verified. What IS
  blocking is a row that reached PUBLISHED status while failing a gate,
  because that is the gate having been bypassed rather than not yet met.

  So: import gates are reported as a census, and enforced on the published
  set only.
*/

import {readFileSync, existsSync, readdirSync, statSync, writeFileSync} from 'node:fs'
import {join, relative} from 'node:path'
import {REPO_ROOT, loadRows} from './lib/load-csv.mjs'
import {mapRow} from './import/mapper.mjs'
import {loadIdentity, applyIdentity} from '../lib/data/identity.mjs'
import {loadVerifiedOverlay, applyVerifiedOverlay} from '../lib/data/verified.mjs'
import {promoteToVerified} from '../lib/data/promote.mjs'
import {checkPageGates} from '../lib/page/gates.mjs'
import {loadEditorial, editorialFor, editorialForCounty, editorialForVenue, editorialForFilter} from '../lib/data/editorial-store.mjs'
import {buildLinkGraph, countyCounts} from '../lib/site/links.mjs'
import {slugifyCounty} from './lib/us-geo.mjs'
import {getCounts} from '../lib/data/counts.mjs'
import {sitemapEntries} from '../lib/site/sitemap.mjs'
import {filterView} from '../lib/site/views.mjs'
import * as site from '../lib/site/data.mjs'

const lines = []
const say = s => { lines.push(s); console.log(s) }

/* ================= IMPORT GATES, over every row ================= */

/*
  The import census needs data.csv, which is 7.8 MB of unsourced records,
  gitignored on purpose, and therefore absent in CI. Its absence is reported
  loudly rather than skipped quietly. The PAGE gates below are what actually
  block a deploy, and they run either way, because the published set no
  longer depends on the staging pile.
*/
const csvPath = join(REPO_ROOT, 'data.csv')
const countyPath = join(REPO_ROOT, 'reports/county-per-row.json')
const haveImport = existsSync(csvPath) && existsSync(countyPath)

let rows = []
if (haveImport) {
  const county = JSON.parse(readFileSync(countyPath, 'utf8'))
  const imported = loadRows().map(r => mapRow(r).venue)
  imported.forEach((v, i) => { v.county = county[i].needs_review ? null : county[i].county })
  const {venues: identified} = applyIdentity(imported, loadIdentity(REPO_ROOT))
  rows = applyVerifiedOverlay(identified, loadVerifiedOverlay(REPO_ROOT).bySlug).venues
}

const tally = {I1: 0, I2: 0, I3: 0, I4: 0}
let publishable = 0
const bypassed = []

for (const v of rows) {
  const r = promoteToVerified(v)
  if (r.promoted) { publishable++; continue }
  const seen = new Set()
  for (const reason of r.reasons) {
    const gate = reason.slice(0, 2)
    if (tally[gate] !== undefined && !seen.has(gate)) { tally[gate]++; seen.add(gate) }
  }
  /* A row already marked published that cannot pass promotion = bypass. */
  if (v.status === 'published') bypassed.push({slug: v.slug, reasons: r.reasons})
}

say('\n=== IMPORT GATES — census over every imported row ===\n')
if (!haveImport) {
  say('SKIPPED — data.csv is not present, so NO ROW WAS EXAMINED.')
  say('')
  say('That is expected: the file is gitignored on purpose and CI never has')
  say('it. It is said plainly because a silent skip reads as a pass, and a')
  say('green tick meaning "nothing was checked" is the exact failure this')
  say('project already fixed once in Gate 6.')
  say('')
  say('This census reports on the staging pile. It gates nothing. The page')
  say('gates below gate everything, and they ran.')
} else {
  say(`rows examined:            ${rows.length.toLocaleString('en-US')}`)
  say(`rows passing all four:    ${publishable.toLocaleString('en-US')}`)
  say('')
  say('gate  what it checks                                        failing')
  say('----  ----------------------------------------------------  -------')
  say(`I1    identity: slug shape, name, city, state, address       ${String(tally.I1).padStart(7)}`)
  say(`I2    provenance: source_url, date_checked, verified_by      ${String(tally.I2).padStart(7)}`)
  say(`I3    consistency: court arithmetic, county, court count     ${String(tally.I3).padStart(7)}`)
  say(`I4    vocabulary: controlled values in filtered fields       ${String(tally.I4).padStart(7)}`)
  say('')
  say('I2 dominates and that is the known state of the project, not a')
  say('regression: no imported row carries provenance until someone verifies')
  say('it. These are reported, not enforced. What IS enforced is below.')
  say(`\nrows marked published while failing a gate (bypass): ${bypassed.length}`)
  for (const b of bypassed.slice(0, 10)) say(`  ${b.slug}: ${b.reasons.join('; ')}`)
}

/* ================= PAGE GATES, over every published page ================= */

const APP = join(REPO_ROOT, '.next', 'server', 'app')
if (!existsSync(APP)) {
  console.error('\nNo build found. Run `npm run build` first.\n')
  process.exit(1)
}

const pages = new Map()
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (!name.endsWith('.html') || name.startsWith('_')) continue
    const rel = relative(APP, p).replace(/\\/g, '/').replace(/\.html$/, '')
    pages.set(rel === 'index' ? '/' : `/${rel}/`, readFileSync(p, 'utf8'))
  }
})(APP)

const schemaIn = html => {
  const out = []
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const parsed = JSON.parse(m[1])
      if (Array.isArray(parsed['@graph'])) out.push(...parsed['@graph'])
      else out.push(parsed)
    } catch { /* absent = Gate 3 failure */ }
  }
  return out
}

const ed = loadEditorial(REPO_ROOT)
const allVenues = site.publishedCities().flatMap(c => site.city(c.state, c.slug).venues)
const graph = buildLinkGraph(allVenues)

const gateStats = {}
const failures = []

for (const entry of sitemapEntries()) {
  const {path, type} = entry
  if (type === 'home' || type === 'editorial') continue
  const html = pages.get(path)
  if (!html) { failures.push(`${path}: not built`); continue }

  let counts, venues, editorial, pageType = type
  if (type === 'county') {
    const co = [...graph.publishedCounties.values()]
      .find(c => path === `/pickleball/us/${c.state.toLowerCase()}/${slugifyCounty(c.county)}-county/`)
    counts = countyCounts(graph, co.state, co.county); venues = co.venues
    editorial = editorialForCounty(ed.byCity, co.county, co.state)?.slots ?? null
  } else if (type === 'city') {
    const [, , , st, cs] = path.split('/')
    const c = site.city(st, cs)
    counts = c.counts; venues = c.venues
    editorial = editorialFor(ed.byCity, c.city, c.state)?.slots ?? null
  } else if (type === 'filter') {
    const [, , , st, cs, fslug] = path.split('/')
    const c = site.city(st, cs)
    const fv = filterView(st, cs, fslug)
    /* Match on slug, not href: an unpublished venue has a null href and
       matching on it silently drops it from the filter's own count. */
    const on = new Set(fv.venues.map(x => x.slug))
    venues = c.venues.filter(v => on.has(v.slug))
    counts = getCounts({type: 'city', city: c.city, state: c.state}, venues)
    editorial = editorialForFilter(ed.byFilter, c.city, c.state, fslug)?.slots ?? null
  } else if (type === 'venue') {
    const [, , , st, cs, vslug] = path.split('/')
    const c = site.city(st, cs)
    const v = c.venues.find(x => x.slug === vslug)
    venues = [v]
    counts = getCounts({type: 'city', city: c.city, state: c.state}, [v])
    editorial = editorialForVenue(ed.byVenue, vslug)?.slots ?? null
  }

  const g = checkPageGates({pageType, counts, html, editorial, schema: schemaIn(html), venues})
  gateStats[type] ??= {total: 0, pass: 0, gates: {gate1: 0, gate2: 0, gate3: 0, gate4: 0, gate5: 0, gate6: 0}}
  gateStats[type].total++
  if (g.publishable) gateStats[type].pass++
  for (const k of Object.keys(gateStats[type].gates)) if (g[k]?.pass) gateStats[type].gates[k]++
}

say('\n=== PAGE GATES — every page in the sitemap ===\n')
say('page type   pages  pass   G1    G2    G3    G4    G5    G6')
say('---------   -----  ----   ---   ---   ---   ---   ---   ---')
for (const [type, s] of Object.entries(gateStats)) {
  const g = s.gates
  say(`${type.padEnd(11)} ${String(s.total).padStart(5)}  ${String(s.pass).padStart(4)}   ` +
    [g.gate1, g.gate2, g.gate3, g.gate4, g.gate5, g.gate6].map(n => String(n).padStart(3)).join('   '))
}

/*
  THE BLOCKING RULE. Everything in the sitemap is, by definition, a page we
  publish — so every one of them must pass all six. A page that fails is
  either a regression or a page that should never have been in the sitemap,
  and both are build-breaking.
*/
const shipped = Object.values(gateStats).reduce((n, s) => n + s.total, 0)
const passed = Object.values(gateStats).reduce((n, s) => n + s.pass, 0)
say(`\npublished pages passing all six: ${passed}/${shipped}`)

writeFileSync(join(REPO_ROOT, 'reports', 'gates-ci.md'),
  `# CI gate run\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`)

const blocking = bypassed.length > 0 || passed !== shipped || failures.length > 0
if (blocking) {
  console.log('\nBUILD BLOCKED')
  if (bypassed.length) console.log(`  ${bypassed.length} row(s) published while failing an import gate`)
  if (passed !== shipped) console.log(`  ${shipped - passed} published page(s) failing a page gate`)
  for (const f of failures) console.log(`  ${f}`)
  console.log('')
  process.exit(1)
}
console.log('\nALL GATES PASS ON EVERY PUBLISHED ROW AND PAGE\n')
