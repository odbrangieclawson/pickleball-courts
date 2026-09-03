/*
  The provenance audit (Phase 6 deliverable 7).

  Every published FACT — not every venue, every fact — with the source it
  came from, the date it was checked, who verified it, and how stale it is.
  This is the monthly freshness sweep tool.

  WHY PER-FACT AND NOT PER-VENUE

  applyFacts already computes record-level provenance as the WEAKEST of the
  field-level ones: a record is only as fresh as its stalest verified fact.
  That is the right thing to show a reader, and the wrong thing to work
  from. A venue whose court count was checked yesterday and whose address
  came from a file last touched two years ago has one date at record level
  and two very different problems underneath it. The sweep needs the
  underneath.

  STALENESS BANDS ARE A PLACEHOLDER, AND SAY SO

  decisions.md O3 is open: nobody has decided how long a date_checked stays
  good, and it plainly differs by field — an address changes rarely, hours
  and fees change often. The bands below are a working default so the tool
  is usable now, and every consumer of them is told they are provisional.
  Import Gate I2 checks that date_checked EXISTS and is not in the future;
  it does not yet check it is inside a cadence, because there is no cadence.
*/

import * as data from './data.mjs'

/* Provisional until O3 is decided. Days. */
export const CADENCE = Object.freeze({
  /* Structural: changes when the venue is rebuilt. */
  street_address: 730,
  county: 730,
  name: 730,
  /* Physical: changes when the city resurfaces or converts. */
  total_courts: 365,
  indoor_courts: 365,
  outdoor_courts: 365,
  surface: 365,
  light: 365,
  nets_provided: 180,
  covered: 365,
  climate_control: 365,
  venue_type: 365,
  restroom: 365,
  parking: 365,
  /* Volatile: changes on a whim. */
  fee_type: 90,
  membership_from_usd: 90,
  pricing_notes: 90,
  hours_of_operation: 90,
  court_availability: 90,
  phone: 365,
  website: 365,
  _default: 365,
})

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

export function band(field, checked, today) {
  if (!checked) return 'never'
  const age = daysBetween(checked, today)
  const limit = CADENCE[field] ?? CADENCE._default
  if (age > limit) return 'stale'
  if (age > limit * 0.75) return 'due'
  return 'fresh'
}

/**
 * Every published fact, flattened.
 * @param {string} today ISO date
 */
export function provenanceRows(today = new Date().toISOString().slice(0, 10)) {
  const rows = []
  for (const c of data.publishedCities()) {
    const city = data.city(c.state, c.slug)
    for (const v of city.venues) {
      const prov = v.field_provenance ?? {}
      for (const [field, p] of Object.entries(prov)) {
        rows.push({
          venue: v.name,
          slug: v.slug,
          city: v.city,
          state: v.state,
          field,
          value: v[field] === null || v[field] === undefined ? null : String(v[field]),
          source_url: p.source_url ?? null,
          date_checked: p.date_checked ?? null,
          verified_by: p.verified_by ?? null,
          source_tier: p.source_tier ?? null,
          evidence: p.evidence ?? null,
          age_days: p.date_checked ? daysBetween(p.date_checked, today) : null,
          cadence_days: CADENCE[field] ?? CADENCE._default,
          staleness: band(field, p.date_checked, today),
        })
      }
    }
  }
  return rows.sort((a, b) =>
    (b.age_days ?? 1e9) - (a.age_days ?? 1e9) || a.venue.localeCompare(b.venue) || a.field.localeCompare(b.field))
}

export function provenanceSummary(today = new Date().toISOString().slice(0, 10)) {
  const rows = provenanceRows(today)
  const byBand = {fresh: 0, due: 0, stale: 0, never: 0}
  const bySource = new Map()
  const byVerifier = new Map()
  for (const r of rows) {
    byBand[r.staleness]++
    bySource.set(r.source_url, (bySource.get(r.source_url) ?? 0) + 1)
    byVerifier.set(r.verified_by, (byVerifier.get(r.verified_by) ?? 0) + 1)
  }
  return {
    total: rows.length,
    venues: new Set(rows.map(r => r.slug)).size,
    byBand,
    sources: [...bySource.entries()].map(([url, n]) => ({url, facts: n})).sort((a, b) => b.facts - a.facts),
    verifiers: [...byVerifier.entries()].map(([by, n]) => ({by, facts: n})).sort((a, b) => b.facts - a.facts),
    oldest: rows[0] ?? null,
    newest: rows[rows.length - 1] ?? null,
  }
}
