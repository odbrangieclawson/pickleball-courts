/*
  Phase 1B deliverable 3, the core of it.

  THE GUARANTEE: a fact cannot exist without its source.

  The brief asks that provenance be "captured at the same moment as the fact
  and can never be backfilled from memory". That is a design problem, not a
  discipline problem. Discipline fails at 3pm on a Friday. So the API is
  built so that the unprovenanced path DOES NOT EXIST:

    - There is no exported way to construct a Fact directly.
    - The only way to get one is SourceDocument.fact(), which stamps
      source_url and date_checked from the document itself.
    - A SourceDocument cannot be constructed without a url and a
      retrieved_at date.
    - Fact objects are frozen, so the stamps cannot be edited afterwards.

  You physically cannot produce a fact, forget where it came from, and fill
  that in later. There is no setter to fill in.

  WHAT date_checked MEANS HERE
  The date the source was actually read. For an automated fetch that is the
  fetch timestamp. It is never "today" computed at write time, because that
  would silently refresh a stale reading every time the pipeline re-ran -
  which is exactly the backfilling-from-memory failure the rule forbids.
*/

/** Import Gate I2's permitted values. Nothing else is accepted. */
export const VERIFIED_BY = Object.freeze([
  'municipal_source',
  'owner_submission',
  'staff_check',
  'user_report',
])

/*
  Which verified_by a source tier earns. This is a property of WHERE the
  fact came from, never of who typed it in.

  Tiers 1-2 are government publications, so municipal_source.
  Tiers 3-5 are non-government pages that our staff read, so staff_check.
  owner_submission is reserved for a claim form the owner filled in, and
  user_report for a visitor correction. Neither can be produced by reading
  a web page, so neither is reachable from this module.
*/
export const TIER_VERIFIED_BY = Object.freeze({
  1: 'municipal_source',
  2: 'municipal_source',
  3: 'staff_check',
  4: 'staff_check',
  5: 'staff_check',
  6: 'staff_check',
})

const FACT = Symbol('fact')

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * A retrieved source document. Everything extracted from it inherits its
 * url and retrieval date.
 */
export class SourceDocument {
  /**
   * @param {object} o
   * @param {string} o.url            the exact URL read
   * @param {string} o.retrieved_at   ISO date the source was READ
   * @param {number} o.tier           1-6, from the source ladder
   * @param {string} [o.publisher]    e.g. "City of Seattle Parks and Recreation"
   * @param {string} [o.format]       html_table | socrata | arcgis | ckan | csv | pdf_text
   * @param {boolean} [o.paid]        true if the source cost money to access
   */
  constructor({url, retrieved_at, tier, publisher = null, format = null, paid = false}) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      throw new Error(`SourceDocument needs a real http(s) url, got: ${JSON.stringify(url)}`)
    }
    if (typeof retrieved_at !== 'string' || !ISO_DATE.test(retrieved_at)) {
      throw new Error(`SourceDocument needs retrieved_at as an ISO date (YYYY-MM-DD), got: ${JSON.stringify(retrieved_at)}`)
    }
    if (!TIER_VERIFIED_BY[tier]) {
      throw new Error(`SourceDocument needs a tier 1-6, got: ${JSON.stringify(tier)}`)
    }
    this.url = url
    this.retrieved_at = retrieved_at
    this.tier = tier
    this.publisher = publisher
    this.format = format
    this.paid = !!paid
    this.verified_by = TIER_VERIFIED_BY[tier]
    Object.freeze(this)
  }

  /**
   * Mint a fact from this document. The ONLY way to make one.
   *
   * @param {string} field   a v4 venue field name
   * @param {*} value        the value read from the source. null is legal and
   *                         means "this source was read and did not state it".
   * @param {object} [o]
   * @param {string} [o.evidence]  the quoted text or cell the value came from
   */
  fact(field, value, {evidence = null} = {}) {
    if (typeof field !== 'string' || !field) throw new Error('fact() needs a field name')
    return Object.freeze({
      [FACT]: true,
      field,
      value,
      evidence,
      // Provenance, stamped here and immutable from here on.
      source_url: this.url,
      date_checked: this.retrieved_at,
      verified_by: this.verified_by,
      source_tier: this.tier,
      publisher: this.publisher,
      paid_source: this.paid,
    })
  }
}

export const isFact = x => !!(x && x[FACT] === true)

/**
 * Assemble facts into a venue patch.
 * Throws if handed anything that is not a Fact - the second place the
 * unprovenanced path is closed off.
 */
export function factsToPatch(facts) {
  const patch = {}
  const provenance = {}
  for (const f of facts) {
    if (!isFact(f)) {
      throw new Error(`factsToPatch received a non-Fact. Every value must come from SourceDocument.fact(). Got: ${JSON.stringify(f)}`)
    }
    patch[f.field] = f.value
    provenance[f.field] = {
      source_url: f.source_url,
      date_checked: f.date_checked,
      verified_by: f.verified_by,
      source_tier: f.source_tier,
      evidence: f.evidence,
    }
  }
  return {patch, provenance}
}

/*
  Import Gate I2, applied to a candidate record.

  Deliberately does NOT check reachability - that needs a network call and
  belongs in the fetch step, where a dead link should stop the extraction
  rather than be discovered later. This checks shape and cadence only.
*/
export function passesI2(record, {today = new Date().toISOString().slice(0, 10), cadenceDays = null} = {}) {
  const problems = []
  if (!record.source_url) problems.push('no source_url')
  else if (!/^https?:\/\//i.test(record.source_url)) problems.push('source_url is not an http(s) URL')
  else if (/courtsource\.us/i.test(record.source_url)) {
    problems.push('source_url points to CourtSource, a competitor directory, which is not a source')
  }
  if (!record.date_checked) problems.push('no date_checked')
  else if (!ISO_DATE.test(record.date_checked)) problems.push('date_checked is not an ISO date')
  else if (record.date_checked > today) problems.push('date_checked is in the future')
  else if (cadenceDays !== null) {
    const age = (Date.parse(today) - Date.parse(record.date_checked)) / 86400000
    if (age > cadenceDays) problems.push(`date_checked is ${Math.round(age)} days old, outside the ${cadenceDays}-day cadence`)
  }
  if (!record.verified_by) problems.push('no verified_by')
  else if (!VERIFIED_BY.includes(record.verified_by)) problems.push(`verified_by "${record.verified_by}" is not one of ${VERIFIED_BY.join(', ')}`)
  return {pass: problems.length === 0, problems}
}
