#!/usr/bin/env node
/*
  The six-gate pass/fail report for every published page, by page type.

  Phase 5 asks for it per page type, and it reads the BUILT HTML for the same
  reason scripts/gate-shipped.mjs does: a report about a template nobody can
  visit is worth nothing. Run after `npm run build`.

  Expect venue pages to fail. That is not a bug in this script and not a bug
  in the venue template — it is Gate 4 refusing to publish a page with no
  editorial, and a venue page with no editorial is precisely the 656-word
  thin page the whole project is built to beat.
*/

import {readFileSync, existsSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from './lib/load-csv.mjs'
import {checkPageGates} from '../lib/page/gates.mjs'
import {countWords} from '../lib/page/words.mjs'
import {loadEditorial, editorialFor, editorialForCounty, editorialForVenue, editorialForFilter, editorialForState} from '../lib/data/editorial-store.mjs'
import {buildLinkGraph, countyCounts} from '../lib/site/links.mjs'
import {slugifyCounty} from './lib/us-geo.mjs'
import {getCounts} from '../lib/data/counts.mjs'
import {sitemapEntries} from '../lib/site/sitemap.mjs'
import {NOINDEX_PARAMS, INDEXABLE_FILTERS, robotsDirectives} from '../lib/site/facets.mjs'
import {filterView} from '../lib/site/views.mjs'
import * as site from '../lib/site/data.mjs'

const APP = join(REPO_ROOT, '.next', 'server', 'app')
if (!existsSync(APP)) {
  console.error('\nNo build found. Run `npm run build` first.\n')
  process.exit(1)
}

const ed = loadEditorial(REPO_ROOT)
const cities = site.publishedCities()
const allVenues = cities.flatMap(c => site.city(c.state, c.slug).venues)
const graph = buildLinkGraph(allVenues)

const htmlFor = path => {
  const rel = path === '/' ? 'index' : path.replace(/^\/|\/$/g, '')
  const p = join(APP, `${rel}.html`)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

const schemaIn = html => {
  const out = []
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const parsed = JSON.parse(m[1])
      if (Array.isArray(parsed['@graph'])) out.push(...parsed['@graph'])
      else out.push(parsed)
    } catch { /* malformed fails Gate 3 by absence */ }
  }
  return out
}

const results = []

for (const entry of sitemapEntries()) {
  const {path, type} = entry
  if (type === 'home' || type === 'editorial') continue

  const html = htmlFor(path)
  if (!html) { results.push({path, type, missing: true}); continue }

  let counts, venues, editorial, pageType

  if (type === 'county') {
    pageType = 'county'
    const co = [...graph.publishedCounties.values()]
      .find(c => path === `/pickleball/us/${c.state.toLowerCase()}/${slugifyCounty(c.county)}-county/`)
    counts = countyCounts(graph, co.state, co.county)
    venues = co.venues
    editorial = editorialForCounty(ed.byCity, co.county, co.state)?.slots ?? null
  } else if (type === 'city') {
    pageType = 'city'
    const [, , , st, cs] = path.split('/')
    const c = site.city(st, cs)
    counts = c.counts; venues = c.venues
    editorial = editorialFor(ed.byCity, c.city, c.state)?.slots ?? null
  } else if (type === 'filter') {
    pageType = 'filter'
    const [, , , st, cs, fslug] = path.split('/')
    const c = site.city(st, cs)
    const fv = filterView(st, cs, fslug)
    /* A filter page's counts must be the venues ON it, or Gate 5 compares
       the page's list against the city's total and fails for the wrong
       reason. */
    /* Match on slug, not href: an unpublished venue has a null href and
       matching on it silently drops it from the filter's own count. */
    const matching = new Set(fv.venues.map(x => x.slug))
    venues = c.venues.filter(v => matching.has(v.slug))
    counts = getCounts({type: 'city', city: c.city, state: c.state}, venues)
    editorial = editorialForFilter(ed.byFilter, c.city, c.state, fslug)?.slots ?? null
  } else if (type === 'state') {
    /*
      State pages were unreachable by this runner: pageType stayed undefined
      and checkBand threw "No word band defined for page type undefined",
      crashing the whole run rather than failing one page. A page type the
      gates cannot see is a page type that can ship anything.
    */
    pageType = 'state'
    const [, , , st] = path.split('/')
    const stateAbbr = String(st).toUpperCase()
    venues = site.publishedCities()
      .filter(c => String(c.state).toUpperCase() === stateAbbr)
      .flatMap(c => site.city(c.state, c.slug).venues)
    counts = getCounts({type: 'state', state: stateAbbr}, venues)
    editorial = editorialForState(ed.byCity, stateAbbr)?.slots ?? null
  } else if (type === 'venue') {
    pageType = 'venue'
    const [, , , st, cs, vslug] = path.split('/')
    const c = site.city(st, cs)
    const v = c.venues.find(x => x.slug === vslug)
    venues = [v]
    counts = getCounts({type: 'city', city: c.city, state: c.state}, [v])
    editorial = editorialForVenue(ed.byVenue, c.city, c.state, vslug)?.slots ?? null
  }

  const g = checkPageGates({
    pageType, counts, html, editorial, schema: schemaIn(html), venues,
  })

  results.push({
    path, type, pageType,
    words: countWords(html),
    schema: [...new Set(schemaIn(html).map(s => s['@type']))].join(', '),
    pass: g.publishable,
    failed: Object.entries(g)
      .filter(([k, x]) => k.startsWith('gate') && x && x.pass === false)
      .map(([k, x]) => `${k.replace('gate', 'G')}: ${String(x.detail).slice(0, 110)}`),
  })
}

/* ---------------- report ---------------- */

const byType = new Map()
for (const r of results) {
  if (!byType.has(r.type)) byType.set(r.type, [])
  byType.get(r.type).push(r)
}

const lines = []
const say = s => { lines.push(s); console.log(s) }

say('\n=== SIX-GATE REPORT BY PAGE TYPE ===\n')

for (const type of ['county', 'city', 'filter', 'venue']) {
  const rows = byType.get(type) ?? []
  if (!rows.length) continue
  const passed = rows.filter(r => r.pass).length
  say(`${type.toUpperCase()}  —  ${passed}/${rows.length} publishable`)
  for (const r of rows) {
    say(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.path}`)
    say(`        ${r.words} words · ${r.schema || 'no schema'}`)
    for (const f of r.failed) say(`        ${f}`)
  }
  say('')
}

say('=== INDEXABLE FILTERS (D4) ===')
say(`  the five: ${INDEXABLE_FILTERS.join(', ')}`)
const built = (byType.get('filter') ?? []).map(r => r.path.split('/').filter(Boolean).pop())
say(`  built for Seattle: ${built.join(', ') || 'none'}`)
for (const f of INDEXABLE_FILTERS) {
  if (built.includes(f)) continue
  const why = filterView('wa', 'seattle', f)
  say(`  ${f}: not published — ${why ? 'fewer than 3 matching verified venues' : 'no lawful data driver or fewer than 3 matches'}`)
}

say('\n=== NOINDEX QUERY PARAMETERS ===')
say(`  ${NOINDEX_PARAMS.length} facets are parameters, not URLs:`)
say(`  ${NOINDEX_PARAMS.join(', ')}`)
say('\n  robots.txt directives generated:')
for (const d of robotsDirectives().slice(0, NOINDEX_PARAMS.length)) {
  say(`    ${d.directive}: ${d.pattern}`)
}
say(`    ... plus the same ${NOINDEX_PARAMS.length} again in "&" position`)

const total = results.length
const ok = results.filter(r => r.pass).length
say(`\nTOTAL: ${ok}/${total} pages pass all six gates.\n`)

writeFileSync(join(REPO_ROOT, 'reports', 'gates.md'),
  `# Six-gate report\n\nGenerated from the built HTML.\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`)
console.log('Wrote reports/gates.md\n')
