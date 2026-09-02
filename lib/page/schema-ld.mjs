/*
  JSON-LD builders. Page Gate 3.

  BreadcrumbList everywhere. ItemList on city and filter pages.
  SportsActivityLocation on venues. Dataset on state pages.
  AggregateRating ONLY where real - and it is currently never real, because
  every rating in the import has unknown provenance (O2), so no builder here
  emits one. There is no parameter to pass one in.

  ItemList MIRRORS THE VISIBLE ROWS EXACTLY. It is built from the same array
  the template renders, in the same order, so schema and body cannot drift.
  Passing a different list is not possible: buildCityGraph takes one venue
  array and uses it for both.
*/

/*
  O10 is unresolved: there is no canonical hostname yet. Rather than bake a
  guess into permanent schema @ids, the origin is injected. A caller that
  omits it gets an obvious placeholder, and the gate check flags it.
*/
export const PLACEHOLDER_ORIGIN = 'https://example.invalid'

const abs = (origin, path) => `${origin}${path}`

export function breadcrumbList({origin, state, stateName, county, countySlug, city, citySlug}) {
  const items = [
    {name: 'US', path: '/pickleball/us/'},
    {name: stateName ?? state, path: `/pickleball/us/${state.toLowerCase()}/`},
  ]
  if (county && countySlug) {
    items.push({name: `${county} County`, path: `/pickleball/us/${state.toLowerCase()}/${countySlug}-county/`})
  }
  if (city && citySlug) {
    items.push({name: city, path: `/pickleball/us/${state.toLowerCase()}/${citySlug}/`})
  }
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(origin, it.path),
    })),
  }
}

/** One venue as a SportsActivityLocation. Nulls are OMITTED, never zeroed. */
export function venueNode({origin, venue, cityPath}) {
  const n = {
    '@type': 'SportsActivityLocation',
    name: venue.name,
    url: abs(origin, `${cityPath}${venue.slug}/`),
  }
  if (venue.street_address) {
    n.address = {
      '@type': 'PostalAddress',
      streetAddress: venue.street_address,
      addressLocality: venue.city,
      addressRegion: venue.state,
      addressCountry: 'US',
    }
    if (venue.postal_code) n.address.postalCode = venue.postal_code
  }
  if (typeof venue.latitude === 'number' && typeof venue.longitude === 'number') {
    n.geo = {'@type': 'GeoCoordinates', latitude: venue.latitude, longitude: venue.longitude}
  }
  if (venue.phone) n.telephone = venue.phone
  if (venue.website) n.sameAs = [venue.website]
  /*
    No aggregateRating. Not "omitted when empty" - there is no code path
    that emits one, because no rating on this site has known provenance.
  */
  return n
}

export function itemList({origin, venues, cityPath, name}) {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: venues.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: venues.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: venueNode({origin, venue: v, cityPath}),
    })),
  }
}

/** FAQPage only when the FAQ is real. Empty in, nothing out. */
export function faqPage(faqs) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null
  for (const f of faqs) {
    if (!f.question || !f.answer || !f.source_url) {
      throw new Error('An FAQ entry needs a question, an answer and a source_url. No invented Q&A.')
    }
  }
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {'@type': 'Answer', text: f.answer},
    })),
  }
}

/**
 * The full city graph. One venue array in, used for both the ItemList and
 * (by the caller) the visible rows.
 */
export function buildCityGraph({origin = PLACEHOLDER_ORIGIN, state, stateName, county, countySlug, city, citySlug, venues, faqs = null}) {
  const cityPath = `/pickleball/us/${state.toLowerCase()}/${citySlug}/`
  const graph = [
    breadcrumbList({origin, state, stateName, county, countySlug, city, citySlug}),
    itemList({origin, venues, cityPath, name: `Pickleball venues in ${city}, ${state}`}),
  ]
  const faq = faqPage(faqs)
  if (faq) graph.push(faq)
  return {'@context': 'https://schema.org', '@graph': graph}
}

export const renderLd = graph =>
  `<script type="application/ld+json">${JSON.stringify(graph)}</script>`
