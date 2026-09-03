/*
  Internal linking — the single place that decides what may be linked to.

  Phase 4 deliverable 3. The rules are short and the enforcement is the
  point: every href on the site is minted here, so "nothing ever links to a
  pending venue, an unpublished city or a below-threshold county" is a
  property of the code rather than a habit.

  THE RULES

    state   -> every city published in it
    city    -> up to its county and state, across to the 5 nearest published
               cities
    venue   -> up to its city, across to 3 alternatives in the same city
    every page carries a full BreadcrumbList

  WHY A LINK REGISTRY AND NOT JUST href STRINGS

  A link to a page that does not exist is the Pickleheads failure that
  decisions.md §3 exists to prevent — they serve hard 404s on pages worth
  1,475 and 463 visits a month. The cheapest way to ship one is to build an
  href from data without checking the target publishes.

  So hrefs come from linkTo*(), which returns null when the target is not
  published, and callers must handle null. A county below the 3-verified
  threshold, a city with fewer than 3 verified venues, a pending venue: all
  return null, and the page renders prose explaining the gap instead of a
  dead link.

  THRESHOLDS

  A county page needs 3+ verified venues, same as a city (Rule 8).

  A STATE page has no threshold in the brief, and needs one. A state with a
  single published city has no distinct document to be: everything true of
  Washington today is true of Seattle, so a state page would either repeat
  the city page or pad, and Rule 9 forbids two URLs competing for one
  intent. STATE_MIN_CITIES is set to 3 and recorded as an open decision.
*/

import {getCounts} from '../data/counts.mjs'
import {slugifyCounty} from '../../scripts/lib/us-geo.mjs'

export const MIN_VERIFIED = 3
export const STATE_MIN_CITIES = 3
export const NEAREST_CITIES = 5
export const VENUE_ALTERNATIVES = 3

const lower = s => String(s ?? '').toLowerCase()
export const citySlugOf = c => lower(c).replace(/\s+/g, '-')

/* ---- path builders. Shape only; publication is checked separately. ---- */

export const statePath = st => `/pickleball/us/${lower(st)}/`
export const countyPath = (st, county) => `/pickleball/us/${lower(st)}/${slugifyCounty(county)}-county/`
export const cityPath = (st, citySlug) => `/pickleball/us/${lower(st)}/${citySlug}/`
export const venuePath = (st, citySlug, venueSlug) => `${cityPath(st, citySlug)}${venueSlug}/`
export const filterPath = (st, citySlug, filter) => `${cityPath(st, citySlug)}${filter}/`

/* ---------------------------------------------------------------- */

/**
 * Build the link graph from the published venue set.
 * Everything downstream asks this object what exists.
 */
export function buildLinkGraph(publishedVenues) {
  const venues = [...publishedVenues]

  const cities = new Map()   // "WA/seattle" -> {city, state, slug, venues[]}
  const counties = new Map() // "WA/king"    -> {county, state, slug, venues[]}

  for (const v of venues) {
    const st = String(v.state).toUpperCase()
    const cs = citySlugOf(v.city)
    const ck = `${st}/${cs}`
    if (!cities.has(ck)) cities.set(ck, {city: v.city, state: st, slug: cs, venues: []})
    cities.get(ck).venues.push(v)

    if (v.county) {
      const nk = `${st}/${lower(v.county)}`
      if (!counties.has(nk)) counties.set(nk, {county: v.county, state: st, slug: slugifyCounty(v.county), venues: []})
      counties.get(nk).venues.push(v)
    }
  }

  /* Only entities that clear their threshold are publishable. */
  const publishedCities = new Map()
  for (const [k, c] of cities) if (c.venues.length >= MIN_VERIFIED) publishedCities.set(k, c)

  const publishedCounties = new Map()
  for (const [k, c] of counties) if (c.venues.length >= MIN_VERIFIED) publishedCounties.set(k, c)

  const publishedStates = new Map()
  const byState = new Map()
  for (const c of publishedCities.values()) {
    if (!byState.has(c.state)) byState.set(c.state, [])
    byState.get(c.state).push(c)
  }
  for (const [st, list] of byState) {
    if (list.length >= STATE_MIN_CITIES) publishedStates.set(st, list)
  }

  const publishedVenueSlugs = new Set(
    [...publishedCities.values()].flatMap(c => c.venues.map(v => v.slug)))

  return {
    venues, cities, counties,
    publishedCities, publishedCounties, publishedStates, publishedVenueSlugs,
    byState,
  }
}

/* ---- link-to helpers. Each returns null when the target is unpublished. ---- */

export function linkToCity(graph, state, citySlug) {
  const c = graph.publishedCities.get(`${String(state).toUpperCase()}/${citySlug}`)
  return c ? {href: cityPath(c.state, c.slug), label: `${c.city}, ${c.state}`, venues: c.venues.length} : null
}

export function linkToCounty(graph, state, county) {
  if (!county) return null
  const c = graph.publishedCounties.get(`${String(state).toUpperCase()}/${lower(county)}`)
  return c ? {href: countyPath(c.state, c.county), label: `${c.county} County`, venues: c.venues.length} : null
}

export function linkToState(graph, state) {
  const st = String(state).toUpperCase()
  return graph.publishedStates.has(st) ? {href: statePath(st), label: st} : null
}

export function linkToVenue(graph, state, citySlug, venueSlug) {
  if (!graph.publishedVenueSlugs.has(venueSlug)) return null
  return {href: venuePath(state, citySlug, venueSlug)}
}

/**
 * The 5 nearest published cities to this one, by centroid distance.
 * Cities with no coordinates are skipped rather than guessed at.
 */
export function nearestCities(graph, state, citySlug, limit = NEAREST_CITIES) {
  const me = graph.publishedCities.get(`${String(state).toUpperCase()}/${citySlug}`)
  if (!me) return []
  const centre = centroid(me.venues)
  if (!centre) return []

  const out = []
  for (const [k, c] of graph.publishedCities) {
    if (k === `${String(state).toUpperCase()}/${citySlug}`) continue
    const p = centroid(c.venues)
    if (!p) continue
    out.push({
      href: cityPath(c.state, c.slug),
      label: `${c.city}, ${c.state}`,
      venues: c.venues.length,
      km: haversine(centre.lat, centre.lng, p.lat, p.lng),
    })
  }
  return out.sort((a, b) => a.km - b.km).slice(0, limit)
}

function centroid(venues) {
  const pts = venues.filter(v => typeof v.latitude === 'number' && typeof v.longitude === 'number')
  if (pts.length === 0) return null
  return {
    lat: pts.reduce((n, v) => n + v.latitude, 0) / pts.length,
    lng: pts.reduce((n, v) => n + v.longitude, 0) / pts.length,
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const r = d => (d * Math.PI) / 180
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Counts for a county scope, through the one count module. */
export const countyCounts = (graph, state, county) =>
  getCounts({type: 'county', county, state: String(state).toUpperCase()}, graph.venues)
