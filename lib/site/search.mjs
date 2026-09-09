/*
  Search.

  ============================================================
  WHY THERE IS NO JAVASCRIPT IN HERE
  ============================================================

  Rule 1: every page renders its content, links and schema in raw HTML with
  JavaScript disabled. A typeahead that builds results in the browser would
  break that, and it is exactly the failure PlayPickleball ships across
  25,245 pages.

  So this is the oldest pattern on the web and it still works: a
  <form method="get"> posts to /search/, the server reads the query string,
  and the results page is rendered on the server like every other page. It
  works with JS off, it works in a text browser, it is linkable and
  shareable, and the back button behaves. No framework needed.

  ============================================================
  WHAT A ZIP CODE IS MATCHED AGAINST, AND WHY NOT THE OBVIOUS THING
  ============================================================

  Twenty of the twenty-four verified Seattle venues carry a postal_code, and
  matching a typed ZIP straight against those would be the easy
  implementation. It would also be wrong. Those postcodes came from the
  unsourced commercial import and were never verified — one of them turned
  out to be a street number in the wrong column — so routing a real person
  to a real place on the strength of them is exactly the kind of
  quietly-unsourced behaviour the rest of this project refuses.

  Instead a ZIP is resolved through the Census ZCTA-to-county relationship
  file already in data/reference/, the same public-domain source the Phase 1
  county backfill uses. ZIP resolves to a county, and the county is matched
  against what we actually publish. That is a sourced chain from end to end.

  ============================================================
  WHAT SEARCH WILL NOT DO
  ============================================================

  It only ever returns pages that exist. A venue with no page, a city below
  the three-venue threshold, a county below it, a state below the
  three-city threshold: none can be returned, because the results are built
  from the same link graph the site links through. Search cannot become a
  back door to an unpublished page.
*/

import {readFileSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {FIPS_TO_STATE, STATE_NAMES} from '../../scripts/lib/us-geo.mjs'
import {buildLinkGraph, cityPath, countyPath, venuePath, citySlugOf} from './links.mjs'
import {qualifyingFilters} from '../page/city-page.mjs'
import * as data from './data.mjs'
import {venuePagePublishes} from './views.mjs'
import {courtPhoto, cityCourtPhoto, courtCardPhoto} from './photos.mjs'

const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const isNum = n => typeof n === 'number' && Number.isFinite(n)
/* Five decimals is about a metre. Anything past that is noise in a file we
   ship to every visitor who taps the search box. */
const round5 = n => Math.round(n * 1e5) / 1e5

/*
  A published place's coordinates: the mean of its venues'.

  maps.mjs is right that averaging latitudes is wrong in Mercator, and it
  matters there because a tile viewport is being centred in pixels. Here the
  number is only ever an argument to "which of our cities is closest to
  you", over a few kilometres of city, so the arithmetic mean is the honest
  simple thing rather than a projection error waiting to happen.
*/
const centroid = venues => {
  const pts = (venues ?? []).filter(v => isNum(v.latitude) && isNum(v.longitude))
  if (!pts.length) return null
  return {
    lat: round5(pts.reduce((s, v) => s + v.latitude, 0) / pts.length),
    lng: round5(pts.reduce((s, v) => s + v.longitude, 0) / pts.length),
  }
}

/* ---- ZIP -> county, from the Census file already in the repo ---- */

let zipIndex = null
function zipToCounties(repoRoot) {
  if (zipIndex) return zipIndex
  zipIndex = new Map()
  const f = join(repoRoot, 'data/reference/tab20_zcta520_county20_natl.txt')
  if (!existsSync(f)) return zipIndex

  const raw = readFileSync(f, 'utf8')
  const lines = raw.split(/\r?\n/)
  const head = lines[0].replace(/^﻿/, '').split('|')
  const iZip = head.indexOf('GEOID_ZCTA5_20')
  const iCountyFips = head.indexOf('GEOID_COUNTY_20')
  const iCountyName = head.indexOf('NAMELSAD_COUNTY_20')
  if (iZip < 0 || iCountyFips < 0) return zipIndex

  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split('|')
    const zip = c[iZip]
    const fips = c[iCountyFips]
    if (!zip || !fips) continue
    const state = FIPS_TO_STATE[fips.slice(0, 2)]
    if (!state) continue
    /* "King County" -> "King". Louisiana parishes and Alaska boroughs keep
       their own words, so only the trailing "County" is stripped. */
    const bare = String(c[iCountyName] ?? '').replace(/\s+County$/i, '').trim()
    if (!zipIndex.has(zip)) zipIndex.set(zip, [])
    zipIndex.get(zip).push({state, county: bare})
  }
  return zipIndex
}

/*
  THE RESULT SHAPE.

  Four code paths used to spell out {type, label, href, meta} by hand, so a
  field added to the index reached none of them — the photograph and the
  badges added on 2026-09-09 arrived in the index and were silently dropped
  on the way out, four times over. One function now decides what a result
  carries, and `haystack` and `terms` are the only things deliberately left
  behind because they are matching machinery, not content.
*/
const asResult = e => ({
  type: e.type,
  label: e.label,
  href: e.href,
  meta: e.meta,
  detail: e.detail ?? null,
  photo: e.photo ?? null,
  badges: e.badges ?? [],
})

/* ---- the index, built from what is actually published ---- */

/*
  WHY THIS IS BUILT AHEAD OF TIME.

  /search/ is the only route on the site rendered on demand; every other
  page is prerendered. It used to construct this index per cold start,
  which meant parsing data.csv — 18,038 rows, 7.5 MB — laying the verified
  overlay over it, running promotion and building the whole link graph,
  plus a 6.8 MB Census ZCTA file for ZIP lookups. Roughly 14 MB of text and
  the full data layer, to answer one query about 385 published pages. The
  build itself needs --max-old-space-size=2048 for the same work.

  scripts/build-search-index.mjs now runs that once at build time and
  writes data/search-index.json, which holds only the published entries and
  only the ZIP codes that resolve to a county we publish. The function
  loads that instead: kilobytes, no CSV, no overlay, no link graph.

  buildSearchIndex() below is the single implementation. The script calls
  it; this reads its output. If the file is missing — a fresh clone, a
  script run before the first build — index() falls back to building in
  process, so nothing silently returns an empty index.
*/
const PREBUILT = repoRoot => join(repoRoot, 'data', 'search-index.json')

let cache = null
function index(repoRoot) {
  if (cache) return cache

  const f = PREBUILT(repoRoot)
  if (existsSync(f)) {
    const doc = JSON.parse(readFileSync(f, 'utf8'))
    for (const e of doc.entries) e.haystack = norm(e.terms.filter(Boolean).join(' '))
    cache = {entries: doc.entries, zip: doc.zip ?? {}, venuesTotal: doc.venuesTotal ?? null}
    return cache
  }

  cache = buildSearchIndex(repoRoot)
  return cache
}

/**
 * Build the index from the published data. Build time only — this is what
 * pulls in the CSV, the overlay and the link graph.
 */
export function buildSearchIndex(repoRoot) {
  const cities = data.publishedCities()
  const allVenues = cities.flatMap(c => data.city(c.state, c.slug).venues)
  const graph = buildLinkGraph(allVenues)

  const entries = []

  for (const [, c] of graph.publishedCities) {
    const cityCourts = c.venues.reduce((n, v) => n + (v.total_courts ?? 0), 0)
    entries.push({
      type: 'city',
      label: `${c.city}, ${c.state}`,
      href: cityPath(c.state, c.slug),
      meta: `${c.venues.length} verified venues`,
      /* A result is a card now, so it carries what a card shows. */
      photo: cityCourtPhoto(c.state, c.slug, c.city),
      detail: `${c.venues.length} ${c.venues.length === 1 ? 'venue' : 'venues'}${cityCourts ? ` · ${cityCourts} courts` : ''}`,
      terms: [c.city, c.state, STATE_NAMES[c.state] ?? ''],
    })
    for (const f of Object.keys(qualifyingFilters(c.venues))) {
      entries.push({
        type: 'filter',
        /* Which filter this is, so ?filter= can select on it rather than
           inferring the category back out of the label it printed. */
        filter: f,
        /* And where it is, so a filter can be scoped to one state without
           parsing the state back out of the href. */
        state: c.state,
        label: `${f === 'lights' ? 'Lit' : f[0].toUpperCase() + f.slice(1)} courts in ${c.city}`,
        href: `${cityPath(c.state, c.slug)}${f}/`,
        meta: `${c.city}, ${c.state}`,
        photo: courtCardPhoto(`F/${c.state}/${c.slug}/${f}`, `${c.city}, ${c.state}`),
        detail: `${c.city}, ${c.state}`,
        terms: [f, c.city, f === 'lights' ? 'lit lighting evening night' : '', 'courts'],
      })
    }
  }

  for (const c of graph.publishedCounties.values()) {
    const countyCourts = c.venues.reduce((n, v) => n + (v.total_courts ?? 0), 0)
    entries.push({
      type: 'county',
      /* Carried so the prebuilt ZIP map can be filtered to published
         counties without re-deriving them from the label. */
      state: c.state,
      county: c.county,
      label: `${c.county} County, ${c.state}`,
      href: countyPath(c.state, c.county),
      meta: `${c.venues.length} verified venues`,
      photo: courtCardPhoto(`CO/${c.state}/${c.county}`, `${c.county} County`),
      detail: `${c.venues.length} ${c.venues.length === 1 ? 'venue' : 'venues'}${countyCourts ? ` · ${countyCourts} courts` : ''}`,
      terms: [c.county, `${c.county} county`, c.state, STATE_NAMES[c.state] ?? ''],
    })
  }

  for (const v of allVenues) {
    if (!venuePagePublishes(v.state, citySlugOf(v.city), v.slug)) continue
    entries.push({
      type: 'venue',
      label: v.name,
      href: venuePath(v.state, citySlugOf(v.city), v.slug),
      meta: `${v.city}, ${v.state}${v.total_courts ? ` · ${v.total_courts} courts` : ''}`,
      photo: courtPhoto(v.slug, v.name),
      detail: `${v.city}, ${v.state}`,
      /*
        The same badges the state page uses, on the same rule: a stated
        fact or nothing. No count badge where the operator publishes no
        count, no Lit badge where lighting is unstated.
      */
      badges: [
        typeof v.total_courts === 'number' ? `${v.total_courts} ${v.total_courts === 1 ? 'court' : 'courts'}` : null,
        (v.indoor_courts ?? 0) > 0 && (v.outdoor_courts ?? 0) > 0 ? 'In & Out'
          : (v.indoor_courts ?? 0) > 0 ? 'Indoor'
            : (v.outdoor_courts ?? 0) > 0 ? 'Outdoor' : null,
        v.light === true ? 'Lit' : null,
      ].filter(Boolean),
      terms: [v.name, v.city, v.street_address ?? ''],
    })
  }

  for (const e of entries) e.haystack = norm(e.terms.filter(Boolean).join(' '))

  /*
    Only the ZIP codes that resolve to a county we actually publish. The
    Census file maps every ZCTA in the country; the 26 counties on this
    site need a few hundred rows of it, and shipping the other six million
    characters to a function that will never match them is the bulk of what
    made this route expensive.
  */
  const publishedCounties = new Set(
    entries.filter(e => e.type === 'county').map(e => `${e.state}/${norm(e.county)}`))
  const zip = {}
  for (const [z, hits] of zipToCounties(repoRoot)) {
    const keep = hits.filter(h => publishedCounties.has(`${h.state}/${norm(h.county)}`))
    if (keep.length) zip[z] = keep
  }

  /*
    Rule 2: this number still comes from getCounts(), here at build time,
    exactly as every prerendered page's numbers do. Serialising it is what
    lets the function answer without loading the data layer at all.
  */
  const venuesTotal = data.siteTotals().counts.venues.value

  return {entries, zip, venuesTotal, suggest: buildSuggest(graph, allVenues)}
}

/*
  ============================================================
  THE TYPEAHEAD INDEX — public/suggest.json
  ============================================================

  A SECOND, MUCH SMALLER FILE, AND IT IS NOT THE SAME FILE AS THE ONE ABOVE.

  data/search-index.json is read by the /search/ function on the server: it
  carries photographs, badges and prose details, because the results page
  renders cards. Sending 400 KB of that to a phone so a dropdown can list
  five court names would be absurd. This file carries a label, a href, one
  line of meta, the match terms and a coordinate pair — nothing else, with
  one-letter keys — and comes to roughly a tenth of the size.

  WHY THERE ARE COORDINATES IN IT AT ALL. The panel ranks by distance, and
  the ranking happens IN THE BROWSER. That is a privacy decision as much as
  a performance one: when somebody grants precise location, their
  coordinates are compared against this file locally and are never sent
  anywhere. There is no endpoint here that receives a person's position,
  because there is no code path that would need one.

  The coordinates are the same verified lat/lng the city maps are plotted
  from — Rule 7 facts with a source behind them, not a geocoding guess made
  for this feature.

  FILTER PAGES ARE DELIBERATELY ABSENT. The dropdown answers "where am I and
  what is near me". "Lit courts in Bellevue" is a category, not a place, and
  it is what the four hero buttons and /search/?filter= are for.
*/
function buildSuggest(graph, allVenues) {
  const places = []
  const courts = []

  for (const [, c] of graph.publishedCities) {
    const at = centroid(c.venues)
    if (!at) continue
    const cityCourts = c.venues.reduce((n, v) => n + (v.total_courts ?? 0), 0)
    places.push({
      k: 'city',
      l: `${c.city}, ${c.state}`,
      h: cityPath(c.state, c.slug),
      m: `${c.venues.length} ${c.venues.length === 1 ? 'venue' : 'venues'}${cityCourts ? ` · ${cityCourts} courts` : ''}`,
      t: norm([c.city, c.state, STATE_NAMES[c.state] ?? ''].join(' ')),
      y: at.lat,
      x: at.lng,
    })
  }

  for (const c of graph.publishedCounties.values()) {
    const at = centroid(c.venues)
    if (!at) continue
    places.push({
      k: 'county',
      l: `${c.county} County, ${c.state}`,
      h: countyPath(c.state, c.county),
      m: `${c.venues.length} ${c.venues.length === 1 ? 'venue' : 'venues'}`,
      t: norm([c.county, `${c.county} county`, c.state, STATE_NAMES[c.state] ?? ''].join(' ')),
      y: at.lat,
      x: at.lng,
    })
  }

  for (const v of allVenues) {
    if (!venuePagePublishes(v.state, citySlugOf(v.city), v.slug)) continue
    /*
      One published venue has no coordinates. It keeps its page, its city
      page still lists it, and /search/ still finds it by name; it just
      cannot be ranked by distance, so it is not in the file the distance
      ranking reads. Shipping it with a made-up position to keep the count
      round is exactly the class of thing Rule 6 forbids.
    */
    if (!isNum(v.latitude) || !isNum(v.longitude)) continue
    courts.push({
      l: v.name,
      h: venuePath(v.state, citySlugOf(v.city), v.slug),
      m: `${v.city}, ${v.state}${v.total_courts ? ` · ${v.total_courts} ${v.total_courts === 1 ? 'court' : 'courts'}` : ''}`,
      t: norm([v.name, v.city, v.state].join(' ')),
      y: round5(v.latitude),
      x: round5(v.longitude),
    })
  }

  places.sort((a, b) => a.l.localeCompare(b.l))
  courts.sort((a, b) => a.l.localeCompare(b.l))
  return {places, courts}
}

/* ---- browsing by filter ---- */

/*
  WHY ?filter= EXISTS, AND WHY IT IS NOT A PAGE OF ITS OWN

  The home page offers four buttons — outdoor, indoor, lights, free — and
  the obvious destination for "Indoor" would be a site-wide /indoor/ page
  listing every indoor court in the country. There is no such page and
  there is not going to be one: decisions.md §2 fixes the URL patterns as
  immutable, and a filter lives under a city
  (/pickleball/us/wa/bellevue/indoor/) because that is the only scope at
  which this directory can claim a complete answer. A national /indoor/
  page would be a list of the cities we happen to have verified, dressed
  up as a list of the country's indoor courts.

  So the button lands on search, which is noindex and honest about being
  a way around the site rather than a destination. What it returns is
  every city filter page of that kind — the pages that do exist.

  This is a first-class parameter rather than ?q=indoor because a keyword
  search is an accident waiting to happen: it would match anything whose
  name contains the word, and the button would silently start returning
  venues the day somebody publishes a court called the Indoor Tennis
  Centre. A button that promises a category has to be answered by the
  category, not by a string.
*/
const FILTER_BROWSE = Object.freeze({
  outdoor: {noun: 'outdoor courts', label: 'Outdoor courts'},
  indoor: {noun: 'indoor courts', label: 'Indoor courts'},
  lights: {noun: 'courts with lights', label: 'Courts with lights'},
  free: {noun: 'courts that are free to play', label: 'Free to play'},
})

export const isBrowsableFilter = f => Object.hasOwn(FILTER_BROWSE, String(f ?? ''))

/*
  Resolve a typed query to a state, or null. Accepts the postal code and the
  full name, so both "WA" and "Washington" scope a filter to Washington.
*/
function stateFromQuery(raw) {
  const q = norm(raw)
  if (!q) return null
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    if (q === norm(code) || q === norm(name)) return code
  }
  return null
}

/*
  A filter, optionally inside one state.

  Before this, a filter answered before any typed query, so
  /search/?q=Washington&filter=indoor threw Washington away and listed
  indoor cities nationally. The state pages need the scoped version: Rule 4
  caps indexable filter pages at five PER CITY, so a state-level facet
  cannot be a page and has to be exactly this — a noindex query parameter,
  which is what Rule 4 says every other facet should be.
*/
function browseByFilter(f, entries, browse, stateCode = null) {
  const {noun, label} = FILTER_BROWSE[f]
  const results = entries
    .filter(e => e.type === 'filter' && e.filter === f)
    .filter(e => !stateCode || e.state === stateCode)
    .sort((a, b) => a.label.localeCompare(b.label))

  /*
    The count is of CITIES, and the sentence says so. It would be easy to
    write "42 indoor courts" here by summing the venues behind these
    pages, and it would be a number about our coverage wearing the clothes
    of a number about the world.
  */
  return {
    query: label,
    kind: 'filter',
    note: results.length
      ? `${results.length} of the ${browse.filter(b => b.type === 'city').length} cities we publish ` +
        `${results.length === 1 ? 'has' : 'have'} a verified page for ${noun}. ` +
        'A city appears here when three or more of its verified venues qualify, so this is where we can answer the question rather than everywhere it has an answer.'
      : `No city we publish yet has three verified venues with ${noun}, so there is no page to show you.`,
    results: results.map(asResult),
    suggestions: results.length ? [] : browse,
  }
}

/* ---- the query ---- */

/**
 * @returns {{query, kind, note, results, suggestions}}
 */
/** The published-venue count, precomputed at build time. */
export const venuesTotal = repoRoot => index(repoRoot).venuesTotal

export function search(q, repoRoot, filter = null) {
  const raw = String(q ?? '').trim()
  const {entries} = index(repoRoot)

  const browse = entries
    .filter(e => e.type === 'city' || e.type === 'county')
    .map(asResult)

  /* A filter button was pressed. It answers before any typed query. */
  if (isBrowsableFilter(filter)) {
    return browseByFilter(String(filter), entries, browse, stateFromQuery(raw))
  }

  if (!raw) {
    return {
      query: '', kind: 'empty',
      note: 'Enter a city, a state, a ZIP code or the name of a court.',
      results: [], suggestions: browse,
    }
  }

  /* A five-digit query is a ZIP. Resolve it through the Census file. */
  if (/^\d{5}$/.test(raw)) {
    /* The prebuilt map, or the Census file when there is no prebuilt. */
    const idx = index(repoRoot)
    const hits = idx.zip ? (idx.zip[raw] ?? []) : (zipToCounties(repoRoot).get(raw) ?? [])
    if (hits.length === 0) {
      return {
        query: raw, kind: 'zip',
        note: `We could not resolve ${raw} to a county. It may not be a residential ZIP code, or it may not appear in the 2020 Census ZCTA file we use.`,
        results: [], suggestions: browse,
      }
    }
    const wanted = new Set(hits.map(h => `${h.state}/${norm(h.county)}`))
    const results = entries.filter(e =>
      (e.type === 'county' || e.type === 'city') &&
      hits.some(h => e.haystack.includes(norm(h.county)) || e.haystack.includes(norm(h.state))))

    const where = hits.map(h => `${h.county} County, ${h.state}`).join(' or ')
    return {
      query: raw, kind: 'zip',
      note: results.length
        ? `${raw} is in ${where}. Here is what we publish there.`
        : `${raw} is in ${where}, and we have not verified any venue there yet.`,
      results: results.map(asResult),
      suggestions: results.length ? [] : browse,
    }
  }

  /* Otherwise: token match. Every token must appear somewhere in the entry. */
  const tokens = norm(raw).split(' ').filter(Boolean)
  const scored = []
  for (const e of entries) {
    if (!tokens.every(t => e.haystack.includes(t))) continue
    /* Rank: an exact label match first, then prefix, then the rest;
       and within a tie, place before venue so a city search leads with
       the city page rather than one of its courts. */
    const label = norm(e.label)
    const exact = label === norm(raw) ? 0 : label.startsWith(norm(raw)) ? 1 : 2
    const typeRank = {city: 0, county: 1, filter: 2, venue: 3}[e.type] ?? 4
    scored.push({e, rank: exact * 10 + typeRank})
  }
  scored.sort((a, b) => a.rank - b.rank || a.e.label.localeCompare(b.e.label))

  return {
    query: raw,
    kind: 'text',
    note: scored.length
      ? `${scored.length} ${scored.length === 1 ? 'match' : 'matches'} for “${raw}”.`
      : `Nothing published matches “${raw}”. We only return pages that exist, and we have verified one city so far.`,
    results: scored.map(({e}) => asResult(e)),
    suggestions: scored.length ? [] : browse,
  }
}
