#!/usr/bin/env node
/*
  DECISIONS D1 (URL pattern, locked) and D4 (five indexable filters)
  live in LOCKED_URL_PATTERNS below. See decisions.md §8.

  Rule 9: one primary keyword per URL, enforced by keyword-map.json at build
  time. The build fails on a collision.

  Wired into `npm run build` via the `prebuild` script, so a collision stops
  a deploy rather than producing two pages that compete for one query.

  WHAT THIS CHECKS TODAY (Phase 0, no data):
    1. keyword-map.json parses and has the expected shape.
    2. page_type and url_pattern are unique.
    3. Every url_pattern is on the LOCKED list from decisions.md section 1.
       A new or edited URL shape fails here by design.
    4. Every {slot} used in a keyword is declared in `slots`.
    5. secondary holds at most 3 patterns.
    6. No two keyword TEMPLATES collapse to the same shape once slots are
       blanked. primary-vs-primary and primary-vs-secondary are errors;
       secondary-vs-secondary is a warning.

  WHAT IT CANNOT CHECK YET:
    Instance-level collisions - two real expanded URLs claiming the same real
    keyword string, e.g. a venue literally named after its city. That needs
    the venue/city dataset, which Phase 0 forbids. The hook is written below
    and activates the moment data/keyword-instances.json exists. Until then
    this script reports that the check is INACTIVE rather than passing
    silently.
*/

import {readFileSync, existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, join} from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const MAP_PATH = join(root, 'keyword-map.json')
const INSTANCES_PATH = join(root, 'data', 'keyword-instances.json')

// decisions.md section 1 (The URL pattern). The enforcement point for "the URL pattern is
// locked". Changing it is a decision, not an edit.
const LOCKED_URL_PATTERNS = [
  '/pickleball/us/{state}/',
  '/pickleball/us/{state}/{county}-county/',
  '/pickleball/us/{state}/{city}/',
  '/pickleball/us/{state}/{city}/indoor/',
  '/pickleball/us/{state}/{city}/outdoor/',
  '/pickleball/us/{state}/{city}/free/',
  '/pickleball/us/{state}/{city}/public/',
  '/pickleball/us/{state}/{city}/lights/',
  '/pickleball/us/{state}/{city}/{venue}/',
  '/pickleball-gear/{category}/',
]

const errors = []
const warnings = []

const err = m => errors.push(m)
const warn = m => warnings.push(m)

// Blank every {slot} so two templates that differ only by slot NAME are seen
// as the same shape. "pickleball courts in {city_name}" and "... {state_name}"
// both become "pickleball courts in {}".
const shapeOf = s => s.replace(/\{[a-z_]+\}/g, '{}').trim().toLowerCase()
const slotsIn = s => s.match(/\{[a-z_]+\}/g) ?? []

if (!existsSync(MAP_PATH)) {
  console.error('FAIL: keyword-map.json not found at ' + MAP_PATH)
  process.exit(1)
}

let map
try {
  map = JSON.parse(readFileSync(MAP_PATH, 'utf8'))
} catch (e) {
  console.error('FAIL: keyword-map.json is not valid JSON: ' + e.message)
  process.exit(1)
}

if (!Array.isArray(map.page_types)) {
  console.error('FAIL: keyword-map.json has no page_types array')
  process.exit(1)
}

const declaredSlots = new Set(Object.keys(map.slots ?? {}))
const seenPageTypes = new Map()
const seenUrlPatterns = new Map()

// shape -> [{pageType, kind, text}]
const shapes = new Map()
const record = (shape, entry) => {
  if (!shapes.has(shape)) shapes.set(shape, [])
  shapes.get(shape).push(entry)
}

for (const e of map.page_types) {
  const id = e.page_type ?? '(missing page_type)'

  if (!e.page_type) err('An entry is missing page_type')
  else if (seenPageTypes.has(e.page_type))
    err(`Duplicate page_type: ${e.page_type}`)
  else seenPageTypes.set(e.page_type, e)

  if (!e.url_pattern) {
    err(`${id}: missing url_pattern`)
  } else {
    if (seenUrlPatterns.has(e.url_pattern))
      err(
        `Duplicate url_pattern ${e.url_pattern} on ${id} and ${seenUrlPatterns.get(e.url_pattern)}`,
      )
    else seenUrlPatterns.set(e.url_pattern, id)

    if (!LOCKED_URL_PATTERNS.includes(e.url_pattern))
      err(
        `${id}: url_pattern ${e.url_pattern} is not on the locked list in decisions.md section 1`,
      )
  }

  if (typeof e.primary !== 'string' || !e.primary.trim())
    err(`${id}: primary keyword is missing or empty`)

  const secondary = e.secondary ?? []
  if (!Array.isArray(secondary)) err(`${id}: secondary must be an array`)
  else if (secondary.length > 3)
    err(`${id}: ${secondary.length} secondary patterns, maximum is 3`)

  for (const [kind, text] of [
    ['primary', e.primary],
    ...secondary.map(s => ['secondary', s]),
  ]) {
    if (typeof text !== 'string' || !text.trim()) continue
    for (const slot of slotsIn(text)) {
      if (!declaredSlots.has(slot))
        err(`${id}: ${kind} uses undeclared slot ${slot}`)
    }
    record(shapeOf(text), {pageType: id, kind, text})
  }
}

// Every locked URL pattern should be claimed by exactly one page type.
for (const locked of LOCKED_URL_PATTERNS) {
  if (!seenUrlPatterns.has(locked))
    warn(`Locked URL pattern has no page_type entry yet: ${locked}`)
}

// Collision detection.
for (const [shape, entries] of shapes) {
  if (entries.length < 2) continue
  const primaries = entries.filter(x => x.kind === 'primary')
  const describe = entries
    .map(x => `${x.pageType}.${x.kind} ("${x.text}")`)
    .join(' vs ')

  if (primaries.length >= 2)
    err(`Primary keyword collision on shape "${shape}": ${describe}`)
  else if (primaries.length === 1)
    err(
      `A secondary keyword collides with another page's primary on shape "${shape}": ${describe}`,
    )
  else warn(`Two secondary keywords share shape "${shape}": ${describe}`)
}

/*
  COLLISION GUARDS (Phase 3 spec).

  G1  "pickleball courts near me" is never assigned to any URL. It is
      localised, so a single landing page cannot rank for it and would
      cannibalise the city pages that can.
  G2  A filter primary must stay lexically distinct from its parent city
      primary. If one is a substring-equal match of the other, the two
      pages compete for the same query and the weaker one wins nothing.
*/
const NEAR_ME = /pickleball courts near me/i
for (const e of map.page_types) {
  for (const kw of [e.primary, ...(e.secondary ?? [])].filter(Boolean)) {
    if (NEAR_ME.test(kw)) {
      err(`${e.page_type}: "${kw}" assigns "pickleball courts near me" to a URL. It is localised and is never assigned (guard G1).`)
    }
  }
}
/*
  G2, and a note on reading it.

  The spec says a filter primary must not be "a substring-equal match" of
  the city primary. Read as plain containment, that fails four of the five
  filter formulas THE SPEC ITSELF SUPPLIES: "Indoor Pickleball Courts in
  {City}, {ST}" necessarily contains "Pickleball Courts in {City}, {ST}".
  Containment is unavoidable in English here, so containment cannot be what
  the rule means.

  Read instead as: a filter primary must be EQUAL to the city primary (a
  real collision), or must fail to add its own distinguishing qualifier (a
  filter that forgot what it filters on). Both are genuine mistakes; mere
  containment is not.
*/
const FILTER_QUALIFIER = {
  city_filter_indoor: ['indoor'],
  city_filter_outdoor: ['outdoor'],
  city_filter_free: ['free'],
  city_filter_public: ['public'],
  city_filter_lights: ['light', 'lit', 'lighted'],
}
const cityEntry = map.page_types.find(p => p.page_type === 'city')
if (cityEntry?.primary) {
  const cityShape = shapeOf(cityEntry.primary)
  for (const e of map.page_types) {
    if (!e.page_type.startsWith('city_filter_') || !e.primary) continue
    if (shapeOf(e.primary) === cityShape) {
      err(`${e.page_type}: primary "${e.primary}" is identical to the city primary "${cityEntry.primary}" (guard G2).`)
      continue
    }
    const quals = FILTER_QUALIFIER[e.page_type] ?? []
    if (quals.length && !quals.some(q => e.primary.toLowerCase().includes(q))) {
      err(`${e.page_type}: primary "${e.primary}" carries none of its distinguishing qualifiers (${quals.join(', ')}), so it does not separate from the city primary (guard G2).`)
    }
  }
}

// Instance-level check. Inactive until a dataset exists.
let instanceStatus
if (existsSync(INSTANCES_PATH)) {
  const instances = JSON.parse(readFileSync(INSTANCES_PATH, 'utf8'))
  const byKeyword = new Map()
  for (const {url, primary} of instances) {
    const key = primary.trim().toLowerCase()
    if (byKeyword.has(key))
      err(
        `Instance-level primary collision on "${primary}": ${byKeyword.get(key)} and ${url}`,
      )
    else byKeyword.set(key, url)
  }
  instanceStatus = `ACTIVE - checked ${instances.length} expanded URLs`
} else {
  instanceStatus =
    'INACTIVE - data/keyword-instances.json does not exist yet (expected in Phase 0: no data)'
}

console.log('keyword-map.json validation')
console.log(`  page types:        ${map.page_types.length}`)
console.log(`  locked patterns:   ${LOCKED_URL_PATTERNS.length}`)
console.log(`  template checks:   ${errors.length === 0 ? 'PASS' : 'FAIL'}`)
console.log(`  instance checks:   ${instanceStatus}`)

for (const w of warnings) console.warn(`  WARN  ${w}`)
for (const e of errors) console.error(`  ERROR ${e}`)

if (errors.length) {
  console.error(`\nFAILED with ${errors.length} error(s). Build stopped.`)
  process.exit(1)
}
console.log('\nOK')
