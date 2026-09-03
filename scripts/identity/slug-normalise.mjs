/*
  Slug normalisation: taking the redundancy out of a venue slug.

  THE PROBLEM

  The imported slugs repeat what the URL already says. The path is
  /pickleball/us/{state}/{city}/{venue}/, and the venue segment arrives as

    seattle-miller-playfield-pickleball-courts-capitol-hill
    john-hunt-park-recreation-center-huntsville-al
    bowers-park-pickleball-tuscaloosa-al

  giving URLs that say Seattle twice and pickleball three times. 4,223 rows
  carry their own city as a prefix, 3,509 carry city-and-state as a suffix,
  1,470 carry the word pickleball on a pickleball site.

  This is only fixable before launch. §3 makes URLs permanent, so after the
  first publish each of these is a 301 maintained forever.

  ============================================================
  WHY THIS IS MOSTLY GUARDS
  ============================================================

  Stripping a token that turns out to be the venue's actual name destroys
  its identity, permanently, and the failure is silent - the page still
  builds, it is just called the wrong thing at a URL nobody can search for.
  Three real examples from the data:

    auburn-pickleball        city Auburn. Strip the city and the slug is
                             "pickleball", which on a pickleball directory
                             identifies nothing.
    palmer-lake-co           city Palmer Lake, state CO. Strip the state,
                             then the city, and nothing is left at all.
    craig-high-school        city Craig. Strips to "high-school", which is
                             thin but genuinely what the venue is, and reads
                             correctly under /us/ak/craig/.

  So every strip is proposed, then tested, and rejected unless what survives
  still identifies a place. The tests are below in canonicalise(); the order
  matters, because stripping a suffix can expose a prefix that then also
  qualifies.

  WHERE A VERIFIED NAME EXISTS, IT WINS

  A venue that has been verified has a name from a municipal source -
  "Miller Playfield" rather than "Seattle - Miller Playfield Pickleball
  Courts (Capitol Hill)". That is a better identity than anything derivable
  from the import, so the slug is built from it. This only applies before a
  venue publishes; after that §3 freezes the URL regardless.
*/

/** Words that cannot carry a slug on their own on a pickleball directory. */
const GENERIC = new Set([
  'pickleball', 'pickle', 'courts', 'court', 'tennis', 'the', 'of', 'and',
  'at', 'in', 'a', 'city', 'public', 'usa', 'us',
])

/** Trailing noise phrases, longest first so the greediest match wins. */
const TRAILING_NOISE = [
  'tennis-and-pickleball-courts',
  'pickleball-and-tennis-courts',
  'pickleball-and-badminton-courts',
  'pickleball-tennis-courts',
  'pickleball-courts',
  'pickleball-court',
  'tennis-courts',
  'pickleball',
]

export const tokenise = s =>
  String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const parts = s => (s ? s.split('-').filter(Boolean) : [])

/**
 * Is this string still a usable identifier?
 *
 * Three ways to fail:
 *   - nothing left, or too short to mean anything
 *   - only generic words, so it identifies no particular place
 *   - it has collapsed to the city name, which the path already carries
 *
 * That last one is the guard the first version of this file lacked, and it
 * mattered immediately. "auburn-pickleball" in Auburn AL lost its trailing
 * sport word and became "auburn", giving /us/al/auburn/auburn/. Same for
 * "palmer-lake-co" in Palmer Lake CO. Both are venues genuinely named after
 * their town, so the redundancy is real and cannot be removed - the strip is
 * refused and the imported slug stands.
 */
function usable(slug, city) {
  const p = parts(slug)
  if (p.length === 0) return false
  if (slug.length < 3) return false
  if (city && slug === city) return false
  if (p.length === 1) return !GENERIC.has(p[0])
  return p.some(t => !GENERIC.has(t))
}

/** Strip `suffix` (a token sequence) from the end, if present and safe. */
function dropSuffix(slug, suffix, city) {
  if (!suffix) return slug
  const s = `-${suffix}`
  if (!slug.endsWith(s)) return slug
  const next = slug.slice(0, -s.length)
  return usable(next, city) ? next : slug
}

/** Strip `prefix` from the front, if present and safe. */
function dropPrefix(slug, prefix, city) {
  if (!prefix) return slug
  const p = `${prefix}-`
  if (!slug.startsWith(p)) return slug
  const next = slug.slice(p.length)
  return usable(next, city) ? next : slug
}

/**
 * Is a trailing number the venue's name, or the import's row id?
 *
 * 628 slugs end in digits and almost all of them are row ids -
 * lewis-park-6944, curtis-park-666, heritage-park-667. Left on, they make
 * a permanent URL out of a number from someone else's spreadsheet, and
 * Import Gate I1 refuses the venue outright (Rule 10), so the venue simply
 * never publishes.
 *
 * But some of those digits are the name. "Elks #6" is a lodge number, and
 * a court called "Court 1" is called that. Stripping those is the same
 * silent identity loss the guards above exist to prevent.
 *
 * The row itself settles it: if the venue's NAME contains that number, the
 * number is part of the name and stays. If the name does not mention it,
 * it came from the import and goes. Where there is no name to consult the
 * suffix stays, because a slug that is merely ugly still identifies the
 * place and a wrong one does not.
 */
function rowIdSuffix(slug, name, city) {
  if (!name) return slug
  const nameTokens = parts(tokenise(name))
  /*
    Iterated, because the trailing digits are not always one group.
    "santa-fe-family-life-center-405-840" is a phone number that leaked into
    the slug of a venue plainly named "Santa Fe Family Life Center"; taking
    off one group leaves the other half of the phone number behind.
  */
  let out = slug
  for (;;) {
    const m = /-(\d+)$/.exec(out)
    if (!m) return out
    if (nameTokens.includes(m[1])) return out
    const next = out.slice(0, -m[0].length)
    if (!usable(next, city)) return out
    out = next
  }
}

/**
 * @param {object} v         venue record (needs city, state, slug)
 * @param {string|null} verifiedName  name from a source, if the venue has one
 * @returns {{slug: string, steps: string[]}}
 */
export function canonicalise(v, verifiedName = null) {
  const city = tokenise(v.city)
  const state = tokenise(v.state)
  const steps = []

  let slug
  if (verifiedName) {
    slug = tokenise(verifiedName)
    steps.push(`built from the verified name "${verifiedName}"`)
  } else {
    slug = tokenise(v.slug)
  }

  /*
    The row id comes off before anything else. It is the outermost token
    and nothing else can be judged past it.
  */
  let next = rowIdSuffix(slug, v.name, city)
  if (next !== slug) { steps.push(`dropped trailing "${slug.slice(next.length)}" (an import row id, not part of the name "${v.name}")`); slug = next }

  /*
    Suffixes first. "-huntsville-al" has to come off before the leading
    "john-hunt-park" can be judged, and removing "-co" from "palmer-lake-co"
    is what exposes the city prefix that must then be refused.
  */
  next = dropSuffix(slug, `${city}-${state}`, city)
  if (next !== slug) { steps.push(`dropped trailing "-${city}-${state}" (already in the path)`); slug = next }

  next = dropSuffix(slug, state, city)
  if (next !== slug) { steps.push(`dropped trailing "-${state}" (already in the path)`); slug = next }

  next = dropSuffix(slug, city, city)
  if (next !== slug) { steps.push(`dropped trailing "-${city}" (already in the path)`); slug = next }

  next = dropPrefix(slug, city, city)
  if (next !== slug) { steps.push(`dropped leading "${city}-" (already in the path)`); slug = next }

  /* Sport words, from the ends only. A venue genuinely called "Pickle
     Palace" keeps its name; a slug ending "-pickleball-courts" does not. */
  for (const noise of TRAILING_NOISE) {
    next = dropSuffix(slug, noise, city)
    if (next !== slug) { steps.push(`dropped trailing "-${noise}" (this is a pickleball directory)`); slug = next; break }
  }

  next = dropPrefix(slug, 'pickleball', city)
  if (next !== slug) { steps.push('dropped leading "pickleball-"'); slug = next }

  return {slug, steps}
}
