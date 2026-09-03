/*
  Facets: the five that get a URL, and everything else that gets a query
  parameter and a noindex.

  DECISION D4, and it is the decision under the most constant pressure. The
  imported dataset offers a dozen tempting sixth filters, several of which
  have real search demand — climate_control matters in hot states, covered
  matters in wet ones. Neither earns a slot. Five is the whole list, and
  adding a sixth means deleting one.

  Why the discipline is worth it: every indexable facet multiplies the URL
  space. Five filters over 100 cities is 500 pages. Add surface, court count
  and price band and it is thousands of near-identical lists competing with
  each other and with the city page — which is Rule 9's cannibalisation, and
  the exact shape of PlayPickleball's 25,245 pages at 1.7 visits each.

  A parameter here is not a lesser feature. The facet still works on the
  city page; it just does not get its own indexable URL.
*/

/** The five. Immutable — decisions.md §2. */
export const INDEXABLE_FILTERS = Object.freeze(['indoor', 'outdoor', 'free', 'public', 'lights'])

/**
 * Everything else. Each of these is a legitimate way to narrow a list and
 * an illegitimate way to make a page.
 */
export const NOINDEX_PARAMS = Object.freeze([
  'surface',          // asphalt vs acrylic. Real preference, tiny intent.
  'courts',           // minimum court count
  'sort',             // ordering is not a different page
  'distance',         // radius from a point
  'climate_control',  // real intent in hot states; still not a sixth filter
  'covered',          // real intent in wet ones; still not a sixth filter
  'pro_shop',
  'restroom',
  'parking',
  'level_of_play',
  'court_availability',
  'venue_type',       // note: DRIVES /public/, but is not itself a filter URL
  'price',            // price band
  'page',             // pagination
])

/** True if a URL's query string would make it non-indexable. */
export function isNoindexUrl(url) {
  try {
    const q = new URL(url, 'https://example.invalid').searchParams
    return NOINDEX_PARAMS.some(p => q.has(p))
  } catch {
    return false
  }
}

/**
 * The directives, as data, so a report can print them and a test can assert
 * them without parsing robots.txt.
 */
export function robotsDirectives() {
  return [
    ...NOINDEX_PARAMS.map(p => ({directive: 'Disallow', pattern: `/*?${p}=`, facet: p})),
    ...NOINDEX_PARAMS.map(p => ({directive: 'Disallow', pattern: `/*&${p}=`, facet: p})),
  ]
}
