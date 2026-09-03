/*
  The verified-facts overlay.

  THE SEAM THIS CLOSES

  Phase 1B could mint provenanced facts and Phase 2 could promote a venue
  that had them, but nothing persisted facts between the two. Every run
  rebuilt the venue list from data.csv, so a verification could not survive
  to the next build and Gate 1 was permanently stuck at zero.

  This module is that persistence. Files under data/verified/ hold, per
  venue slug, the field values a real source stated plus the provenance of
  each one. applyVerifiedOverlay() lays them over the imported rows.

  WHY AN OVERLAY AND NOT AN EDIT TO data.csv

  The imported CSV is evidence of what arrived, and it stays untouched. Any
  disagreement between it and a source is then a diff between two files that
  both still exist, rather than a change with nothing left to compare
  against. It also means re-running the import can never silently undo
  verification work.

  WHAT IT REFUSES TO DO

  It writes a field ONLY if that field has provenance in the overlay. A
  patch entry with no matching provenance entry is dropped and reported,
  because a value without a source is exactly what Rule 7 and Import Gate I2
  exist to keep off the site. The overlay cannot be used as a back door for
  hand-edited numbers.

  ============================================================
  VERIFYING A VENUE CLEARS ITS UNSOURCED FIELDS
  ============================================================

  This is the part that is easy to get wrong, and the first version of this
  module got it wrong.

  Laying sourced facts over an imported row leaves every OTHER imported
  field sitting there untouched. The venue then passes Gate 6, renders with
  a "verified from municipal source" badge, and carries unsourced values
  underneath it. The first render did exactly that: it stated "Cost: free"
  and "Surface: concrete" on venues whose only real source was a court-count
  dataset that says nothing about either. A reader has no way to tell the
  two kinds of fact apart, so the badge silently vouches for both.

  So: on a venue the overlay touches, every field in PUBLISHED_FACT_FIELDS
  without provenance is set to null. Null is honest - Decision D6 renders it
  as "Not verified yet" with a help-us-verify link. The imported value is
  not lost; data.csv still holds it, and it comes back the moment a source
  states it.

  ============================================================
  A SLUG IS ONLY UNIQUE INSIDE ONE CITY
  ============================================================

  The overlay was keyed by slug alone, and that is wrong in a national
  directory. "magnolia-park" is a real park in Sacramento CA, in Garden
  Grove CA and in Hillsboro OR. Keyed by slug, Sacramento's verification -
  its address, its derived court count, its municipal badge - was laid over
  all three, and two cities that nobody has ever checked started rendering
  as verified with another city's address under a source that does not
  mention them. Precisely the failure this whole module exists to prevent,
  arriving through the lookup rather than through the data.

  Seattle never exposed it because its park names are distinctive. It
  surfaced the moment a second city arrived carrying ordinary names, which
  is the point at which every national directory has to solve this.

  So the key is state + city + slug throughout. A venue is matched to an
  overlay entry only when it is in the same city as that entry, and the
  duplicate check on load is per-city too, so two cities may each verify
  their own Magnolia Park.

  Identity and location fields are kept: slug, name, city, state,
  postal_code, county, latitude, longitude. They are what makes the row
  findable and joinable, they are not claims the page makes about the
  facility, and clearing them would delete the venue rather than de-verify
  a fact about it.
*/

import {readFileSync, readdirSync, existsSync} from 'node:fs'
import {join} from 'node:path'

/**
 * The identity of a venue record, city-scoped. See the header: a bare slug
 * is not unique across the country and must never be used as a key here.
 */
export const overlayKey = (state, city, slug) =>
  `${String(state ?? '').trim().toUpperCase()}|${String(city ?? '').trim().toLowerCase()}|${slug}`

/**
 * Read every overlay file under data/verified/.
 * Keys are state|city|slug — a slug alone is not unique nationally.
 * @returns {{byKey: Map<string, object>, files: string[], sources: object[]}}
 */
export function loadVerifiedOverlay(repoRoot) {
  const dir = join(repoRoot, 'data', 'verified')
  const byKey = new Map()
  const files = []
  const sources = []
  if (!existsSync(dir)) return {byKey, files, sources}

  for (const f of readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
    const doc = JSON.parse(readFileSync(join(dir, f), 'utf8'))
    files.push(f)
    for (const s of doc.sources ?? []) sources.push({...s, file: f})
    for (const [slug, entry] of Object.entries(doc.venues ?? {})) {
      /*
        City and state come from the entry's own identity block, falling
        back to the file header. An entry with neither cannot be placed on
        the map and is a broken record, not a defaultable one.
      */
      const state = entry.identity?.state ?? doc.state
      const city = entry.identity?.city ?? doc.city
      if (!state || !city) {
        throw new Error(`Overlay entry ${slug} in ${f} has no city/state. A verified venue must say where it is.`)
      }
      const key = overlayKey(state, city, slug)
      if (byKey.has(key)) {
        throw new Error(`Venue ${slug} in ${city}, ${state} is verified in two overlay files. One venue, one record.`)
      }
      byKey.set(key, {...entry, file: f, overlay_slug: slug, overlay_city: city, overlay_state: state})
    }
  }
  return {byKey, files, sources}
}

/**
 * Every field that renders as a claim about the facility. A verified venue
 * publishes one of these only when a source stated it.
 */
export const PUBLISHED_FACT_FIELDS = Object.freeze([
  'total_courts', 'indoor_courts', 'outdoor_courts',
  'surface',
  'fee_type', 'access_type', 'play_format',
  'membership_from_usd', 'drop_in_fee_usd', 'pricing_notes', 'pricing_details',
  'light', 'restroom', 'pro_shop', 'climate_control', 'covered', 'nets_provided',
  'amenities', 'hours_of_operation', 'parking', 'level_of_play',
  'court_availability', 'venue_type',
  'phone', 'website',
])

/**
 * Lay verified facts over the imported rows, in place on a copy.
 *
 * @param {object[]} venues  mapped venue records
 * @param {Map} byKey        from loadVerifiedOverlay, keyed state|city|slug
 * @returns {{venues, applied, fieldsWritten, fieldsCleared, skipped, cleared}}
 */
export function applyVerifiedOverlay(venues, byKey) {
  const skipped = []
  const cleared = []
  let applied = 0
  let fieldsWritten = 0

  const out = venues.map(v => {
    /*
      Match on the IMPORTED slug.

      The identity pass runs before this one and may have given the row a
      canonical slug — often built from the very name a source supplied here.
      Overlay files are keyed by the slug as it arrived in data.csv, which is
      the only identifier that does not move, so that is what is looked up.
      Matching on v.slug instead silently loses every renamed venue: it took
      Seattle from 24 verified to 4 before this was fixed.

      Both lookups are scoped to the venue's own city. The canonical-slug
      fallback is the one that leaked: an unverified Magnolia Park in Garden
      Grove canonicalises to the same slug Sacramento's overlay is keyed by,
      and without the city in the key it collected Sacramento's facts.
    */
    const entry =
      byKey.get(overlayKey(v.state, v.city, v.imported_slug ?? v.slug)) ??
      byKey.get(overlayKey(v.state, v.city, v.slug))
    if (!entry) return v

    const next = {...v}
    const prov = entry.provenance ?? {}

    for (const [field, value] of Object.entries(entry.patch ?? {})) {
      if (!prov[field]?.source_url || !prov[field]?.date_checked) {
        skipped.push({slug: v.slug, field, why: 'no provenance for this field in the overlay'})
        continue
      }
      next[field] = value
      fieldsWritten++
    }

    /*
      De-verify everything the sources did not speak to. See the header:
      a verified badge must not vouch for an imported value.
    */
    for (const field of PUBLISHED_FACT_FIELDS) {
      if (prov[field]) continue
      if (next[field] === null || next[field] === undefined) continue
      cleared.push({slug: v.slug, field, was: next[field]})
      next[field] = null
    }

    /*
      Record-level provenance, as applyFacts computed it: the record is only
      as fresh as its stalest verified fact.
    */
    next.source_url = entry.record?.source_url ?? null
    next.date_checked = entry.record?.date_checked ?? null
    next.verified_by = entry.record?.verified_by ?? null
    next.field_provenance = prov
    applied++
    return next
  })

  /*
    Venues the import never held.

    A source can describe a venue that is simply absent from data.csv - four
    of Seattle's are. Those entries carry minted:true and an identity block,
    and they are appended here rather than patched, because there is nothing
    to patch. Every fact on them still arrives through the same provenance
    path; the identity block only supplies slug, name and location.
  */
  /* Minted venues are keyed by the slug the overlay declares; a renamed
     row is already present under its canonical slug, so both are checked.
     City-scoped, for the reason in the header. */
  const seen = new Set(out.flatMap(v => [
    overlayKey(v.state, v.city, v.slug),
    v.imported_slug ? overlayKey(v.state, v.city, v.imported_slug) : null,
  ].filter(Boolean)))
  let minted = 0
  for (const [key, entry] of byKey) {
    const slug = entry.overlay_slug
    /*
      Any verified venue with no imported row to lay facts over is built
      from the overlay alone. That used to mean only the four Seattle
      venues the import never had; it now means ALL of them whenever
      data.csv is absent, which is what lets the site build in CI without
      shipping 7.8 MB of unsourced records.
    */
    if (seen.has(key) || !entry.identity) continue
    const prov = entry.provenance ?? {}
    const v = {
      /* The CANONICAL slug, not the overlay key. The overlay is keyed by
         the slug as it arrived in data.csv; the site publishes the
         canonical one, and using the key here would fork the URLs between
         a build that has the CSV and a build that does not. */
      slug: entry.identity.canonical_slug ?? slug,
      ...entry.identity,
      status: 'pending',
      claimed_by_owner: false, claim_date: null,
      rating: null, user_rating: null, review_count: null,
      /*
        From identity when the overlay recorded one. This line used to be a
        bare `postal_code: null` sitting AFTER the identity spread, which
        silently threw away every postal code a verification had found.
        Seattle never noticed because its minted venues had none.
      */
      postal_code: entry.identity.postal_code ?? null,
    }
    for (const f of PUBLISHED_FACT_FIELDS) v[f] = null
    for (const [field, value] of Object.entries(entry.patch ?? {})) {
      if (!prov[field]?.source_url || !prov[field]?.date_checked) {
        skipped.push({slug, field, why: 'no provenance for this field in the overlay'})
        continue
      }
      v[field] = value
      fieldsWritten++
    }
    delete v.canonical_slug
    v.source_url = entry.record?.source_url ?? null
    v.date_checked = entry.record?.date_checked ?? null
    v.verified_by = entry.record?.verified_by ?? null
    v.field_provenance = prov
    out.push(v)
    minted++
    applied++
  }

  return {venues: out, applied, minted, fieldsWritten, fieldsCleared: cleared.length, skipped, cleared}
}
