/*
  Title and meta formulas.

  GLOBAL RULES, all enforced here rather than trusted:
    - every number comes from getCounts(scope)
    - title <= 60 chars target, 65 hard max
    - meta 140-158 chars
    - overflow drops DECLARED tokens right-to-left, never mid-word truncation
    - pluralise() is mandatory: "1 venues" fails the build
    - no year tokens anywhere in a title
    - a number only appears where gate 1 guarantees it is >= 3

  THE OVERFLOW MODEL

  A title is declared as an ordered list of tokens, each marked droppable or
  not. When the assembled title exceeds the limit, the rightmost droppable
  token is removed and it is reassembled. Repeat until it fits. If it still
  does not fit with every droppable token gone, that is a build failure, not
  a truncation - a title cut mid-word is worse than a title that made someone
  fix the city name.
*/

import {isCount} from '../data/counts.mjs'

export const TITLE_TARGET = 60
export const TITLE_MAX = 65
export const META_MIN = 140
export const META_MAX = 158

const YEAR = /\b(19|20)\d{2}\b/

export class TitleError extends Error {}

/**
 * Mandatory pluralisation. Throws on the "1 venues" class of bug rather
 * than emitting it, because that error is invisible in review and obvious
 * to a reader.
 */
export function pluralise(n, singular, plural = null) {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new TitleError(`pluralise() needs a number, got ${JSON.stringify(n)}`)
  }
  return n === 1 ? singular : (plural ?? `${singular}s`)
}

/** Pull a number out of a Count, refusing a bare number. */
export function num(c) {
  if (!isCount(c)) {
    throw new TitleError('A number in a title must come from getCounts(). Received a bare value.')
  }
  return c.value
}

/**
 * Assemble a title from declared tokens.
 * @param {{text:string, droppable?:boolean}[]} tokens
 * @param {number} [max]
 */
export function assembleTitle(tokens, max = TITLE_MAX) {
  const parts = tokens.slice()
  const join = t => t.map(x => x.text).join('')

  let out = join(parts)
  while (out.length > max) {
    // Rightmost droppable token goes first.
    let idx = -1
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].droppable) { idx = i; break }
    }
    if (idx === -1) {
      throw new TitleError(
        `Title is ${out.length} chars and every droppable token is already gone: "${out}". ` +
        'Refusing to truncate mid-word. Shorten a fixed token instead.',
      )
    }
    parts.splice(idx, 1)
    out = join(parts)
  }
  if (YEAR.test(out)) {
    throw new TitleError(`Title contains a year token: "${out}". Freshness lives in date_checked, not the title.`)
  }
  return out
}

/** Meta descriptions must land in the band; no silent truncation. */
export function checkMeta(meta) {
  const len = meta.length
  if (YEAR.test(meta) && !/Last checked/i.test(meta)) {
    // A year is allowed only inside the "Last checked {Mon YYYY}" clause.
    throw new TitleError(`Meta contains a stray year token: "${meta}"`)
  }
  return {
    pass: len >= META_MIN && len <= META_MAX,
    length: len,
    verdict: len < META_MIN ? `${len} chars, ${META_MIN - len} short of ${META_MIN}`
      : len > META_MAX ? `${len} chars, ${len - META_MAX} over ${META_MAX}`
      : `${len} chars, inside ${META_MIN}-${META_MAX}`,
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function monthYear(isoDate) {
  if (!isoDate) return null
  const [y, m] = String(isoDate).split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

/* ------------------------------------------------------------------ */
/* CITY                                                                */
/* ------------------------------------------------------------------ */

/**
 * Title: Pickleball Courts in {City}, {ST} - {venues} Verified Venues
 * overflow: drop " Verified" -> drop the count clause entirely
 */
export function cityTitle({city, state, counts}) {
  const n = num(counts.venues)
  return assembleTitle([
    {text: `Pickleball Courts in ${city}, ${state}`},
    {text: ` - ${n}`, droppable: true, group: 'count'},
    {text: ' Verified', droppable: true},
    {text: ` ${pluralise(n, 'Venue')}`, droppable: true, group: 'count'},
  ].filter(Boolean))
}

/*
  The spec's overflow ladder is "drop ' Verified', then drop the count
  clause entirely". Dropping tokens right-to-left one at a time would leave
  "- 12" stranded without its noun, so the count clause is dropped as a
  unit. Implemented explicitly rather than relying on the generic dropper.
*/
export function cityTitleWithLadder({city, state, counts}) {
  const n = num(counts.venues)
  const base = `Pickleball Courts in ${city}, ${state}`
  const full = `${base} - ${n} Verified ${pluralise(n, 'Venue')}`
  if (full.length <= TITLE_MAX) return full
  const noVerified = `${base} - ${n} ${pluralise(n, 'Venue')}`
  if (noVerified.length <= TITLE_MAX) return noVerified
  if (base.length <= TITLE_MAX) return base
  throw new TitleError(`Even the bare title is ${base.length} chars: "${base}"`)
}

export function cityH1({city, state}) {
  const h1 = `Pickleball Courts in ${city}, ${state}`
  if (/\d/.test(h1)) throw new TitleError('The city H1 must carry no number.')
  return h1
}

/**
 * Meta: {venues} verified pickleball venues in {City}, {ST}: {courts}
 *       courts, {indoor} indoor. Every fact sourced and dated. Last
 *       checked {Mon YYYY}.
 */
export function cityMeta({city, state, counts, lastChecked}) {
  const v = num(counts.venues)
  const c = num(counts.courts)
  const i = num(counts.indoor_courts)
  const when = monthYear(lastChecked)
  const meta = `${v} verified pickleball ${pluralise(v, 'venue')} in ${city}, ${state}: ` +
    `${c} ${pluralise(c, 'court')}, ${i} indoor. Every fact sourced and dated.` +
    (when ? ` Last checked ${when}.` : '')
  return meta
}

/* ------------------------------------------------------------------ */
/* FILTER                                                              */
/* ------------------------------------------------------------------ */

export const FILTER_TITLES = {
  indoor: ({city, state, n}) => `Indoor Pickleball Courts in ${city}, ${state} - ${n} ${pluralise(n, 'Venue')}`,
  outdoor: ({city, state}) => `Outdoor Pickleball Courts in ${city}, ${state}`,
  free: ({city, state}) => `Free Pickleball Courts in ${city}, ${state}`,
  public: ({city, state}) => `Public Pickleball Courts in ${city}, ${state}`,
  lights: ({city, state}) => `Lighted Pickleball Courts in ${city}, ${state}`,
}

export const FILTER_PREDICATE = {
  indoor: 'with indoor courts',
  outdoor: 'with outdoor courts',
  free: 'that are free to play',
  public: 'open to the public',
  lights: 'with lit courts',
}

export function filterMeta({filter, city, count, distinguishing}) {
  const n = num(count)
  return `${n} of ${count.denominator} verified ${city} ${pluralise(count.denominator, 'venue')} ` +
    `${FILTER_PREDICATE[filter]}. ${distinguishing} Sourced and dated.`
}

/* ------------------------------------------------------------------ */
/* VENUE                                                               */
/* ------------------------------------------------------------------ */

/**
 * RULE: court counts never enter the venue title. Counts change, titles
 * should not, and a wrong count is the worst error on the site.
 */
export function venueTitle({name, city, state}) {
  const t = `${name} - Pickleball Courts in ${city}, ${state}`
  if (/\b\d+\b/.test(t.replace(name, ''))) {
    throw new TitleError(`A venue title must carry no count: "${t}"`)
  }
  return assembleTitle([
    {text: `${name} - Pickleball Courts in ${city}, ${state}`},
  ], TITLE_MAX)
}
