#!/usr/bin/env node
/*
  The Census address geocoder, run over one city's venue addresses.

  ============================================================
  WHY THIS EXISTS AS A SCRIPT
  ============================================================

  Seven verification runs had each done this by hand, and the file they
  produced — data/sources/{city}-county-census.json — is load-bearing in all
  of them: it carries the county that Import Gate I3 checks, the postal code,
  the coordinates, and the incorporated place that decides whether a venue may
  be published under the city name at all. Seven hand-runs of the same request
  is seven chances to vary the benchmark, the vintage, or the shape of the
  file, and nothing would have caught it.

  ============================================================
  WHAT IT REFUSES TO INVENT
  ============================================================

  A non-match is written as {matched: false} and left there. It is not
  retried with a truncated address, not softened to a ZIP-centroid lookup,
  and not filled in from the imported CSV. A venue whose address the Census
  cannot find is a venue that fails Import Gate I1, and the verification run
  is where that should surface — loudly — rather than here.

  The one-line-per-address geocoder is used, not the batch endpoint, because
  the batch endpoint returns no incorporated place. The place is the whole
  point of the check that keeps a "Vancouver, WA" address in unincorporated
  Clark County out of the City of Vancouver's pages.

  USAGE
    node scripts/verify/geocode.mjs data/sources/bellevue-addresses.json

  The input is {city, state, out, addresses: {slug: "street address"}}.
*/

import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {REPO_ROOT} from '../lib/load-csv.mjs'

const BENCHMARK = 'Public_AR_Current'
const VINTAGE = 'Current_Current'
const ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/geographies/address'

const specPath = process.argv[2]
if (!specPath) {
  console.error('usage: node scripts/verify/geocode.mjs <spec.json>')
  process.exit(2)
}

const spec = JSON.parse(readFileSync(join(REPO_ROOT, specPath), 'utf8'))
const {city, state, out, addresses} = spec
if (!city || !state || !out || !addresses) {
  throw new Error(`${specPath} must hold city, state, out and addresses.`)
}

/** One address, one request. Returns the record shape every apply-* run reads. */
async function geocode(street) {
  const url = new URL(ENDPOINT)
  url.searchParams.set('street', street)
  url.searchParams.set('city', city)
  url.searchParams.set('state', state)
  url.searchParams.set('benchmark', BENCHMARK)
  url.searchParams.set('vintage', VINTAGE)
  url.searchParams.set('format', 'json')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Census geocoder returned HTTP ${res.status} for "${street}"`)
  const body = await res.json()
  const m = body?.result?.addressMatches?.[0]
  if (!m) return {matched: false, query: `${street}, ${city}, ${state}`}

  const county = m.geographies?.Counties?.[0]
  const place = m.geographies?.['Incorporated Places']?.[0]
  const zip = m.addressComponents?.zip ?? null

  return {
    matched: m.matchedAddress,
    resolver: 'census',
    lat: m.coordinates?.y ?? null,
    lon: m.coordinates?.x ?? null,
    county: county?.BASENAME ?? null,
    state_fips: county?.STATE ?? null,
    county_fips: county?.COUNTY ?? null,
    /*
      The place name as the Census writes it — "Bellevue city", not
      "Bellevue". The suffix is part of the name and the apply runs compare
      against it exactly, so it is not trimmed here to look tidier.
    */
    place: place?.NAME ?? null,
    place_matches_city: placeMatches(place?.NAME ?? null),
    postal_code: zip,
    basis: `Census address geocoder matched "${m.matchedAddress}".`,
    county_citation: county
      ? `${county.BASENAME} County, ${state} (FIPS ${county.STATE}${county.COUNTY}). Census address geocoder matched "${m.matchedAddress}".`
      : null,
  }
}

/* ---------------------------------------------------------------- */
/* THE SECOND RESOLVER                                               */
/* ---------------------------------------------------------------- */

/*
  WHY THERE IS A SECOND RESOLVER AT ALL

  Import Gate I1 requires a street address that RESOLVES, and this project
  chose one resolver to decide that. Twelve cities in, the Census address
  file had refused nine venues outright — Bellevue's Highland Community
  Park, Madison's Door Creek, Reindahl and Rennebohm, Austin's Balcones,
  Scottsdale's Ashler Hills, Saint Paul's Assembly Union, Vancouver's Fisher
  Basin — and it refuses hardest on NEW CONSTRUCTION. Assembly Union holds
  Saint Paul's first dedicated pickleball courts; Chandler's eighteen-court
  Tumbleweed facility opened recently. A directory that structurally cannot
  see the newest courts is failing at the thing players most want from it.

  So OpenStreetMap, via Nominatim, is now a second opinion — used ONLY where
  the Census has no record at all, never to overrule it.

  WHAT AN OSM MATCH HAS TO BE

  Nominatim will happily answer an unfindable house number with the STREET
  it sits on. That is not an address resolving; that is a street resolving,
  and accepting it would gut the gate — Vancouver's Fisher Basin Community
  Park was refused precisely because "SE 192nd Ave" carries no house number,
  and a street-level fallback would have waved it through.

  So an OSM result counts only when it is ADDRESS-LEVEL: it carries a house
  number, and that house number is the one we asked for. Measured against
  the nine refusals above, that rule admits four and still refuses five,
  including both Chandler venues this resolver was first tested against.
  A rule that had admitted them would have been a rule written to reach a
  wanted answer.

  RATE LIMIT AND IDENTITY

  Nominatim's usage policy allows at most one request per second and
  requires a User-Agent identifying the application. Both are honoured
  below; this is somebody's donated infrastructure.
*/
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_UA =
  'FindPickleballCourts/1.0 (municipal court directory verification; https://pickleball-courts-cyan.vercel.app)'
const NOMINATIM_MIN_INTERVAL_MS = 1100

let lastNominatimCall = 0
const throttle = async () => {
  const wait = NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimCall)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastNominatimCall = Date.now()
}

/** Normalised comparison of a resolved place name against the city asked for. */
const norm = s => String(s ?? '').toLowerCase().replace(/\b(city|town|village|cdp)\b/g, '').replace(/[^a-z]/g, '')
const placeMatches = resolved => (resolved ? norm(resolved) === norm(city) : false)

async function geocodeOSM(street) {
  const wantedNumber = (String(street).match(/^\s*(\d+)/) ?? [])[1] ?? null
  await throttle()
  const url = new URL(NOMINATIM)
  url.searchParams.set('q', `${street}, ${city}, ${state}`)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '1')

  const res = await fetch(url, {headers: {'User-Agent': NOMINATIM_UA}})
  if (!res.ok) return null
  const [hit] = await res.json()
  if (!hit) return null

  const a = hit.address ?? {}
  const houseNumber = a.house_number ?? null

  /* Address-level only. See the header: a street is not an address. */
  if (!wantedNumber || !houseNumber || String(houseNumber) !== String(wantedNumber)) return null

  const countyName = String(a.county ?? '').replace(/\s+County$/i, '') || null
  const placeName = a.city ?? a.town ?? a.village ?? a.municipality ?? null

  return {
    matched: hit.display_name,
    resolver: 'osm',
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    county: countyName,
    /* OpenStreetMap carries no FIPS codes. Stated as absent, not faked. */
    state_fips: null,
    county_fips: null,
    place: placeName,
    place_matches_city: placeMatches(placeName),
    postal_code: a.postcode ?? null,
    basis:
      `OpenStreetMap (Nominatim) matched "${hit.display_name}" at house-number level. ` +
      'The Census address file holds no record of this address, so this is the second resolver rather than the first.',
    county_citation: countyName
      ? `${countyName} County, ${state}. The Census address file has no record of this address; OpenStreetMap resolves it to a house number and places it in ${countyName} County.`
      : null,
  }
}

const result = {}
for (const [slug, street] of Object.entries(addresses)) {
  let rec = await geocode(street)
  if (!rec.matched) {
    const osm = await geocodeOSM(street)
    if (osm) rec = osm
    else rec.resolver = null
  }
  result[slug] = rec
  const where = rec.matched
    ? `${rec.county} County · ${rec.place} · ${rec.postal_code} · via ${rec.resolver}`
    : 'NO MATCH'
  console.log(`  ${slug.padEnd(36)} ${where}`)
}

writeFileSync(join(REPO_ROOT, out), JSON.stringify(result, null, 2) + '\n')
const misses = Object.values(result).filter(r => !r.matched).length
console.log(`\nWrote ${out} — ${Object.keys(result).length} addresses, ${misses} unmatched\n`)
