#!/usr/bin/env node
/*
  Directory-wide claims in editorial prose, checked against the data.

  ============================================================
  WHY THIS EXISTS
  ============================================================

  Publishing a city silently invalidates prose on OTHER pages, and none of
  the six page gates can see it. Mesa broke Maricopa County's page. Kirkland
  broke King County's and Washington's. decisions.md recorded both and said
  a third instance should produce a checker rather than a third entry.

  The third instance arrived with cities #17-#20, and it was not one
  sentence but nine, on eight pages, some of them already false for days:

    "the only venue in this entire directory whose lights read No"
    "the only city in this directory where the lighting question is
     answered at every single published venue"
    "the only venue in this entire directory carrying a non-zero count on
     both sides"
    "the only ones anywhere on this site that can be booked in advance"
    "the only verified indoor pickleball courts in this entire directory"
    "the second-largest set of venues in this directory after Seattle"
    "one of only two cities on the whole site with a verified free court"

  Every one is a claim about the whole directory written on the page of one
  city, and every one goes stale the moment another city is published. A
  human re-reading every page after every publication has not happened
  fifteen times running, so the check moves into the build.

  ============================================================
  WHAT IT DOES
  ============================================================

  1. Reads every prose string in data/editorial/*.json and splits it into
     sentences.
  2. Flags a sentence when it BOTH refers to the whole directory ("in this
     directory", "on this site", "anywhere here", "entire directory") AND
     makes a comparative or exclusive claim ("only", "first", "largest",
     "no other", "one of two", "few", ...).
  3. Requires every flagged sentence to be registered in
     data/claims.json, and every registered claim to still exist
     in the prose. An unregistered directory-wide claim fails the build; so
     does a registry entry whose sentence has gone.
  4. Where a registered claim names a metric, computes that metric from the
     published venue set and fails the build if the claim no longer holds.
     A claim with no metric is one a human has read and marked as
     historical ("the first ...") or as policy ("this site records a price
     only when ..."); it is still tracked, so the next reader knows it was
     looked at, but nothing about it can go stale by arithmetic.

  The metrics are deliberately few and named. A claim that cannot be
  expressed in one of them is either reworded so it can be, or registered
  without a metric and read again at the next publication. What is not
  allowed is the thing that produced nine stale sentences: a directory-wide
  superlative that nobody is responsible for.

  USAGE
    node scripts/check-claims.mjs            # fail on problems
    node scripts/check-claims.mjs --list     # print every flagged sentence and its status
*/

import {readFileSync, readdirSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from './lib/load-csv.mjs'
import {publishedCities, city as loadCity} from '../lib/site/data.mjs'
import {qualifyingFilters} from '../lib/page/city-page.mjs'

const list = process.argv.includes('--list')

/* ---------------------------------------------------------------- */
/* THE PUBLISHED SET, AND THE METRICS COMPUTED FROM IT              */
/* ---------------------------------------------------------------- */

const cities = publishedCities().map(c => ({...c, ...loadCity(c.state, c.slug)}))
const venues = cities.flatMap(c => c.venues.map(v => ({...v, _city: `${c.city}, ${c.state}`})))

const bookable = v =>
  v.fee_type === 'reservation_fee' ||
  v.play_format === 'reserved_play' ||
  /reserv|book/i.test(String(v.pricing_notes ?? ''))

const METRICS = {
  cities_total: () => cities.length,
  venues_total: () => venues.length,
  venues_with_indoor_and_outdoor: () =>
    venues.filter(v => (v.indoor_courts ?? 0) > 0 && (v.outdoor_courts ?? 0) > 0).length,
  cities_with_indoor_page: () =>
    cities.filter(c => 'indoor' in qualifyingFilters(c.venues)).length,
  cities_with_free_page: () =>
    cities.filter(c => 'free' in qualifyingFilters(c.venues)).length,
  cities_all_venues_free: () => cities.filter(c => c.venues.every(v => v.fee_type === 'free')).length,
  cities_with_free_venue: () =>
    cities.filter(c => c.venues.some(v => v.fee_type === 'free')).length,
  venues_light_false: () => venues.filter(v => v.light === false).length,
  cities_lighting_answered_everywhere: () =>
    cities.filter(c => c.venues.every(v => v.light === true || v.light === false)).length,
  cities_without_any_lighting_answer: () =>
    cities.filter(c => c.venues.every(v => v.light !== true && v.light !== false)).length,
  venues_bookable: () => venues.filter(bookable).length,
  cities_with_indoor_courts: () =>
    cities.filter(c => c.venues.some(v => (v.indoor_courts ?? 0) > 0)).length,
  max_venue_courts: () => Math.max(...venues.map(v => v.total_courts ?? 0)),
  max_city_venues: () => Math.max(...cities.map(c => c.venues.length)),
  cities_with_any_surface: () => cities.filter(c => c.venues.some(v => v.surface)).length,
  cities_with_nets_not_provided: () => cities.filter(c => c.venues.some(v => v.nets_provided === false)).length,
  venues_nets_not_provided: () => venues.filter(v => v.nets_provided === false).length,
  cities_with_stated_peak_hours: () => cities.filter(c => c.venues.some(v => /busiest|peak/i.test(String(v.court_availability ?? '')) && /morning|evening|weekend|typically/i.test(String(v.court_availability ?? '')))).length,
  /* String-valued: which city or venue currently holds a rank. */
  largest_venue: () => venues.slice().sort((a, b) => (b.total_courts ?? 0) - (a.total_courts ?? 0))[0]?.name ?? null,
  largest_city_by_venues: () => cities.slice().sort((a, b) => b.venues.length - a.venues.length)[0]?.city ?? null,
  second_largest_city_by_venues: () => cities.slice().sort((a, b) => b.venues.length - a.venues.length)[1]?.city ?? null,
  largest_city_by_courts: () => cities.slice().sort((a, b) => sum(b) - sum(a))[0]?.city ?? null,
  largest_city_by_indoor_courts: () => cities.slice().sort((a, b) => sumIn(b) - sumIn(a))[0]?.city ?? null,
  largest_city_by_indoor_venues: () => cities.slice().sort((a, b) => indoorVenues(b) - indoorVenues(a))[0]?.city ?? null,
  second_largest_city_by_indoor_venues: () => cities.slice().sort((a, b) => indoorVenues(b) - indoorVenues(a))[1]?.city ?? null,
  /* The largest city, by venues, whose operator states indoor or outdoor at every venue. */
  largest_city_with_indoor_outdoor_stated_everywhere: () => cities.filter(c => c.venues.every(v => (v.indoor_courts ?? 0) > 0 || (v.outdoor_courts ?? 0) > 0)).sort((a, b) => b.venues.length - a.venues.length)[0]?.city ?? null,
}
function indoorVenues(c) { return c.venues.filter(v => (v.indoor_courts ?? 0) > 0).length }
function sum(c) { return c.venues.reduce((n, v) => n + (v.total_courts ?? 0), 0) }
function sumIn(c) { return c.venues.reduce((n, v) => n + (v.indoor_courts ?? 0), 0) }

const OPS = {
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
}

/* ---------------------------------------------------------------- */
/* THE SENTENCES                                                    */
/* ---------------------------------------------------------------- */

const SCOPE = /\b(this|the) (entire |whole )?(directory|site)\b|\banywhere (here|on this site|in this directory)\b|\bacross (this|the) (site|directory)\b/i
const MARKER = /\b(only|first|last|largest|biggest|smallest|highest|lowest|most|fewest|rarer|rarest|no other|none other|nothing else|second-largest|joint-largest|few|one of (only )?(two|three|four|five|six|seven|eight|nine|ten|twelve|a few|few|the few|very few)|any (other )?(city|cities|venue|venues|operator|operators)|every other|no (city|venue|operator)|nobody|never)\b/i
/* "only when", "only if" and "only where" are conditions, not exclusivity. */
const CONDITIONAL_ONLY = /\bonly (when|if|where|because|once|after|as|to)\b/i

const sentencesOf = text => String(text).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)

const PROSE_KEYS = new Set(['slots', 'faqs', 'best_for', 'note_on_method'])
const SKIP_KEYS = new Set(['evidence', 'not_stated', 'sources', 'supports', 'url', 'publisher', 'id'])

function collect(node, path, out, inProse = false) {
  if (typeof node === 'string') {
    if (inProse) for (const s of sentencesOf(node)) out.push({path, sentence: s})
    return
  }
  if (!node || typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    if (SKIP_KEYS.has(k)) continue
    collect(v, `${path}.${k}`, out, inProse || PROSE_KEYS.has(k))
  }
}

const dir = join(REPO_ROOT, 'data', 'editorial')
const flagged = []
for (const f of readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
  const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))
  const out = []
  collect(doc, '', out)
  for (const {path, sentence} of out) {
    if (!SCOPE.test(sentence)) continue
    const stripped = sentence.replace(CONDITIONAL_ONLY, '')
    if (!MARKER.test(stripped)) continue
    flagged.push({file: f, path, sentence})
  }
}

/* ---------------------------------------------------------------- */
/* THE REGISTRY                                                     */
/* ---------------------------------------------------------------- */

const registryPath = join(REPO_ROOT, 'data', 'claims.json')
const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
if (!Array.isArray(registry.claims)) throw new Error('data/claims.json must hold a "claims" array.')

const problems = []
const used = new Set()

for (const fl of flagged) {
  const entry = registry.claims.find((c, i) => c.file === fl.file && fl.sentence.includes(c.contains) && !used.has(`${i}:${fl.path}`) && (used.add(`${i}:${fl.path}`), true))
  fl.entry = entry ?? null
  if (!entry) {
    problems.push(`UNREGISTERED directory-wide claim in ${fl.file} at ${fl.path}:\n    "${fl.sentence}"`)
    continue
  }
  if (entry.metric) {
    const fn = METRICS[entry.metric]
    if (!fn) { problems.push(`${fl.file}: registered claim names unknown metric "${entry.metric}"`); continue }
    const op = OPS[entry.op]
    if (!op) { problems.push(`${fl.file}: registered claim uses unknown op "${entry.op}"`); continue }
    const actual = fn()
    fl.actual = actual
    if (!op(actual, entry.value)) {
      problems.push(
        `STALE claim in ${fl.file} at ${fl.path}: ${entry.metric} is ${actual}, claim needs ${entry.op} ${entry.value}.\n` +
        `    "${fl.sentence}"\n    Rewrite the sentence and update data/claims.json.`)
    }
  }
}

for (const c of registry.claims) {
  if (!flagged.some(f => f.entry === c)) {
    problems.push(`ORPHAN registry entry: no sentence in ${c.file} contains "${c.contains}". Remove it or restore the sentence.`)
  }
}

if (list) {
  for (const fl of flagged) {
    const status = !fl.entry ? 'UNREGISTERED' : fl.entry.metric ? `${fl.entry.metric}=${fl.actual} ${fl.entry.op} ${fl.entry.value}` : `noted: ${fl.entry.why ?? ''}`
    console.log(`${fl.file} ${fl.path}\n    [${status}]\n    ${fl.sentence}\n`)
  }
  console.log('metrics:', Object.fromEntries(Object.entries(METRICS).map(([k, fn]) => [k, fn()])))
}

if (problems.length) {
  console.error(`\ncheck-claims: ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  process.exit(1)
}
console.log(`check-claims: ${flagged.length} directory-wide claims registered and current across ${cities.length} cities.`)
