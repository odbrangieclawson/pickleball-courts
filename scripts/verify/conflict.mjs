/*
  Phase 1B deliverable 4: the conflict protocol.

  THE RULE, as specified:
    When an imported row and a municipal source disagree on court count,
    surface, fees or lights:
      - the municipal source wins
      - the old value is retained in a change log with BOTH sources
      - the venue is flagged for one re-check next cadence

  HOW PRECEDENCE ACTUALLY WORKS HERE

  "Municipal source wins" generalises to: the lower source tier wins, since
  the ladder is ordered by trust. Tier 1 beats tier 3 beats tier 5. Two
  facts at the SAME tier do not silently fight - the newer date_checked
  wins, and if the dates are equal too, the conflict is left UNRESOLVED and
  escalated to a human. Coin-flipping between two equally good sources is
  how a directory ends up with two pages disagreeing at 45 vs 46 venues.

  A SUBTLETY THE BRIEF DOES NOT COVER, resolved conservatively

  The imported rows have NO tier at all: their only source is a competitor
  directory, which is not a source. So an imported value never "wins" a
  conflict, but it is also not evidence of anything. It is recorded in the
  change log as the previous value and nothing more. An imported value that
  AGREES with a municipal source is not thereby corroborated either - one
  unsourced claim plus one sourced claim is still exactly one source.

  WHAT COUNTS AS A CONFLICT

  Only a genuine disagreement on a value both sides state. If the old value
  was null, that is not a conflict, it is new information. If the new value
  is null, the source was silent and no Fact was minted, so nothing reaches
  here.
*/

import {isFact} from './provenance.mjs'

/** The four fields the brief names, plus the ones that share their risk. */
export const CONFLICT_FIELDS = Object.freeze([
  'total_courts', 'indoor_courts', 'outdoor_courts', // court count
  'surface',
  'fee_type', 'membership_from_usd', 'drop_in_fee_usd', 'access_type', // fees
  'light', // lights
])

export const RECHECK_REASON = 'conflict_with_prior_value'

/** Values are compared after light normalisation, so "Asphalt" != "asphalt" is not a conflict. */
const norm = v => (typeof v === 'string' ? v.trim().toLowerCase() : v)

const sameValue = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => norm(x) === norm(b[i]))
  }
  return norm(a) === norm(b)
}

/**
 * Resolve one incoming Fact against the value a venue currently holds.
 *
 * @param {object} current   the venue record as it stands
 * @param {object} fact      an incoming Fact
 * @param {object} [prior]   provenance of the current value, if it has any:
 *                           {source_tier, date_checked, source_url}
 * @returns {{outcome, field, winner, entry, needs_recheck}}
 */
export function resolveFact(current, fact, prior = null) {
  if (!isFact(fact)) throw new Error('resolveFact needs a Fact from SourceDocument.fact()')
  const field = fact.field
  const oldValue = current?.[field] ?? null

  const base = {
    field,
    old_value: oldValue,
    new_value: fact.value,
    new_source: {url: fact.source_url, tier: fact.source_tier, date_checked: fact.date_checked, verified_by: fact.verified_by},
    old_source: prior
      ? {url: prior.source_url ?? null, tier: prior.source_tier ?? null, date_checked: prior.date_checked ?? null}
      : {url: current?.source_url ?? null, tier: null, date_checked: current?.date_checked ?? null, note: 'imported row - no qualifying source'},
    at: fact.date_checked,
  }

  // Nothing there before: new information, not a conflict.
  if (oldValue === null || oldValue === undefined) {
    return {outcome: 'filled', field, winner: 'new', entry: {...base, outcome: 'filled'}, needs_recheck: false}
  }

  // Agreement. Note this does NOT strengthen anything - see the header.
  if (sameValue(oldValue, fact.value)) {
    return {outcome: 'agreed', field, winner: 'new', entry: {...base, outcome: 'agreed'}, needs_recheck: false}
  }

  // A real disagreement.
  const oldTier = prior?.source_tier ?? null
  const isConflictField = CONFLICT_FIELDS.includes(field)

  // Unsourced prior value: the sourced one wins outright.
  if (oldTier === null) {
    return {
      outcome: 'overridden',
      field,
      winner: 'new',
      entry: {...base, outcome: 'overridden', rationale: 'previous value had no qualifying source'},
      needs_recheck: isConflictField,
    }
  }

  // Both sourced: lower tier wins.
  if (fact.source_tier < oldTier) {
    return {
      outcome: 'overridden',
      field,
      winner: 'new',
      entry: {...base, outcome: 'overridden', rationale: `tier ${fact.source_tier} beats tier ${oldTier}`},
      needs_recheck: isConflictField,
    }
  }
  if (fact.source_tier > oldTier) {
    return {
      outcome: 'rejected',
      field,
      winner: 'old',
      entry: {...base, outcome: 'rejected', rationale: `tier ${fact.source_tier} does not beat tier ${oldTier}`},
      needs_recheck: isConflictField,
    }
  }

  // Same tier: newer reading wins.
  const oldDate = prior?.date_checked ?? null
  if (oldDate && fact.date_checked > oldDate) {
    return {
      outcome: 'overridden',
      field,
      winner: 'new',
      entry: {...base, outcome: 'overridden', rationale: `same tier ${fact.source_tier}, newer reading (${fact.date_checked} > ${oldDate})`},
      needs_recheck: isConflictField,
    }
  }
  if (oldDate && fact.date_checked < oldDate) {
    return {
      outcome: 'rejected',
      field,
      winner: 'old',
      entry: {...base, outcome: 'rejected', rationale: `same tier ${fact.source_tier}, older reading`},
      needs_recheck: isConflictField,
    }
  }

  // Same tier, same date, different value. Do not guess.
  return {
    outcome: 'unresolved',
    field,
    winner: null,
    entry: {...base, outcome: 'unresolved', rationale: `two tier-${fact.source_tier} sources read on ${fact.date_checked} disagree - escalated, not guessed`},
    needs_recheck: true,
  }
}

/**
 * Apply a batch of Facts to a venue.
 * Returns the updated record, the change-log entries, and the re-check flag.
 */
export function applyFacts(venue, facts, priorProvenance = {}) {
  const next = {...venue}
  const provenance = {...priorProvenance}
  const log = []
  const recheckFields = new Set()
  let unresolved = 0

  for (const fact of facts) {
    const r = resolveFact(next, fact, priorProvenance[fact.field] ?? null)
    log.push(r.entry)
    if (r.needs_recheck) recheckFields.add(r.field)
    if (r.outcome === 'unresolved') { unresolved++; continue }
    if (r.winner === 'new') {
      next[fact.field] = fact.value
      provenance[fact.field] = {
        source_url: fact.source_url,
        date_checked: fact.date_checked,
        verified_by: fact.verified_by,
        source_tier: fact.source_tier,
        evidence: fact.evidence,
      }
    }
  }

  /*
    Record-level provenance is the WEAKEST of the field-level ones: the
    oldest date_checked and the highest (worst) tier. A record is only as
    fresh as its stalest verified fact, and claiming otherwise would let one
    recent check make an old record look current.
  */
  const provs = Object.values(provenance)
  if (provs.length) {
    next.date_checked = provs.map(p => p.date_checked).filter(Boolean).sort()[0] ?? null
    const worstTier = Math.max(...provs.map(p => p.source_tier ?? 6))
    const best = provs.find(p => p.source_tier === Math.min(...provs.map(x => x.source_tier ?? 6)))
    next.source_url = best?.source_url ?? null
    next.verified_by = best?.verified_by ?? null
    next.source_tier_worst = worstTier
  }

  return {
    venue: next,
    provenance,
    changelog: log,
    needs_recheck: recheckFields.size > 0,
    recheck: recheckFields.size
      ? {reason: RECHECK_REASON, fields: [...recheckFields], scheduled: 'next_cadence', times: 1}
      : null,
    unresolved,
  }
}

/** One line per change, append-only. Both sources are always present. */
export function changelogToRows(venueSlug, entries) {
  return entries.map(e => ({
    venue_slug: venueSlug,
    at: e.at,
    field: e.field,
    outcome: e.outcome,
    old_value: e.old_value,
    old_source_url: e.old_source?.url ?? null,
    old_source_tier: e.old_source?.tier ?? null,
    old_date_checked: e.old_source?.date_checked ?? null,
    new_value: e.new_value,
    new_source_url: e.new_source.url,
    new_source_tier: e.new_source.tier,
    new_date_checked: e.new_source.date_checked,
    rationale: e.rationale ?? null,
  }))
}
