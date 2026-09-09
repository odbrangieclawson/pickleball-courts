import type {MetadataRoute} from 'next'
import {ORIGIN, INDEXABLE} from '../lib/site/origin.mjs'
import {NOINDEX_PARAMS} from '../lib/site/facets.mjs'

/*
  Robots directives (Phase 5).

  DECISION D4: five indexable filters per city, and every other facet is a
  query parameter that must not be indexed. The five are real URLs with real
  pages; the rest are parameters on the city page.

  Two layers, because Disallow alone is the wrong tool:

  1. Disallow: /*?<param>=  keeps crawlers off the parameterised variants.
     A parameter URL is a different string for every combination of values,
     so left alone one city page becomes thousands of near-duplicate URLs —
     which is the cannibalisation Rule 9 exists to prevent and the exact
     shape of PlayPickleball's 25,245-page problem.

  2. The pages themselves carry noindex (see app/layout.tsx and each route's
     generateMetadata). Disallow stops crawling; noindex stops indexing, and
     a URL that is disallowed but linked from elsewhere can still be indexed
     without ever being fetched. Both are needed.

  THE SWITCH IS SITE_INDEXABLE, read in lib/site/origin.mjs. While it is
  off — as it was for the first thirty-five cities — the first rule below
  disallows everything and every page also carries noindex, so the
  parameter rules describe the shape of the live policy rather than
  something in force. When it is on, the site is allowed and the parameter
  disallows stay exactly as they are. Nothing else in this file changes on
  launch day; the internal tooling stays disallowed in both states.
*/

export default function robots(): MetadataRoute.Robots {
  const params = [
    ...NOINDEX_PARAMS.map(p => `/*?${p}=`),
    ...NOINDEX_PARAMS.map(p => `/*&${p}=`),
  ]
  return {
    rules: [
      /*
        /api/ is not content. The one handler under it reports which town
        the requesting IP resolves to, so it is per-visitor by definition
        and would be a nonsense thing for a crawler to hold. It also carries
        an x-robots-tag of its own, for the same belt-and-braces reason the
        parameter URLs carry noindex as well as a Disallow.
      */
      INDEXABLE
        ? {userAgent: '*', allow: '/', disallow: ['/internal/', '/api/', ...params]}
        : {userAgent: '*', disallow: ['/', ...params]},
    ],
    sitemap: `${ORIGIN}/sitemap.xml`,
  }
}
