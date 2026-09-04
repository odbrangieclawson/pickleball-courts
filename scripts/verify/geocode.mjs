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

/*
  ORDINALS ARE SPELLING, NOT DATA.

  Cape Coral writes "1718 SW 52 Terrace" and "2817 SW 3 Lane". Nominatim
  finds neither, and finds both instantly as "52nd Terrace" and "3rd Lane".
  Without this, the street-type check above would report "OpenStreetMap has
  no record of the address as written" and let a Census match for the WRONG
  STREET stand — which is the exact failure the check exists to prevent.

  Only the ordinal suffix is added, and only to a bare number sitting
  directly before a street type. Nothing else about the address is altered:
  the house number, the direction and the street type are all left as the
  operator wrote them, and the result still has to match at house-number
  level to count.
*/
const ordinal = n => {
  const v = Number(n)
  if (v % 100 >= 11 && v % 100 <= 13) return `${v}th`
  return `${v}${['th', 'st', 'nd', 'rd'][v % 10] ?? 'th'}`
}

const withOrdinals = street => String(street).replace(
  /\b(\d+)\s+(Street|St|Terrace|Ter|Lane|Ln|Court|Ct|Place|Pl|Avenue|Ave|Road|Rd|Way|Circle|Cir|Drive|Dr)\b/gi,
  (_, n, type) => `${ordinal(n)} ${type}`)

async function geocodeOSM(street) {
  const wantedNumber = (String(street).match(/^\s*(\d+)/) ?? [])[1] ?? null

  /* As written first; then the same street with its ordinal spelled out. */
  const variants = [street]
  const ord = withOrdinals(street)
  if (ord !== street) variants.push(ord)

  let hit = null
  for (const variant of variants) {
    await throttle()
    const url = new URL(NOMINATIM)
    url.searchParams.set('q', `${variant}, ${city}, ${state}`)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '1')

    const res = await fetch(url, {headers: {'User-Agent': NOMINATIM_UA}})
    if (!res.ok) continue
    const [candidate] = await res.json()
    if (candidate) { hit = candidate; break }
  }
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

/* ---------------------------------------------------------------- */
/* THE STREET TYPE IS PART OF THE ADDRESS                            */
/* ---------------------------------------------------------------- */

/*
  WHY THIS CHECK EXISTS

  The Census geocoder will silently change a street's TYPE and still report
  a confident match. Asked for "1718 SW 52 Terrace, Cape Coral" it answers
  "1718 SW 52ND ST" — and in Cape Coral those are two different streets,
  seventy-seven metres apart, both carrying a house number 1718. The
  postcode agreed, the county agreed, the place agreed. Nothing downstream
  could have caught it, and three Cape Coral venues would have published
  coordinates for the wrong street.

  An audit of the 85 addresses resolved across the whole project found four
  type mismatches: three in Cape Coral and one in Austin. The Austin one is
  the reason this check is not simply "reject the mismatch". The City writes
  "9201 North Lake Creek Blvd" and the Census answers "N LAKE CREEK PKWY";
  OpenStreetMap has no Lake Creek Blvd in Austin at all. There is one street
  there under one name, and the Census normalised an outdated label
  correctly. Rejecting that would refuse a venue over a naming quibble.

  So the rule is: a differing street type is not a refusal, it is a reason
  to STOP TRUSTING THE FIRST RESOLVER SILENTLY. Ask OpenStreetMap for the
  address exactly as the operator wrote it. If OSM finds it at house-number
  level, the operator's own street type wins and that result is used. If OSM
  has no record of the address as written, the Census answer stands and the
  normalisation is recorded in the basis rather than hidden.
*/
const STREET_TYPES = Object.freeze({
  STREET: 'ST', ST: 'ST', TERRACE: 'TER', TER: 'TER', LANE: 'LN', LN: 'LN',
  COURT: 'CT', CT: 'CT', PARKWAY: 'PKWY', PKWY: 'PKWY', BOULEVARD: 'BLVD', BLVD: 'BLVD',
  DRIVE: 'DR', DR: 'DR', AVENUE: 'AVE', AVE: 'AVE', ROAD: 'RD', RD: 'RD',
  PLACE: 'PL', PL: 'PL', WAY: 'WAY', CIRCLE: 'CIR', CIR: 'CIR', TRAIL: 'TRL', TRL: 'TRL',
})

/** The last recognised street-type token in a string, canonicalised. */
const streetType = s => {
  const words = String(s ?? '').toUpperCase().replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean)
  for (let i = words.length - 1; i >= 0; i--) {
    if (STREET_TYPES[words[i]]) return STREET_TYPES[words[i]]
  }
  return null
}

const result = {}
for (const [slug, street] of Object.entries(addresses)) {
  let rec = await geocode(street)

  if (rec.matched) {
    const asked = streetType(street)
    const got = streetType(String(rec.matched).split(',')[0])
    if (asked && got && asked !== got) {
      const osm = await geocodeOSM(street)
      if (osm) {
        /* The operator's own street type exists. It wins. */
        rec = {
          ...osm,
          basis:
            `OpenStreetMap (Nominatim) matched "${osm.matched}" at house-number level. ` +
            `The Census address geocoder answered "${rec.matched}", changing the street type from ` +
            `${asked} to ${got}; OpenStreetMap finds the address as the operator writes it, so that is ` +
            'the one published. A street type is part of an address, not a formatting detail.',
        }
      } else {
        rec = {
          ...rec,
          basis:
            `${rec.basis} The operator writes the street type as ${asked} and the Census normalised it ` +
            `to ${got}; OpenStreetMap has no record of the address as written, so there is one street ` +
            'here under one name and the Census answer stands.',
        }
      }
    }
  }

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
