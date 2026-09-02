/*
  Vocabulary normalisation (Phase 1 deliverable 4).

  Rules of this file:
    - A value maps only when the mapping is unambiguous. Anything else
      returns null WITH the original recorded, so it lands in the
      unmappable report instead of becoming a guess.
    - Mapping is case-insensitive and whitespace-tolerant, nothing more. No
      fuzzy matching, no "close enough".
    - Every returned object carries {value, reason} so the report can say WHY
      something did not map.

  THE ACCESS_TYPE SPLIT

  access_type conflates two different questions:
      who may enter        -> access_type (kept, still uncontrolled - O1)
      what you pay to play -> fee_type    (controlled)

  The brief asked for access_type to be split into fee_type and play_format.
  fee_type is real and is done here. play_format is NOT derivable: no
  access_type value says anything about open play, leagues, lessons or
  tournaments. Inventing that mapping would fabricate a filtered field, so
  play_format imports as null for every row. This is stated in
  mapper.mjs > UNSOURCED_V4_FIELDS rather than quietly skipped.
*/

const norm = v =>
  v === undefined || v === null ? '' : String(v).trim().toLowerCase().replace(/\s+/g, ' ')

/* ------------------------------------------------------------------ */
/* surface                                                             */
/* ------------------------------------------------------------------ */

const SURFACE = new Map(Object.entries({
  asphalt: 'asphalt',
  concrete: 'concrete',
  'coated concrete': 'acrylic',
  acrylic: 'acrylic',
  'acrylic/cushioned': 'cushioned_acrylic',
  cushioned: 'cushioned_acrylic',
  cushionx: 'cushioned_acrylic',
  'cushioned acrylic': 'cushioned_acrylic',
  wood: 'wood',
  'indoor hardwood': 'wood',
  hardwood: 'wood',
  'wood/hardwood': 'wood',
  'gym floor': 'wood',
  clay: 'clay',
  grass: 'grass',
  turf: 'grass',
  'synthetic turf': 'grass',
  tile: 'modular_tile',
  'modular tile': 'modular_tile',
  'sport court': 'modular_tile',
  'sport tile': 'modular_tile',
}))

/*
  Values that are REFUSED rather than mapped, with the reason. These are the
  large ones: "Standard" alone is 76.3% of all rows and carries no surface
  information whatsoever - it is a placeholder, not a measurement.
*/
const SURFACE_REFUSED = new Map(Object.entries({
  standard: 'Carries no surface information. It is a placeholder value, not a measurement.',
  hard: 'Ambiguous: asphalt, concrete and acrylic are all "hard". Cannot be resolved without checking the venue.',
  'hard court': 'Ambiguous, same as "hard".',
  'outdoor surfacing': 'Describes location, not material.',
  outdoor: 'Describes location, not material.',
  indoor: 'Describes location, not material.',
  mixed: 'More than one surface. Needs the O5 multi-surface decision before it can be recorded.',
  various: 'More than one surface. See O5.',
  multiple: 'More than one surface. See O5.',
}))

export function mapSurface(raw) {
  const k = norm(raw)
  if (!k) return {value: null, reason: 'absent'}
  if (SURFACE.has(k)) return {value: SURFACE.get(k), reason: 'mapped'}
  if (SURFACE_REFUSED.has(k)) return {value: null, reason: SURFACE_REFUSED.get(k)}
  return {value: null, reason: 'unrecognised'}
}

/* ------------------------------------------------------------------ */
/* venue_type                                                          */
/* ------------------------------------------------------------------ */

const VENUE_TYPE = new Map(Object.entries({
  park: 'public_park',
  'public park': 'public_park',
  'city park': 'public_park',
  'county park': 'public_park',
  'municipal park': 'public_park',
  'recreation center': 'community_center',
  'rec center': 'community_center',
  'community center': 'community_center',
  'community centre': 'community_center',
  'senior center': 'community_center',
  'dedicated pickleball facility': 'dedicated_pickleball_facility',
  'dedicated pickleball': 'dedicated_pickleball_facility',
  'pickleball club': 'dedicated_pickleball_facility',
  'country club': 'racquet_club',
  'tennis club': 'racquet_club',
  'racquet club': 'racquet_club',
  'swim and tennis club': 'racquet_club',
  'health club': 'fitness_center',
  gym: 'fitness_center',
  'fitness center': 'fitness_center',
  'athletic club': 'fitness_center',
  school: 'school',
  university: 'school',
  college: 'school',
  'high school': 'school',
  ymca: 'nonprofit_recreation',
  ywca: 'nonprofit_recreation',
  jcc: 'nonprofit_recreation',
  'boys and girls club': 'nonprofit_recreation',
  church: 'faith_facility',
  synagogue: 'faith_facility',
  'faith facility': 'faith_facility',
  '55+ community': 'residential_community',
  'retirement community': 'residential_community',
  hoa: 'residential_community',
  'apartment complex': 'residential_community',
  resort: 'resort_hotel',
  hotel: 'resort_hotel',
  'hotel/resort': 'resort_hotel',
  campground: 'resort_hotel',
}))

const VENUE_TYPE_REFUSED = new Map(Object.entries({
  public: 'Describes ACCESS, not who operates the venue. venue_type answers "who runs it"; this answers "who may enter". 47.5% of rows carry it.',
  private: 'Describes ACCESS, not operator.',
  commercial: 'Describes ownership model, not venue type. A commercial venue may be a fitness centre, a dedicated facility or an entertainment venue.',
  community: 'Ambiguous between community_center and residential_community.',
  'sports complex': 'Ambiguous between public_park and dedicated_pickleball_facility without checking the operator.',
  other: 'Explicitly unspecified.',
}))

export function mapVenueType(raw) {
  const k = norm(raw)
  if (!k) return {value: null, reason: 'absent'}
  if (VENUE_TYPE.has(k)) return {value: VENUE_TYPE.get(k), reason: 'mapped'}
  if (VENUE_TYPE_REFUSED.has(k)) return {value: null, reason: VENUE_TYPE_REFUSED.get(k)}
  return {value: null, reason: 'unrecognised'}
}

/* ------------------------------------------------------------------ */
/* access_type -> fee_type + access_type                               */
/* ------------------------------------------------------------------ */

/* The fee axis: what a member of the public pays to play. */
const FEE_FROM_ACCESS = new Map(Object.entries({
  free: 'free',
  'free / public': 'free',
  'free/public': 'free',
  'drop-in fee': 'drop_in_fee',
  'pay-to-play': 'drop_in_fee',
  'pay to play': 'drop_in_fee',
  'membership required': 'membership_required',
  membership: 'membership_required',
  'members only': 'membership_required',
  'residents only': 'permit_required',
  'resident only': 'permit_required',
}))

/* The access axis: who may enter. Uncontrolled pending O1. */
const ACCESS_FROM_ACCESS = new Map(Object.entries({
  public: 'public',
  'public - dedicated': 'public',
  'public park': 'public',
  municipal: 'public',
  free: 'public',
  'free / public': 'public',
  'free/public': 'public',
  'drop-in fee': 'public',
  'pay-to-play': 'public',
  private: 'private',
  'members only': 'members_only',
  'membership required': 'members_only',
  membership: 'members_only',
  'residents only': 'residents_only',
  'guest/member': 'members_or_guests',
  commercial: 'commercial',
  'hotel/resort': 'guests_only',
}))

/*
  Compound values. "Drop-In Fee + Membership" means both routes exist. Under
  the O4 precedence rule the LEAST restrictive route is recorded, so it
  resolves to drop_in_fee. These are listed explicitly rather than parsed,
  because parsing "+" would silently invent semantics for future values.
*/
const FEE_COMPOUND = new Map(Object.entries({
  'drop-in fee + membership': 'drop_in_fee',
  'free + membership': 'free',
  'guest/member': 'drop_in_fee',
}))

const FEE_REFUSED = new Map(Object.entries({
  public: 'Describes ACCESS, not cost. A public park may be free, permit-only or metered. 42.2% of rows carry it, and it is the single largest reason fee_type stays null.',
  'public - dedicated': 'Describes access and dedication, not cost.',
  'public park': 'Describes access, not cost.',
  municipal: 'Describes the operator, not cost.',
  commercial: 'Describes the operator, not cost. A commercial venue may charge per session, by membership or both.',
  private: 'Describes access, not cost.',
  'hotel/resort': 'Describes the operator. Guest pricing is unknown.',
}))

/**
 * Split one access_type value, with corroboration from is_free,
 * drop_in_fee_usd and membership_from_usd.
 *
 * Corroboration only ever ADDS information where access_type refused to. It
 * never overrides an explicit access_type mapping, because a conflict is a
 * data-quality signal the report should surface rather than something to
 * resolve silently.
 */
export function mapAccessType(rawAccess, rawIsFree, rawDropIn, rawMembership) {
  const k = norm(rawAccess)
  const access_type = ACCESS_FROM_ACCESS.get(k) ?? null

  let fee_type = FEE_COMPOUND.get(k) ?? FEE_FROM_ACCESS.get(k) ?? null
  let fee_reason = fee_type ? 'mapped from access_type' : (FEE_REFUSED.get(k) ?? (k ? 'unrecognised' : 'absent'))

  if (fee_type === null) {
    // is_free TRUE is positive evidence. is_free FALSE is not (policy P1).
    if (norm(rawIsFree) === 'true') {
      fee_type = 'free'
      fee_reason = 'mapped from is_free=TRUE'
    } else {
      const dropIn = Number(rawDropIn)
      const memb = Number(rawMembership)
      if (Number.isFinite(dropIn) && dropIn > 0) {
        fee_type = 'drop_in_fee'
        fee_reason = 'inferred from drop_in_fee_usd > 0'
      } else if (Number.isFinite(memb) && memb > 0) {
        fee_type = 'membership_required'
        fee_reason = 'inferred from membership_from_usd > 0'
      }
    }
  }

  // Conflict detection: an explicit free that also carries a price.
  let conflict = null
  const dropIn = Number(rawDropIn)
  if (fee_type === 'free' && Number.isFinite(dropIn) && dropIn > 0) {
    conflict = `fee_type=free but drop_in_fee_usd=${dropIn}`
  }

  return {access_type, fee_type, fee_reason, conflict}
}

export const VOCAB_TARGETS = {
  surface: [...new Set(SURFACE.values())],
  venue_type: [...new Set(VENUE_TYPE.values())],
  fee_type: [...new Set([...FEE_FROM_ACCESS.values(), ...FEE_COMPOUND.values()])],
  access_type: [...new Set(ACCESS_FROM_ACCESS.values())],
}
