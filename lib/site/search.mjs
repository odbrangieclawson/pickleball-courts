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

const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

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

/* ---- the index, built from what is actually published ---- */

let cache = null
function index(repoRoot) {
  if (cache) return cache

  const cities = data.publishedCities()
  const allVenues = cities.flatMap(c => data.city(c.state, c.slug).venues)
  const graph = buildLinkGraph(allVenues)

  const entries = []

  for (const [, c] of graph.publishedCities) {
    entries.push({
      type: 'city',
      label: `${c.city}, ${c.state}`,
      href: cityPath(c.state, c.slug),
      meta: `${c.venues.length} verified venues`,
      terms: [c.city, c.state, STATE_NAMES[c.state] ?? ''],
    })
    for (const f of Object.keys(qualifyingFilters(c.venues))) {
      entries.push({
        type: 'filter',
        /* Which filter this is, so ?filter= can select on it rather than
           inferring the category back out of the label it printed. */
        filter: f,
        label: `${f === 'lights' ? 'Lit' : f[0].toUpperCase() + f.slice(1)} courts in ${c.city}`,
        href: `${cityPath(c.state, c.slug)}${f}/`,
        meta: `${c.city}, ${c.state}`,
        terms: [f, c.city, f === 'lights' ? 'lit lighting evening night' : '', 'courts'],
      })
    }
  }

  for (const c of graph.publishedCounties.values()) {
    entries.push({
      type: 'county',
      label: `${c.county} County, ${c.state}`,
      href: countyPath(c.state, c.county),
      meta: `${c.venues.length} verified venues`,
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
      terms: [v.name, v.city, v.street_address ?? ''],
    })
  }

  for (const e of entries) e.haystack = norm(e.terms.filter(Boolean).join(' '))

  cache = {entries, graph}
  return cache
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

function browseByFilter(f, entries, browse) {
  const {noun, label} = FILTER_BROWSE[f]
  const results = entries
    .filter(e => e.type === 'filter' && e.filter === f)
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
    results: results.map(({type, label: l, href, meta}) => ({type, label: l, href, meta})),
    suggestions: results.length ? [] : browse,
  }
}

/* ---- the query ---- */

/**
 * @returns {{query, kind, note, results, suggestions}}
 */
export function search(q, repoRoot, filter = null) {
  const raw = String(q ?? '').trim()
  const {entries} = index(repoRoot)

  const browse = entries
    .filter(e => e.type === 'city' || e.type === 'county')
    .map(({type, label, href, meta}) => ({type, label, href, meta}))

  /* A filter button was pressed. It answers before any typed query. */
  if (isBrowsableFilter(filter)) return browseByFilter(String(filter), entries, browse)

  if (!raw) {
    return {
      query: '', kind: 'empty',
      note: 'Enter a city, a state, a ZIP code or the name of a court.',
      results: [], suggestions: browse,
    }
  }

  /* A five-digit query is a ZIP. Resolve it through the Census file. */
  if (/^\d{5}$/.test(raw)) {
    const hits = zipToCounties(repoRoot).get(raw) ?? []
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
      results: results.map(({type, label, href, meta}) => ({type, label, href, meta})),
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
    results: scored.map(({e}) => ({type: e.type, label: e.label, href: e.href, meta: e.meta})),
    suggestions: scored.length ? [] : browse,
  }
}
