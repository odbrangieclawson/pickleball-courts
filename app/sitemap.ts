import type {MetadataRoute} from 'next'
import {sitemapEntries} from '../lib/site/sitemap.mjs'

/*
  Phase 4 deliverable 4: an XML sitemap generated only from published pages,
  with lastmod driven by date_checked.

  Two rules, both from the strategy's teardown of what the competitors do
  wrong:

  - ONLY PUBLISHED PAGES. PlayPickleball ships 25,245 URLs at 1.7 visits
    each. A sitemap is a claim that these pages are worth crawling, so a
    pending venue or a below-threshold county never appears. The entries come
    from the same link graph the pages link through, so the sitemap cannot
    drift from the site.

  - lastmod IS date_checked, not build time. A build does not change when a
    fact was last verified, and a sitemap that says otherwise is telling
    crawlers a page is fresh when nothing about it has been re-checked.

  The demo build is noindex throughout, so this sitemap describes pages that
  are deliberately not indexed yet. It becomes meaningful the day O10 fixes
  a real hostname and the noindex comes off.
*/

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries().map(e => ({
    url: e.url,
    lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }))
}
