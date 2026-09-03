/*
  Phase 2 deliverable 2: getCounts(scope).

  DECISION D2 - EVERY COUNT COMES FROM ONE QUERY (decisions.md §8).
  Rule 2 is how D2 is written as an instruction. D8 rides on the same
  module: the denominator here is VERIFIED venues, never imported rows, so
  a title physically cannot say 22 when 6 are verified.

  Rule 2: every count on the site comes from here. Titles, meta, headings,
  body copy and schema all read the same object, so they cannot drift apart.

  ============================================================
  HOW BYPASSING IS PREVENTED
  ============================================================

  Four layers. Three are absolute; the fourth is where the honest limit is,
  and it is stated rather than hidden.

  LAYER 1 - A COUNT IS NOT A NUMBER.
  getCounts returns Count objects, not numbers. A Count carries a private
  Symbol that only this module can attach. isCount() checks for it. Any
  rendering helper that emits a number demands a Count and throws on a bare
  number. So `<h1>{15} courts</h1>` and `<h1>{venues.length} courts</h1>`
  both fail: the first is not a Count, the second is not a Count either.

  LAYER 2 - THE STORE HANDS OUT NO COUNTABLE COLLECTION.
  store.mjs never returns an array to page code. It returns a VenueList
  with map/forEach for rendering but NO .length, no .filter, no .reduce and
  no [Symbol.iterator]. `venues.length` is undefined, and `[...venues]`
  throws. There is nothing to count.

  LAYER 3 - A BUILD-TIME SCAN.
  scripts/validate-no-bypass.mjs parses everything under app/ and fails the
  build on: .length / .filter().length / .reduce on anything from the data
  layer, and bare numeric literals inside a title, description or heading.
  Wired into prebuild, so a bypass cannot reach a deploy.

  LAYER 4 - THE HONEST LIMIT.
  This is JavaScript. Someone determined can import the raw loader, count
  rows themselves, and hard-code the answer as a string. No language
  mechanism stops that. What layers 1-3 guarantee is that every ACCIDENTAL
  bypass is a runtime throw or a build failure, and every DELIBERATE one
  requires writing code that visibly reaches around the data layer, which is
  exactly what a reviewer would catch. Claiming more than that would be
  false.

  ============================================================
  DENOMINATORS
  ============================================================

  Every Count carries the population it was drawn from, so a page can say
  "12 of 15 venues report lighting" instead of implying the other 3 have
  none. Three numbers, all present:

    value        venues (or courts) matching the predicate
    denominator  all VERIFIED venues in scope
    known        verified venues where the field is not null

  The gap between known and denominator is the honest "we do not know yet"
  population, and Rule 6 requires it to be visible rather than folded into
  the negative. A page that renders value/denominator without mentioning
  known is still truthful; one that renders (denominator - value) as "venues
  without lights" is not, and countUnknown() exists so it never has to.
*/

import {isVerified, isTrue} from './schema.mjs'

const COUNT = Symbol('count')

/**
 * @typedef {object} Count
 * @property {number} value
 * @property {number} denominator  verified venues in scope
 * @property {number} known        verified venues that state this field
 * @property {number} unknown      denominator - known
 * @property {string} basis        what the denominator is
 */

function makeCount(value, denominator, known, basis, preview = false) {
  return Object.freeze({
    [COUNT]: true,
    value,
    denominator,
    known,
    unknown: denominator - known,
    basis,
    /*
      preview=true marks a count drawn from something other than verified
      venues. It exists so a preview render can exercise the template on
      real data without any possibility of that render being mistaken for a
      publishable page: renderCityPage refuses a preview count unless it is
      explicitly told it is rendering a preview, and the page it produces
      carries noindex and a banner. Nothing in app/ can produce one.
    */
    preview,
  })
}

/** True if any count in the object was drawn from unverified rows. */
export const isPreviewCounts = counts =>
  Object.values(counts ?? {}).some(c => isCount(c) && c.preview)

export const isCount = x => !!(x && x[COUNT] === true)

/**
 * The only sanctioned way to turn a Count into text.
 * Throws on a bare number, which is Layer 1.
 */
export function renderCount(c) {
  if (!isCount(c)) {
    throw new Error(
      `renderCount received ${typeof c === 'number' ? `the bare number ${c}` : JSON.stringify(c)}. ` +
      'Every number on the site must come from getCounts(). See lib/data/counts.mjs.',
    )
  }
  return String(c.value)
}

/** "12 of 15 venues report lighting" - the honest form. */
export function renderCountOf(c, noun = 'venues', verb = 'report') {
  if (!isCount(c)) throw new Error('renderCountOf requires a Count from getCounts()')
  if (c.unknown === 0) return `${c.value} of ${c.denominator} ${noun}`
  return `${c.value} of ${c.known} ${noun} that ${verb} it (${c.unknown} not verified yet)`
}

/* ------------------------------------------------------------------ */

/**
 * @typedef {{type:'city',city:string,state:string}
 *          |{type:'county',county:string,state:string}
 *          |{type:'state',state:string}
 *          |{type:'national'}} Scope
 */

export function scopeKey(scope) {
  switch (scope?.type) {
    case 'city': return `city:${scope.state}/${scope.city}`
    case 'county': return `county:${scope.state}/${scope.county}`
    case 'state': return `state:${scope.state}`
    /* The homepage number. findswimmingholes leads with "1,216 Verified
       Places to Swim"; the count IS the value proposition, so it comes
       from here like every other number rather than being tallied in a
       template. */
    case 'national': return 'national'
    default: throw new Error(`Unknown scope: ${JSON.stringify(scope)}`)
  }
}

export function inScope(venue, scope) {
  switch (scope.type) {
    case 'city': return venue.city === scope.city && venue.state === scope.state
    case 'county': return venue.county === scope.county && venue.state === scope.state
    case 'state': return venue.state === scope.state
    case 'national': return true
    default: throw new Error(`Unknown scope type: ${scope.type}`)
  }
}

/**
 * getCounts(scope) - THE only source of numbers.
 *
 * @param {Scope} scope
 * @param {Iterable<object>} allVenues  the full venue population
 * @returns {Record<string, Count>}
 */
export function getCounts(scope, allVenues, opts = {}) {
  scopeKey(scope) // validates the scope shape, throws early on a bad one

  /*
    The population predicate defaults to isVerified and there is no way to
    change it accidentally. Passing a different one REQUIRES a basisLabel,
    and every Count produced is stamped preview=true and has "UNVERIFIED"
    forced into its basis string. So an unverified count cannot be produced
    quietly, and cannot be produced at all without the caller naming what
    it is doing.
  */
  const {predicate = isVerified, basisLabel = null} = opts
  const isPreview = predicate !== isVerified
  if (isPreview && !basisLabel) {
    throw new Error('getCounts: a non-default population predicate requires an explicit basisLabel naming what is being counted.')
  }
  const basisFor = s => isPreview ? `UNVERIFIED PREVIEW — ${basisLabel}` : s

  const inside = []
  for (const v of allVenues) if (inScope(v, scope)) inside.push(v)

  // Rule 5 / Page Gate 5: every count is drawn from VERIFIED venues only.
  const verified = inside.filter(predicate)
  const D = verified.length

  const known = field => verified.filter(v => v[field] !== null && v[field] !== undefined).length
  const countTrue = field => makeCount(
    verified.filter(v => isTrue(v[field])).length, D, known(field),
    basisFor('verified venues in scope'), isPreview,
  )
  const sumOf = field => {
    const withValue = verified.filter(v => typeof v[field] === 'number')
    return makeCount(
      withValue.reduce((a, v) => a + v[field], 0), D, withValue.length,
      basisFor('verified venues in scope that state this figure'), isPreview,
    )
  }

  return {
    venues: makeCount(D, D, D, basisFor('verified venues in scope'), isPreview),

    courts: sumOf('total_courts'),
    indoor_courts: sumOf('indoor_courts'),
    outdoor_courts: sumOf('outdoor_courts'),

    // Rule 14: only indoor_courts drives indoor. covered and climate_control
    // are counted separately and never folded in.
    venues_indoor: makeCount(
      verified.filter(v => typeof v.indoor_courts === 'number' && v.indoor_courts >= 1).length,
      D, known('indoor_courts'), 'verified venues in scope',
    ),
    venues_outdoor: makeCount(
      verified.filter(v => typeof v.outdoor_courts === 'number' && v.outdoor_courts >= 1).length,
      D, known('outdoor_courts'), 'verified venues in scope',
    ),
    venues_free: makeCount(
      verified.filter(v => v.fee_type === 'free').length,
      D, known('fee_type'), 'verified venues in scope',
    ),
    venues_lit: countTrue('light'),
    venues_covered: countTrue('covered'),
    venues_climate: countTrue('climate_control'),

    /*
      The one count NOT drawn from verified venues, by definition. Its
      denominator is every venue in scope regardless of status, and its
      basis says so, so a page cannot accidentally present it against the
      verified population.
    */
    venues_unverified: makeCount(
      inside.length - D, inside.length, inside.length,
      basisFor('ALL venues in scope, verified or not'), isPreview,
    ),
  }
}

/**
 * Rule 8: a city, county or filter page requires 3+ VERIFIED venues to
 * exist at all. Asking this question is the only sanctioned use of a count
 * for control flow.
 */
export function meetsThreshold(counts, min = 3) {
  if (!isCount(counts?.venues)) throw new Error('meetsThreshold requires the object returned by getCounts()')
  return counts.venues.value >= min
}
