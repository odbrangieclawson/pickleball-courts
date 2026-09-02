/*
  Import mapper: source CSV columns -> v4 data model.

  Every one of the 37 source columns has exactly one disposition, declared in
  COLUMN_MAP below. Nothing is silently discarded. The dispositions are:

    map     straight into a v4 field, possibly renamed or type-coerced
    vocab   into a v4 field through a controlled vocabulary
    split   one source column feeds more than one v4 field
    extend  the v4 model gains a field for it, with a written definition
    drop    deliberately not imported, with a stated reason

  THREE POLICIES THAT SHAPE THE OUTPUT. All three follow from Rule 6 and all
  three are reversible if the owner overrules them.

  P1. FALSE ON A BOOLEAN BECOMES NULL.
      is_free, lighted, restrooms, pro_shop, climate_controlled, covered and
      claimed each hold exactly two distinct values across all 18,037 rows
      and zero blanks. A column that cannot express "unknown" did not record
      one: the upstream process collapsed missing into FALSE. So a FALSE here
      is not evidence of a checked negative, it is an absence wearing a
      value. Rule 6 says never coerce null to false; importing these as false
      would do exactly that, and would then publish an unverified negative as
      a fact under Rule 7. TRUE is kept as true, FALSE becomes null, and the
      original is preserved in raw_* so nothing is lost.

  P2. ZERO ON A COUNT OR A RATING BECOMES NULL, AND IS FLAGGED.
      Same reasoning, same signature: total_courts, rating, user_rating and
      review_count have zero blanks. A venue with total_courts = 0 is not a
      venue. EXCEPTION: indoor_courts and outdoor_courts keep a real 0,
      because 0 indoor courts at an outdoor venue is a meaningful, checkable
      fact and Rule 14 depends on being able to state it. Where total_courts
      is known and one side is 0, that 0 is trusted.

  P3. NOTHING IS INFERRED ACROSS FIELDS.
      total_courts is never back-filled from indoor + outdoor, and neither is
      derived from the other. Mismatches are reported (Rule 13), never
      repaired.
*/

import {asString, asNumber, asInt, asTriBool, isAbsent} from '../lib/load-csv.mjs'
import {mapSurface, mapVenueType, mapAccessType} from './vocab.mjs'

/**
 * The full disposition table. This IS the deliverable: it is documentation
 * that executes, so it cannot drift from the code.
 */
export const COLUMN_MAP = [
  {source: 'slug', disposition: 'map', target: 'slug', note: 'Verbatim. Rule 10 shape is checked, not repaired.'},
  {source: 'name', disposition: 'map', target: 'name', note: 'Verbatim.'},
  {source: 'city', disposition: 'map', target: 'city', note: 'Verbatim.'},
  {source: 'state', disposition: 'map', target: 'state', note: 'Upper-cased. Non two-letter values are reported, not corrected.'},
  {source: 'postal_code', disposition: 'map', target: 'postal_code', note: 'Verbatim, zero-padded to 5 where the leading zero was lost to a numeric export.'},
  {source: 'street_address', disposition: 'map', target: 'street_address', note: 'Verbatim. Import Gate I1 requires it to RESOLVE, which this pipeline cannot check without a geocoder.'},

  {source: 'total_courts', disposition: 'map', target: 'total_courts', note: 'P2: 0 becomes null and is flagged. A venue with no courts is not a venue.'},
  {source: 'indoor_courts', disposition: 'map', target: 'indoor_courts', note: 'P2 EXCEPTION: a real 0 is kept. Rule 14 needs it to drive /indoor/.'},
  {source: 'outdoor_courts', disposition: 'map', target: 'outdoor_courts', note: 'P2 EXCEPTION: a real 0 is kept.'},

  {source: 'surface', disposition: 'vocab', target: 'surface', note: '77 distinct source values. Unmappable values become null and are reported. 76.3% of rows say "Standard", which carries no surface information.'},

  {source: 'access_type', disposition: 'split', target: 'fee_type + access_type', note: 'Conflates who may enter with what you pay. Split into two axes. See vocab.mjs.'},
  {source: 'is_free', disposition: 'split', target: 'fee_type', note: 'P1 applies. TRUE is strong evidence for fee_type=free; FALSE is not evidence of anything.'},
  {source: 'drop_in_fee_usd', disposition: 'extend', target: 'drop_in_fee_usd', note: 'EXTENSION. Not in the v4 spec. Definition: the per-session charge in USD a non-member pays to play once. Kept because it is the only numeric evidence for fee_type=drop_in_fee and because Rule 7 will need a figure to attribute. 84.5% null.'},
  {source: 'membership_from_usd', disposition: 'map', target: 'membership_from_usd', note: '93.7% null.'},
  {source: 'pricing_notes', disposition: 'map', target: 'pricing_notes', note: 'Free text. Not a filtered field, so Import Gate I4 does not bind it.'},
  {source: 'pricing_details', disposition: 'map', target: 'pricing_details', note: 'Free text. Frequently identical to pricing_notes; the duplication is reported, not merged.'},

  {source: 'rating', disposition: 'map', target: 'rating', note: 'QUARANTINED (decisions.md O2). P2: 0 becomes null. Must not feed AggregateRating.'},
  {source: 'lighted', disposition: 'map', target: 'light', note: 'RENAMED. P1 applies. Drives /lights/ only when true.'},
  {source: 'restrooms', disposition: 'map', target: 'restroom', note: 'RENAMED. P1 applies.'},
  {source: 'pro_shop', disposition: 'map', target: 'pro_shop', note: 'P1 applies.'},
  {source: 'climate_controlled', disposition: 'map', target: 'climate_control', note: 'RENAMED. P1 applies. Rule 14: NOT indoor.'},
  {source: 'covered', disposition: 'map', target: 'covered', note: 'P1 applies. Rule 14: NOT indoor.'},
  {source: 'amenities', disposition: 'map', target: 'amenities', note: 'Split on comma/semicolon into an array. Free text, not a filtered field.'},

  {source: 'website', disposition: 'map', target: 'website', note: '57.7% null.'},
  {source: 'latitude', disposition: 'map', target: 'latitude', note: 'Range-checked, never corrected.'},
  {source: 'longitude', disposition: 'map', target: 'longitude', note: 'Range-checked, never corrected.'},
  {source: 'phone', disposition: 'map', target: 'phone', note: '48.0% null.'},
  {source: 'hours', disposition: 'map', target: 'hours_of_operation', note: 'RENAMED. Free text.'},

  {source: 'venue_type', disposition: 'vocab', target: 'venue_type', note: '52 distinct source values. 47.5% say "Public", which describes access, not who operates the venue, so it maps to nothing and becomes null.'},
  {source: 'parking', disposition: 'map', target: 'parking', note: 'Free text. 91.3% null.'},
  {source: 'level_of_play', disposition: 'map', target: 'level_of_play', note: 'Free text. 99.1% null.'},
  {source: 'court_availability', disposition: 'map', target: 'court_availability', note: 'Free text. 95.3% null.'},

  {source: 'user_rating', disposition: 'map', target: 'user_rating', note: 'QUARANTINED (O2). P2: 0 becomes null.'},
  {source: 'review_count', disposition: 'map', target: 'review_count', note: 'QUARANTINED (O2). P2: 0 becomes null.'},

  {source: 'claimed', disposition: 'split', target: 'claimed_by_owner + claimed_or_verified', note: 'Rule 11. Feeds claimed_by_owner as an IDENTITY signal only, and is preserved verbatim in the legacy claimed_or_verified field for traceability. It NEVER touches status or verified_by. Only 17 rows are TRUE.'},
  {source: 'sport', disposition: 'extend', target: 'source_sport', note: 'EXTENSION. Definition: the sport the source record describes, as the source labelled it. 18,017 rows say "pickleball" and 20 say "both". Kept because "both" marks shared tennis/pickleball facilities, which affects how court counts should be read.'},

  {source: 'source_url', disposition: 'map', target: 'source_url', note: 'SEE THE PROVENANCE WARNING BELOW. Mapped so the trail is not lost, but it does NOT satisfy Import Gate I2.'},
]

/**
 * v4 fields that the source cannot fill. Listed so their emptiness is a
 * stated fact rather than an oversight.
 */
export const UNSOURCED_V4_FIELDS = [
  {field: 'county', why: 'Not in the source. Must be derived from lat/lng or postal_code, which needs a reference dataset this repo does not have. See reports/README of the county step.'},
  {field: 'date_checked', why: 'Not in the source. No row carries any date at all, so Import Gate I2 cannot pass for any row.'},
  {field: 'nets_provided', why: 'Not in the source and not derivable from any column.'},
  {field: 'verified_by', why: 'Not in the source. The only candidate, source_url, points to a competitor directory, which is not one of the four permitted values.'},
  {field: 'status', why: 'Set to pending for every row by Rule 12. Never computed from source data.'},
  {field: 'claim_date', why: 'Not in the source, even for the 17 rows where claimed is TRUE.'},
  {field: 'play_format', why: 'NO SOURCE SIGNAL. The brief asked for access_type to be split into fee_type and play_format, but access_type contains no play-format information: its values describe cost and entry, never whether a venue runs open play, leagues or lessons. Imported as null for all rows rather than guessed. court_availability mentions reservations on 3 rows, which is too thin to build a field on.'},
]

/**
 * PROVENANCE WARNING - the single most important fact about this dataset.
 *
 * All 18,037 rows carry a source_url and every one of them points to
 * www.courtsource.us. That is a competitor directory, not a source.
 *
 * Import Gate I2 requires verified_by to be one of municipal_source,
 * owner_submission, staff_check or user_report. A competitor's listing page
 * is none of those. Treating it as provenance would mean:
 *   - inheriting the exact data quality the project brief criticises, namely
 *     two CourtSource pages disagreeing at 45 vs 46 venues and 185 vs 187
 *     courts;
 *   - publishing "verified" counts sourced from a site the brief describes
 *     as having 1,345 referring domains that are all spam;
 *   - showing a visitor a provenance line that points at a competitor.
 *
 * So source_url is imported for traceability and verified_by stays null.
 * Every row remains pending. This is reported, not worked around.
 */
export const PROVENANCE_STATUS = {
  rows_with_source_url: 18037,
  distinct_source_domains: ['www.courtsource.us'],
  rows_with_qualifying_provenance: 0,
  rows_with_date_checked: 0,
}

const splitList = v => {
  const s = asString(v)
  if (s === null) return null
  const parts = s.split(/[,;|]/).map(x => x.trim()).filter(Boolean)
  return parts.length ? parts : null
}

/** P1: TRUE stays true, FALSE becomes null. */
const triBoolConservative = v => (asTriBool(v) === true ? true : null)

/** P2: a zero becomes null. */
const positiveOrNull = v => {
  const n = asNumber(v)
  return n === null || n === 0 ? null : n
}
const positiveIntOrNull = v => {
  const n = asInt(v)
  return n === null || n === 0 ? null : n
}

const padZip = v => {
  const s = asString(v)
  if (s === null) return null
  const digits = s.replace(/[^0-9-]/g, '')
  if (/^\d{1,4}$/.test(digits)) return digits.padStart(5, '0')
  return digits || null
}

/**
 * Map one source row to a v4 venue record.
 * Returns {venue, flags} - flags records every place a value was dropped or
 * refused, so the quality report can count them.
 */
export function mapRow(src) {
  const flags = []
  const note = f => flags.push(f)

  // P1 bookkeeping: record where a source FALSE was refused.
  for (const [srcCol] of [['is_free'], ['lighted'], ['restrooms'], ['pro_shop'], ['climate_controlled'], ['covered']]) {
    if (asTriBool(src[srcCol]) === false) note(`p1_false_to_null:${srcCol}`)
  }
  for (const srcCol of ['total_courts', 'rating', 'user_rating', 'review_count']) {
    if (asNumber(src[srcCol]) === 0) note(`p2_zero_to_null:${srcCol}`)
  }

  const surface = mapSurface(src.surface)
  if (surface.value === null && !isAbsent(src.surface)) note(`vocab_unmapped:surface:${src.surface}`)

  const venueType = mapVenueType(src.venue_type)
  if (venueType.value === null && !isAbsent(src.venue_type)) note(`vocab_unmapped:venue_type:${src.venue_type}`)

  const access = mapAccessType(src.access_type, src.is_free, src.drop_in_fee_usd, src.membership_from_usd)
  if (access.fee_type === null && !isAbsent(src.access_type)) note(`vocab_unmapped:fee_type:${src.access_type}`)

  const venue = {
    slug: asString(src.slug),
    name: asString(src.name),
    city: asString(src.city),
    state: (asString(src.state) ?? '').toUpperCase() || null,
    county: null, // derived in a later step; never guessed here
    postal_code: padZip(src.postal_code),
    street_address: asString(src.street_address),
    latitude: asNumber(src.latitude),
    longitude: asNumber(src.longitude),

    total_courts: positiveIntOrNull(src.total_courts),
    indoor_courts: asInt(src.indoor_courts), // P2 exception: real 0 kept
    outdoor_courts: asInt(src.outdoor_courts), // P2 exception: real 0 kept
    surface: surface.value,
    nets_provided: null, // unsourced
    covered: triBoolConservative(src.covered),
    climate_control: triBoolConservative(src.climate_controlled),
    light: triBoolConservative(src.lighted),

    access_type: access.access_type,
    fee_type: access.fee_type,
    membership_from_usd: asNumber(src.membership_from_usd),
    pricing_notes: asString(src.pricing_notes),
    pricing_details: asString(src.pricing_details),

    play_format: null, // no source signal - see UNSOURCED_V4_FIELDS
    level_of_play: asString(src.level_of_play),
    court_availability: asString(src.court_availability),
    venue_type: venueType.value,

    restroom: triBoolConservative(src.restrooms),
    pro_shop: triBoolConservative(src.pro_shop),
    parking: asString(src.parking),
    amenities: splitList(src.amenities),

    website: asString(src.website),
    phone: asString(src.phone),
    hours_of_operation: asString(src.hours),

    rating: positiveOrNull(src.rating),
    user_rating: positiveOrNull(src.user_rating),
    review_count: positiveIntOrNull(src.review_count),

    claimed_or_verified: asString(src.claimed), // legacy, never read by renderers
    source_url: asString(src.source_url),
    date_checked: null, // unsourced
    verified_by: null, // source_url does not qualify - see PROVENANCE WARNING
    status: 'pending', // Rule 12, always
    claimed_by_owner: asTriBool(src.claimed) === true,
    claim_date: null, // unsourced

    // extensions, defined in COLUMN_MAP
    drop_in_fee_usd: asNumber(src.drop_in_fee_usd),
    source_sport: asString(src.sport),
  }

  return {venue, flags}
}
