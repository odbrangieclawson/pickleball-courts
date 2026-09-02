/*
  Phase 2 deliverable 3: the slug registry.

  Rule 10: slugs never use numeric duplicate suffixes. Collisions resolve
  with real disambiguation.

  WHY THIS IS ENFORCED IN CODE AND NOT BY REVIEW

  A competitor has martz-field-2 and waldstein-park-2 live in production.
  Nobody decided that; a counter did, because appending -2 is the path of
  least resistance when two names collide at 4pm. So the registry has no
  code path that can produce one:

    - register() THROWS on any slug ending in -<digits>.
    - There is no counter anywhere in this module.
    - Collision resolution takes a list of DISAMBIGUATORS drawn from the
      venue's own data (neighbourhood, street, venue type, county). If none
      of them separates the two venues, register() throws and asks a human.
      It does not fall back to a number, because there is no fallback to
      fall back to.

  The failure mode is a build failure, which is loud, rather than a bad URL,
  which is permanent under Rule 3.
*/

const NUMERIC_SUFFIX = /-\d+$/

export function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’.]/g, '')      // apostrophes and periods vanish, not hyphenate
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export class NumericSuffixError extends Error {}
export class UnresolvedCollisionError extends Error {}

/**
 * Disambiguators, in the order they are tried. Each is a real property of
 * the venue, never a sequence number.
 *
 * Order matters: a neighbourhood is the most human way to tell two parks
 * apart, a street is the most precise, and venue type is the last resort
 * that still carries meaning.
 */
export const DISAMBIGUATORS = Object.freeze([
  {key: 'neighbourhood', get: v => v.neighbourhood ?? v.neighborhood ?? null},
  {key: 'street', get: v => {
    const a = v.street_address
    if (!a) return null
    // "8533 Acanthus Drive" -> "acanthus-drive": the street, not the number.
    const m = String(a).replace(/^\s*\d+\s+/, '').split(',')[0]
    return m && m.length > 2 ? m : null
  }},
  {key: 'county', get: v => v.county ?? null},
  {key: 'venue_type', get: v => v.venue_type ?? null},
  {key: 'postal_code', get: v => v.postal_code ?? null},
])

export class SlugRegistry {
  constructor() {
    /** @type {Map<string, object[]>} slug -> venues holding it */
    this.taken = new Map()
    this.rejected = []
  }

  has(slug) { return this.taken.has(slug) }

  /**
   * Register a slug for a venue.
   * @throws {NumericSuffixError} if the slug ends in -<digits>
   * @throws {UnresolvedCollisionError} if it collides and nothing separates them
   */
  register(slug, venue) {
    if (!slug) throw new Error('register() needs a slug')
    if (NUMERIC_SUFFIX.test(slug)) {
      throw new NumericSuffixError(
        `Slug "${slug}" ends in a numeric suffix. Rule 10 forbids this. ` +
        'Resolve the collision with real disambiguation (neighbourhood, street, county), not a counter.',
      )
    }
    if (!this.taken.has(slug)) {
      this.taken.set(slug, [venue])
      return slug
    }
    // Collision. Try to separate them on real data.
    const resolved = this.disambiguate(slug, venue)
    this.taken.set(resolved, [venue])
    return resolved
  }

  /**
   * Find a distinguishing slug using the venue's own attributes.
   * Never appends a number. Throws if nothing distinguishes.
   */
  disambiguate(baseSlug, venue) {
    for (const d of DISAMBIGUATORS) {
      const raw = d.get(venue)
      if (!raw) continue
      const candidate = `${baseSlug}-${slugify(raw)}`
      if (NUMERIC_SUFFIX.test(candidate)) continue // e.g. a bare postal code
      if (!this.taken.has(candidate)) return candidate
    }
    throw new UnresolvedCollisionError(
      `Slug "${baseSlug}" collides and no disambiguator separates it. ` +
      `Tried: ${DISAMBIGUATORS.map(d => d.key).join(', ')}. ` +
      'This needs a human decision - a real distinguishing name, not a number. ' +
      `Venue: ${venue.name ?? '(unnamed)'}, ${venue.city ?? '?'} ${venue.state ?? '?'}`,
    )
  }

  /** Generate from a name, then register. */
  generate(name, venue) {
    return this.register(slugify(name), venue)
  }
}

/**
 * Audit an existing slug population without mutating anything.
 * Reports what the registry WOULD reject.
 */
export function auditSlugs(venues) {
  const bySlug = new Map()
  for (const v of venues) {
    const s = v.slug ?? '(null)'
    if (!bySlug.has(s)) bySlug.set(s, [])
    bySlug.get(s).push(v)
  }

  const numericSuffix = []
  const collisions = []
  const empty = []

  for (const [slug, vs] of bySlug) {
    if (slug === '(null)' || slug === '') { empty.push(...vs); continue }
    if (NUMERIC_SUFFIX.test(slug)) numericSuffix.push({slug, venues: vs})
    if (vs.length > 1) collisions.push({slug, count: vs.length, venues: vs})
  }

  // For each collision, can real disambiguation actually resolve it?
  const resolvable = []
  const unresolvable = []
  for (const c of collisions) {
    const reg = new SlugRegistry()
    const outcomes = []
    let ok = true
    for (const v of c.venues) {
      try {
        outcomes.push(reg.register(c.slug, v))
      } catch (e) {
        ok = false
        outcomes.push(`UNRESOLVED: ${e.constructor.name}`)
      }
    }
    ;(ok ? resolvable : unresolvable).push({...c, proposed: outcomes})
  }

  return {
    total: venues.length,
    distinct: bySlug.size,
    numeric_suffix: numericSuffix,
    collisions,
    resolvable,
    unresolvable,
    empty,
  }
}
