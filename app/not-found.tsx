import type {Metadata} from 'next'
import {homeView, navView} from '../lib/site/views.mjs'

/*
  THE 404 PAGE. Decision O9.

  Next.js served its own default here, a bare "404: This page could not be
  found" with no way onward. O9 records why that is worth fixing: a lost
  visitor who lands on a dead URL and finds nothing leaves, and the same
  note names a competitor bleeding traffic through exactly this page.

  What a lost visitor needs is a way back in, so this page gives two: the
  search box that answers a city, state, ZIP or court name, and every state
  we publish, one click away. Both are plain HTML and both work with
  JavaScript off, which Rule 1 requires and Gate 2 checks.

  It cannot know which page the visitor wanted. A 404 in the App Router is
  rendered without the URL that produced it, and guessing "did you mean
  Seattle?" from a path we never published would be a claim like any other.
  So it says plainly that the page is not here, then hands over the whole
  directory.

  The numbers come from homeView(), which reads getCounts() — Rule 2. The
  state links come from navView(), the same link graph the nav uses, so a
  link here can never point at a page that did not publish.

  ROBOTS IS SET HERE AND MUST STAY SET.

  Next injects its own <meta name="robots" content="noindex"> on the
  not-found page, so this head always carries two robots tags. Without an
  override, the second is whatever the root layout resolved, and the layout
  uses PAGE_ROBOTS — which becomes "index, follow" the moment SITE_INDEXABLE
  is turned on at launch. That would put "noindex" and "index, follow" in
  one head and leave the outcome to a crawler's tie-break.

  Declaring it here keeps both tags saying the same thing in both states.
  follow is true on purpose: a 404 should never be indexed, but a crawler
  that lands on one should still follow the links out and rediscover the
  live pages. This is a literal-robots page, like the internal tooling, and
  it deliberately does not read PAGE_ROBOTS.
*/
export const metadata: Metadata = {
  title: 'Page not found',
  description:
    'That page is not on this site. Search for a city, state, ZIP code or court name, or browse the states we have verified.',
  robots: {index: false, follow: true},
}

export default function NotFound() {
  const v = homeView()
  const nav = navView()

  return (
    <div className="wrap page">
      <h1>That page is not here</h1>
      <p className="lede">
        The address you followed does not match anything we publish. It may
        have been mistyped, or it may be a page that never existed. Nothing
        has been taken down.
      </p>

      <form className="searchbar is-page" action="/search/" method="get" role="search">
        <label className="visually-hidden" htmlFor="q">
          City, state, ZIP code or court name
        </label>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="City, state, ZIP code, or court name"
          autoComplete="off"
        />
        <button type="submit">Search</button>
      </form>

      <h2>Where we cover</h2>
      <p>
        {v.venues} venues across {v.cityCount} {v.cityWordLower} in{' '}
        {v.stateCount} states, each with a named source and the date it was
        checked. Every one of them is one click from here.
      </p>
      <ul className="lost-states">
        {nav.groups.map(g => (
          <li key={g.state}>
            <a href={g.browseHref}>{g.label}</a>
            <span>{g.cityLabel}</span>
          </li>
        ))}
      </ul>

      <p>
        If you think this address should work, or you were looking for a
        court we do not have,{' '}
        <a href="/add-your-court/">tell us and we will look</a>.
      </p>
    </div>
  )
}
