/*
  Phase 2: the venue store. Layer 2 of the count-bypass prevention.

  Page code never receives an array. It receives a VenueList, which can be
  mapped for rendering and nothing else:

    no .length          -> `venues.length` is undefined, not a number
    no .filter          -> cannot build a subset to count
    no .reduce          -> cannot sum
    no [Symbol.iterator]-> `[...venues]` throws, so it cannot be widened
                           back into an array

  Everything a page legitimately needs from a collection is either rendering
  (map) or a count, and counts come from getCounts(). There is no third
  thing, so there is nothing else to expose.

  The raw population is available to the DATA LAYER through loadVenues(),
  which is what getCounts and the validators consume. That is deliberate:
  the restriction is on what reaches a page, not on the layer whose job is
  arithmetic.
*/

const LIST = Symbol('venuelist')

/**
 * A render-only view over venues.
 * Frozen, and exposes exactly two methods.
 */
export function makeVenueList(venues) {
  const items = venues.map(v => Object.freeze({...v}))
  const list = {
    [LIST]: true,
    /** Render each venue. The only way to get at them from a page. */
    map(fn) { return items.map((v, i) => fn(v, i)) },
    forEach(fn) { items.forEach((v, i) => fn(v, i)) },
    /**
     * Deliberately absent: length, filter, reduce, slice, [Symbol.iterator].
     * If you want a number, call getCounts(). If you want a subset, ask the
     * store for that subset by name so the predicate lives in the data layer
     * where it can be tested, not inline in a template.
     */
  }
  Object.defineProperty(list, Symbol.iterator, {
    get() {
      throw new Error(
        'A VenueList is not iterable. Spreading it would turn it back into a countable array. ' +
        'Use .map() to render, or getCounts() for any number.',
      )
    },
  })
  return Object.freeze(list)
}

export const isVenueList = x => !!(x && x[LIST] === true)
