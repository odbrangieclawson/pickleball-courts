/*
  promoteToVerified() - the join between Phase 1B and Phase 2.

  Carries DECISION D7 - CLAIMED IS NOT VERIFIED (decisions.md §8). This
  function is the only path from pending to published, and it never reads
  claimed_by_owner. A claim is an identity event and cannot open this door.

  WHY THIS EXISTS

  It was missing, and the seam test found it. Phase 1B's applyFacts() sets
  source_url, date_checked and verified_by from a real source. Phase 2's
  isVerified() requires all of those AND status === 'verified'. Nothing
  moved status. So a row could be fully sourced from a municipal PDF and
  still be invisible to every count, because the two phases agreed on every
  field except the one that decides whether a page exists.

  THE RULE THIS ENCODES

  Rule 12: every imported row is status=pending until it has a verified
  address, a verified court count, a source_url and a date_checked.

  status is therefore never set by hand and never set by optimism. It is a
  CONCLUSION drawn from the gates, computed here, in one place. There is no
  other writer of status in the codebase.

  ALL OR NOTHING

  A venue is promoted only if every check passes. There is no partial
  promotion, because a half-verified venue counts as a whole one in
  getCounts() and would put a wrong number in a title.
*/

import {isVerified} from './schema.mjs'

const NUMERIC_SUFFIX = /-\d+$/

/**
 * Decide whether a venue may become verified, and return the promoted copy
 * if so.
 *
 * @returns {{promoted: boolean, venue: object, reasons: string[]}}
 *          reasons is empty on success and lists every failure otherwise -
 *          all of them, not the first, so one pass fixes everything.
 */
export function promoteToVerified(venue, {today = new Date().toISOString().slice(0, 10)} = {}) {
  const reasons = []

  /* I1 Identity */
  if (!venue.slug) reasons.push('I1: no slug')
  else if (NUMERIC_SUFFIX.test(venue.slug)) {
    reasons.push(`I1: slug "${venue.slug}" ends in a numeric suffix (Rule 10)`)
  }
  /*
    Identity held open by the audit: two rows claiming one URL inside one
    city, or a state that contradicts its own coordinates. Refused here
    rather than filtered upstream, because this is the one place every
    publishable venue must pass and a filter is something a caller forgets.
    See scripts/identity/audit.mjs and decisions.md §3 — a wrong slug or a
    wrong city becomes a permanent URL at launch.
  */
  if (venue.identity_quarantine) {
    reasons.push(`I1: identity unresolved (${venue.identity_quarantine.reason}) — ${venue.identity_quarantine.detail}`)
  }
  if (!venue.name) reasons.push('I1: no name')
  if (!venue.city) reasons.push('I1: no city')
  if (!venue.state) reasons.push('I1: no state')
  if (!venue.street_address) reasons.push('I1: no verified street_address')

  /* I2 Provenance */
  if (!venue.source_url) reasons.push('I2: no source_url')
  else if (/courtsource\.us/i.test(venue.source_url)) {
    reasons.push('I2: source_url points to a competitor directory, which is not a source')
  }
  if (!venue.date_checked) reasons.push('I2: no date_checked')
  else if (venue.date_checked > today) reasons.push('I2: date_checked is in the future')
  if (!venue.verified_by) reasons.push('I2: no verified_by')

  /* I3 Consistency */
  if (venue.total_courts === null || venue.total_courts === undefined) {
    reasons.push('I3: no verified court count')
  }
  if (venue.total_courts !== null && venue.indoor_courts !== null && venue.outdoor_courts !== null
      && venue.total_courts !== venue.indoor_courts + venue.outdoor_courts) {
    reasons.push(`I3: total_courts ${venue.total_courts} != indoor ${venue.indoor_courts} + outdoor ${venue.outdoor_courts} (Rule 13)`)
  }
  if (!venue.county) reasons.push('I3: no derived county')

  /* I4 Vocabulary - a filtered field holding free text cannot be published. */
  const SETS = {
    fee_type: ['free', 'donation', 'permit_required', 'drop_in_fee', 'reservation_fee', 'membership_required'],
    surface: ['asphalt', 'concrete', 'acrylic', 'cushioned_acrylic', 'modular_tile', 'wood', 'synthetic_indoor', 'clay', 'grass'],
    venue_type: ['public_park', 'community_center', 'dedicated_pickleball_facility', 'racquet_club', 'fitness_center', 'school', 'nonprofit_recreation', 'faith_facility', 'residential_community', 'resort_hotel', 'entertainment_venue'],
  }
  for (const [f, allowed] of Object.entries(SETS)) {
    if (venue[f] !== null && venue[f] !== undefined && !allowed.includes(venue[f])) {
      reasons.push(`I4: ${f} "${venue[f]}" is not in the controlled set`)
    }
  }

  /*
    Rule 11, stated explicitly even though it is a no-op: a claim is not
    consulted anywhere above. It cannot help and it cannot hurt. This
    comment exists so nobody later "improves" promotion by taking owner
    claims into account.
  */

  if (reasons.length) return {promoted: false, venue, reasons}

  const promoted = {...venue, status: 'verified'}

  // Belt and braces: Phase 2 must independently agree.
  if (!isVerified(promoted)) {
    return {
      promoted: false,
      venue,
      reasons: ['internal: promotion passed the gates but isVerified() disagreed - the two definitions have drifted'],
    }
  }
  return {promoted: true, venue: promoted, reasons: []}
}

/** Promote a population, returning the promoted rows and a rejection tally. */
export function promoteAll(venues, opts) {
  const out = []
  const rejected = new Map()
  for (const v of venues) {
    const r = promoteToVerified(v, opts)
    if (r.promoted) out.push(r.venue)
    else for (const reason of r.reasons) {
      const key = reason.replace(/"[^"]*"/g, '"…"').replace(/\d+/g, 'N')
      rejected.set(key, (rejected.get(key) ?? 0) + 1)
    }
  }
  return {promoted: out, rejected: [...rejected.entries()].sort((a, b) => b[1] - a[1])}
}
