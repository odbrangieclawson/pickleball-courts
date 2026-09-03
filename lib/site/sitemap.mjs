/*
  The published URL set — the one list the sitemap and the crawl report both
  read.

  Keeping them on the same source is the point. A sitemap built independently
  of the pages it describes is how a directory ends up advertising URLs it
  does not serve, and Phase 4 deliverable 5 asks for proof that the two
  agree. They cannot disagree if there is only one list.

  lastmod is date_checked — the newest verified date among the venues a page
  is built from. A rebuild does not move it, because a rebuild does not
  re-check anything.
*/

import * as data from './data.mjs'
import {buildLinkGraph, cityPath, countyPath, statePath, venuePath, filterPath, citySlugOf} from './links.mjs'
import {qualifyingFilters} from '../page/city-page.mjs'
import {venuePagePublishes} from './views.mjs'

/* O10: the real hostname is not minted yet. */
export const ORIGIN = process.env.SITE_ORIGIN ?? 'https://example.invalid'

const newest = venues => {
  const d = venues.map(v => v.date_checked).filter(Boolean).sort()
  return d[d.length - 1] ?? null
}

/**
 * @returns {{url:string, path:string, lastModified:string|null, changeFrequency:string, priority:number, type:string}[]}
 */
export function sitemapEntries() {
  const cities = data.publishedCities()
  const allVenues = cities.flatMap(c => data.city(c.state, c.slug).venues)
  const graph = buildLinkGraph(allVenues)

  const out = []
  const add = (path, lastModified, type, changeFrequency, priority) =>
    out.push({url: `${ORIGIN}${path}`, path, lastModified, changeFrequency, priority, type})

  add('/', newest(allVenues), 'home', 'weekly', 1.0)
  add('/how-we-verify/', null, 'editorial', 'yearly', 0.3)

  for (const [st] of graph.publishedStates) {
    add(statePath(st), newest(graph.byState.get(st).flatMap(c => c.venues)), 'state', 'monthly', 0.8)
  }

  for (const c of graph.publishedCounties.values()) {
    add(countyPath(c.state, c.county), newest(c.venues), 'county', 'monthly', 0.7)
  }

  for (const c of graph.publishedCities.values()) {
    add(cityPath(c.state, c.slug), newest(c.venues), 'city', 'weekly', 0.9)

    for (const f of Object.keys(qualifyingFilters(c.venues))) {
      add(filterPath(c.state, c.slug, f), newest(c.venues), 'filter', 'weekly', 0.6)
    }

    for (const v of c.venues) {
      /* A venue with no editorial fails Gate 4 and has no page, so it must
         not appear here. The sitemap is a claim that a page is worth
         crawling; making that claim about a page we refused to publish is
         the contradiction the CI gate run exists to catch. */
      if (!venuePagePublishes(c.state, c.slug, v.slug)) continue
      add(venuePath(c.state, c.slug, v.slug), v.date_checked ?? null, 'venue', 'monthly', 0.7)
    }
  }

  return out
}

/** Just the paths, for the crawl report. */
export const publishedPaths = () => new Set(sitemapEntries().map(e => e.path))
