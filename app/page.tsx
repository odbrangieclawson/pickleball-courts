/*
  PHASE 0 PLACEHOLDER.

  This page exists for one reason: to prove the rendering layer satisfies
  Rule 1 / Page Gate 2 before any real page is built. It carries no venue
  data, no counts and no claims about the world, because Phase 0 forbids
  content and data, and because no row is publishable until it has a
  source_url and a date_checked (Rule 12).

  It deliberately exercises the three things Gate 2 checks for:
    1. body content   -> the headings and paragraphs below
    2. links          -> the <a> elements below
    3. schema         -> the BreadcrumbList JSON-LD below

  All three are emitted by a Server Component, so they are present in the
  HTML the server sends. Run `npm run check:js-off` to assert that.
*/

import type {Metadata} from 'next'

export const metadata: Metadata = {
  title: 'Foundation',
  description:
    'Phase 0 placeholder. The directory is not published yet — no venue has been verified.',
  // Nothing here should ever be indexed. It is scaffolding, not a page.
  robots: {index: false, follow: false},
}

// Minimal BreadcrumbList. Real pages get this from a shared builder in a
// later phase; this literal exists only to prove JSON-LD reaches the HTML.
const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Deep Pickleball',
      item: 'https://example.invalid/',
    },
  ],
}

export default function FoundationPlaceholder() {
  return (
    <main>
      <h1>Deep Pickleball — foundation</h1>

      <p>
        This is a Phase 0 placeholder. The directory has no published pages
        yet. Nothing on this page describes a real venue.
      </p>

      <h2>Why this page exists</h2>
      <p>
        Rule 1 requires every page to render its full content, links and
        schema in raw HTML with JavaScript disabled. This page is the
        smallest thing that can prove the rendering layer does that.
      </p>

      <h2>Locked URL pattern</h2>
      <p>
        These routes are reserved and immutable. None of them is built yet —
        the links below are here so the JavaScript-off check has real anchor
        elements to find in the HTML.
      </p>
      <ul>
        <li>
          <a href="/pickleball/us/">Country root</a>
        </li>
        <li>
          <a href="/pickleball-gear/">Gear root</a>
        </li>
      </ul>

      <h2>Status</h2>
      <p>
        No venue has been verified. Counts are therefore not available, and
        under Rule 6 an unverified value is never rendered as zero.
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbLd)}}
      />
    </main>
  )
}
