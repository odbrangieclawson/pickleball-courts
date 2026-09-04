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
    postal_code: zip,
    basis: `Census address geocoder matched "${m.matchedAddress}".`,
  }
}

const result = {}
for (const [slug, street] of Object.entries(addresses)) {
  const rec = await geocode(street)
  result[slug] = rec
  const where = rec.matched
    ? `${rec.county} County · ${rec.place} · ${rec.postal_code}`
    : 'NO MATCH'
  console.log(`  ${slug.padEnd(36)} ${where}`)
}

writeFileSync(join(REPO_ROOT, out), JSON.stringify(result, null, 2) + '\n')
const misses = Object.values(result).filter(r => !r.matched).length
console.log(`\nWrote ${out} — ${Object.keys(result).length} addresses, ${misses} unmatched\n`)
