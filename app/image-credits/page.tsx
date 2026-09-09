import type {Metadata} from 'next'
import {ORIGIN, PAGE_ROBOTS} from '../../lib/site/origin.mjs'
import {allPhotoCredits} from '../../lib/site/photos.mjs'

/*
  Every photograph on the site, with its author and its licence.

  This page is not a courtesy. CC BY and CC BY-SA are licences whose terms
  are attribution, and a credit line under each picture plus this full list
  is how those terms are met. It also does for images exactly what the rest
  of the site does for facts: names the source, so a reader can go and check.

  It is generated from data/images/photos.json, so a photograph cannot be
  published without appearing here, and a photograph cannot be removed from
  the site while its credit lingers.
*/
export const metadata: Metadata = {
  title: 'Image credits',
  description:
    'Every photograph on this site, with the photographer who took it and the licence it is published under.',
  robots: PAGE_ROBOTS,
  alternates: {canonical: '/image-credits/'},
}

const breadcrumbLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {'@type': 'ListItem', position: 1, name: 'Find Pickleball Courts', item: `${ORIGIN}/`},
    {'@type': 'ListItem', position: 2, name: 'Image credits', item: `${ORIGIN}/image-credits/`},
  ],
})

type Credit = {
  src: string
  where: string
  file?: string | null
  author: string | null
  licence: string | null
  licenceUrl: string | null
  filePage: string | null
}

function Row({c}: {c: Credit}) {
  return (
    <tr>
      <td>{c.where}</td>
      <td>{c.author ?? 'Not stated'}</td>
      <td>
        {c.licenceUrl
          ? <a href={c.licenceUrl} rel="nofollow">{c.licence}</a>
          : (c.licence ?? 'Not stated')}
      </td>
      <td>
        {c.filePage
          ? <a href={c.filePage} rel="nofollow">{c.file ?? 'file'}</a>
          : (c.file ?? '')}
      </td>
    </tr>
  )
}

export default function ImageCredits() {
  const {retrieved, courts} = allPhotoCredits()

  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: breadcrumbLd}} />
      <nav aria-label="Breadcrumb" className="crumbs">
        <a href="/">Home</a> › Image credits
      </nav>

      <h1>Image credits</h1>
      <p className="lede">
        Every photograph on this site comes from Wikimedia Commons under a
        licence that allows commercial republication. Here is who took each
        one and what that licence is. Retrieved {retrieved ?? 'not recorded'}.
      </p>

      <p>
        Only pickleball courts are published now. Photographs of cities,
        states and counties were removed from the site on 2026-09-09: a
        skyline, a courthouse or a mountain range is a true picture of the
        place and the wrong picture for a directory of places to play. The
        files are still in the repository, and nothing on the site links to
        them, so nothing here needs to credit them.
      </p>

      <h2>Court photographs</h2>
      <p>
        These appear on venue pages and venue cards, and every one is marked
        &ldquo;No photo yet&rdquo;. None of them is a photograph of the venue
        it appears on. Nobody has photographed the courts in this directory,
        and until somebody does, an image that implied otherwise would be a
        claim no source supports.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Used on</th><th>Photographer</th><th>Licence</th><th>File</th></tr>
          </thead>
          <tbody>{courts.map((c: Credit) => <Row key={c.src} c={c} />)}</tbody>
        </table>
      </div>

      <h2>If a photograph should not be here</h2>
      <p>
        If you took one of these and the credit is wrong, or you would rather
        it were not used, write to us from the{' '}
        <a href="/add-your-court/">contact page</a> and it comes down or gets
        corrected. If you have a real photograph of a court in this directory
        and are willing to license it, that is better than any of these and we
        would rather publish yours.
      </p>
    </div>
  )
}
