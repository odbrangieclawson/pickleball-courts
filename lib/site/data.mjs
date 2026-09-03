/*
  The site's read path.

  Everything under app/ reads through here. Two reasons:

  1. Rule 2 / Decision D2. Page code must never hold a countable collection,
     and validate-no-bypass.mjs fails the build if anything under app/ calls
     .length or .filter on data. Keeping the assembly in lib/ means the route
     files have nothing to count in the first place.

  2. The pipeline is expensive. Parsing 18,037 CSV rows, mapping them,
     laying the verified overlay over them and running promotion costs about
     a second. Next renders many routes; doing that per route would be
     absurd. It is memoised here, once per process.

  WHAT THIS MODULE PUBLISHES

  Only promoted venues. A pending row cannot be reached through any function
  here, so no route can render one even by mistake.
*/

import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {loadRows, REPO_ROOT} from '../../scripts/lib/load-csv.mjs'
import {mapRow} from '../../scripts/import/mapper.mjs'
import {loadVerifiedOverlay, applyVerifiedOverlay} from '../data/verified.mjs'
import {loadIdentity, applyIdentity} from '../data/identity.mjs'
import {promoteAll} from '../data/promote.mjs'
import {getCounts} from '../data/counts.mjs'
import {slugifyCounty} from '../../scripts/lib/us-geo.mjs'

const STATE_NAMES = {
  WA: 'Washington', FL: 'Florida', TX: 'Texas', CA: 'California',
  NY: 'New York', AZ: 'Arizona', CO: 'Colorado', OR: 'Oregon',
}

export const stateName = st => STATE_NAMES[String(st).toUpperCase()] ?? String(st).toUpperCase()

export const citySlug = city => String(city).toLowerCase().replace(/\s+/g, '-')

let cache = null

function build() {
  if (cache) return cache

  /*
    THE IMPORTED CSV IS OPTIONAL HERE, AND THAT IS THE POINT.

    data.csv is 7.8 MB of unsourced commercial records, gitignored
    deliberately. The published site is twenty-four verified venues whose
    every fact comes from data/verified/, so it has no business needing the
    staging pile to render. When the file is absent the published set is
    built from the overlay alone; when it is present the two agree, because
    the overlay carries the same identity either way.

    county-per-row.json is indexed BY ROW POSITION in data.csv, so it is
    meaningless without it and is only read alongside it.
  */
  const csvPath = join(REPO_ROOT, 'data.csv')
  const countyPath = join(REPO_ROOT, 'reports/county-per-row.json')
  const haveImport = existsSync(csvPath) && existsSync(countyPath)

  let imported = []
  if (haveImport) {
    const county = JSON.parse(readFileSync(countyPath, 'utf8'))
    imported = loadRows().map(r => mapRow(r).venue)
    imported.forEach((v, i) => { v.county = county[i].needs_review ? null : county[i].county })
  }

  /* Identity first: canonical slugs and the quarantine flag, before any
     fact is laid over a row and before anything is promoted. */
  const identity = loadIdentity(REPO_ROOT)
  const {venues: identified} = applyIdentity(imported, identity)

  const overlay = loadVerifiedOverlay(REPO_ROOT)
  const {venues: withFacts} = applyVerifiedOverlay(identified, overlay.byKey)
  const {promoted} = promoteAll(withFacts)

  /* Group the published set by state and by city. */
  const byState = new Map()
  const byCity = new Map()
  for (const v of promoted) {
    const st = String(v.state).toUpperCase()
    const key = `${st}/${citySlug(v.city)}`
    if (!byState.has(st)) byState.set(st, [])
    byState.get(st).push(v)
    if (!byCity.has(key)) byCity.set(key, {city: v.city, state: st, venues: []})
    byCity.get(key).venues.push(v)
  }

  cache = {promoted, byState, byCity, sources: overlay.sources}
  return cache
}

/** Every published city, for nav and static params. */
export function publishedCities() {
  const {byCity} = build()
  const out = []
  for (const [key, c] of byCity) {
    out.push({
      key,
      city: c.city,
      state: c.state,
      slug: citySlug(c.city),
      stateName: stateName(c.state),
      venueCount: c.venues.length,
      county: c.venues[0]?.county ?? null,
    })
  }
  return out.sort((a, b) => b.venueCount - a.venueCount || a.city.localeCompare(b.city))
}

/** Every published state. */
export function publishedStates() {
  const {byState} = build()
  const out = []
  for (const [st, venues] of byState) {
    const cities = new Set(venues.map(v => v.city))
    out.push({state: st, stateName: stateName(st), slug: st.toLowerCase(), venueCount: venues.length, cityCount: cities.size})
  }
  return out.sort((a, b) => b.venueCount - a.venueCount)
}

/** One city's published venues plus its counts. Null if the city has none. */
export function city(stateAbbrev, slug) {
  const {byCity, promoted} = build()
  const key = `${String(stateAbbrev).toUpperCase()}/${slug}`
  const entry = byCity.get(key)
  if (!entry) return null
  const scope = {type: 'city', city: entry.city, state: entry.state}
  const county = entry.venues[0]?.county ?? null
  return {
    city: entry.city,
    state: entry.state,
    stateName: stateName(entry.state),
    slug,
    county,
    countySlug: county ? slugifyCounty(county) : null,
    venues: entry.venues,
    counts: getCounts(scope, promoted),
  }
}

/** One state's published venues plus its counts. */
export function state(stateAbbrev) {
  const {byState, promoted} = build()
  const st = String(stateAbbrev).toUpperCase()
  const venues = byState.get(st)
  if (!venues) return null
  const cities = new Map()
  for (const v of venues) {
    const s = citySlug(v.city)
    if (!cities.has(s)) cities.set(s, {city: v.city, slug: s, venues: []})
    cities.get(s).venues.push(v)
  }
  return {
    state: st,
    stateName: stateName(st),
    slug: st.toLowerCase(),
    counts: getCounts({type: 'state', state: st}, promoted),
    cities: [...cities.values()]
      .map(c => ({...c, venueCount: c.venues.length, courtCount: c.venues.reduce((n, v) => n + (v.total_courts ?? 0), 0)}))
      .sort((a, b) => b.venueCount - a.venueCount || a.city.localeCompare(b.city)),
  }
}

/** One venue by slug, within a city. */
export function venue(stateAbbrev, cSlug, vSlug) {
  const c = city(stateAbbrev, cSlug)
  if (!c) return null
  const v = c.venues.find(x => x.slug === vSlug)
  if (!v) return null
  const others = c.venues.filter(x => x.slug !== vSlug)
    .sort((a, b) => (b.total_courts ?? 0) - (a.total_courts ?? 0))
    .slice(0, 3)
  return {venue: v, city: c, alternatives: others}
}

/** Site-wide totals for the home page. */
export function siteTotals() {
  const {promoted} = build()
  const counts = getCounts({type: 'national'}, promoted)
  const cities = new Set(promoted.map(v => v.city))
  const states = new Set(promoted.map(v => String(v.state).toUpperCase()))
  const dates = promoted.map(v => v.date_checked).filter(Boolean).sort()
  return {
    counts,
    cityCount: cities.size,
    stateCount: states.size,
    lastChecked: dates[dates.length - 1] ?? null,
  }
}

/** The distinct sources behind the published set, for the provenance page. */
export function sourceList() {
  const {sources} = build()
  const seen = new Map()
  for (const s of sources) if (!seen.has(s.url)) seen.set(s.url, s)
  return [...seen.values()]
}
