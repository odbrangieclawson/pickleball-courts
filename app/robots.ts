import type {MetadataRoute} from 'next'
import {ORIGIN} from '../lib/site/sitemap.mjs'
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

  THE WHOLE DEMO IS NOINDEX TODAY. This build is a demonstration and every
  page carries noindex, so the rules below describe the shape of the live
  policy rather than something currently in force. The moment O10 mints a
  real hostname and the demo banner comes off, this file is the policy.
*/

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        /*
          Demo build: nothing is for indexing yet. When this goes live the
          line below becomes `allow: '/'` and the parameter disallows stay
          exactly as they are.
        */
        disallow: [
          '/',
          ...NOINDEX_PARAMS.map(p => `/*?${p}=`),
          ...NOINDEX_PARAMS.map(p => `/*&${p}=`),
        ],
      },
    ],
    sitemap: `${ORIGIN}/sitemap.xml`,
  }
}
