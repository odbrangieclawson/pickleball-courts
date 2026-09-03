#!/usr/bin/env node
/*
  Run the six page gates against the HTML THAT ACTUALLY SHIPS.

  WHY THIS EXISTS

  scripts/build-city.mjs gates lib/page/city-page.mjs — the standalone
  template. The site serves app/pickleball/us/[state]/[city]/page.tsx. Those
  are two renderings of the same city, and for a while only the first was
  gated. That is the worst possible arrangement: a green gate report about a
  page no visitor can reach, while the page they can reach was missing four
  items of the 8c anatomy and its FAQPage schema.

  Phase 3's condition is "one city page passes all six gates". The page has
  to be the shipped one for that sentence to mean anything, so this reads the
  built HTML out of .next/server/app/ and runs checkPageGates over it.

  Run it after `npm run build`. It is wired into `npm run gates:shipped`.

  WHAT IT CAN AND CANNOT SEE

  It has the real HTML, so Gates 2, 3 and 4 are judged on exactly what a
  crawler receives. Gates 1, 5 and 6 are about the data behind the page, so
  it reloads the published set through the same lib/site/data.mjs the route
  used. If those two ever disagree, that disagreement is the bug this script
  is for.
*/

import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from './lib/load-csv.mjs'
import {checkPageGates, formatGateReport} from '../lib/page/gates.mjs'
import {countWords} from '../lib/page/words.mjs'
import {loadEditorial, editorialFor, editorialForCounty} from '../lib/data/editorial-store.mjs'
import {buildLinkGraph, countyCounts} from '../lib/site/links.mjs'
import {slugifyCounty} from './lib/us-geo.mjs'
import * as site from '../lib/site/data.mjs'

const city = process.argv[2] ?? 'Seattle'
const state = (process.argv[3] ?? 'WA').toUpperCase()
const isCounty = city.endsWith('-county')
const slug = isCounty ? city : site.citySlug(city)

const htmlPath = join(REPO_ROOT, '.next', 'server', 'app', 'pickleball', 'us', state.toLowerCase(), `${slug}.html`)
if (!existsSync(htmlPath)) {
  console.error(`\nNo built page at ${htmlPath}`)
  console.error('Run `npm run build` first — this gates the shipped HTML, not the template.\n')
  process.exit(1)
}

const html = readFileSync(htmlPath, 'utf8')

/* Every JSON-LD block the page actually emits. */
const schema = []
for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
  try {
    const parsed = JSON.parse(m[1])
    if (Array.isArray(parsed['@graph'])) schema.push(...parsed['@graph'])
    else schema.push(parsed)
  } catch { /* a malformed block fails Gate 3 by being absent */ }
}

/*
  City and county pages share a URL segment, so they share this script.
  The page type matters: Gate 3 wants ItemList on both but Gate 4 asks each
  for a different set of editorial slots — a county is not somewhere you
  park.
*/
let counts, venues, editorial

if (isCounty) {
  const graph = buildLinkGraph(
    site.publishedCities().flatMap(x => site.city(x.state, x.slug).venues))
  const entry = [...graph.publishedCounties.values()]
    .find(x => x.state === state && slug === `${slugifyCounty(x.county)}-county`)
  if (!entry) {
    console.error(`\n${slug} is not published — nothing to gate.\n`)
    process.exit(1)
  }
  counts = countyCounts(graph, state, entry.county)
  venues = entry.venues
  editorial = editorialForCounty(loadEditorial(REPO_ROOT).byCity, entry.county, state)?.slots ?? null
} else {
  const c = site.city(state, slug)
  if (!c) {
    console.error(`\n${city}, ${state} is not published — nothing to gate.\n`)
    process.exit(1)
  }
  counts = c.counts
  venues = c.venues
  editorial = editorialFor(loadEditorial(REPO_ROOT).byCity, city, state)?.slots ?? null
}

const gates = checkPageGates({
  pageType: isCounty ? 'county' : 'city',
  counts,
  html,
  editorial,
  schema,
  venues,
})

console.log(`\n=== SHIPPED PAGE — ${city}, ${state} ===`)
console.log(`file:   ${htmlPath.replace(REPO_ROOT, '.')}`)
console.log(`schema: ${schema.map(s => s['@type']).join(', ') || 'none'}`)
console.log(`words:  ${countWords(html)}\n`)
console.log(formatGateReport(gates))

if (!gates.publishable) {
  console.log('\nNOT PUBLISHABLE — the page a visitor would see fails at least one gate.\n')
  process.exit(1)
}
console.log('\nPUBLISHABLE — the shipped page passes all six.\n')
